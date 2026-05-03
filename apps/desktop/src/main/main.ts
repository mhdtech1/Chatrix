import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const findEnvFileUpwards = (start: string) => {
  let current = start;
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
};

// In a packaged install the cwd can be a writable directory shared
// with other users (e.g. a Downloads folder), so a planted .env there
// could override broker URLs and steal future tokens. Limit the
// cwd-walk to dev / unpackaged runs only. Installed builds always
// read from the per-user `userData` directory instead.
if (!app.isPackaged) {
  const upwardEnv = findEnvFileUpwards(process.cwd());
  if (upwardEnv) loadEnvFile(upwardEnv);
}
try {
  loadEnvFile(path.join(app.getPath("userData"), ".env"));
} catch {
  // app may not be ready in some test contexts; userData lookup is optional
}

await import("./runtime.js");
