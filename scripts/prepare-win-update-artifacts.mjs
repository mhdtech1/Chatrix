#!/usr/bin/env node

import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const desktopDir = process.cwd();
const distDir = path.join(desktopDir, "dist");
const latestYmlPath = [
  path.join(distDir, "latest.yml"),
  path.join(distDir, "nsis-web", "latest.yml"),
].find((candidate) => existsSync(candidate));

if (!latestYmlPath) {
  console.log("[win-update] skipping: latest.yml was not found");
  process.exit(0);
}

const stableYmlPath = path.join(path.dirname(latestYmlPath), "stable.yml");

copyFileSync(latestYmlPath, stableYmlPath);
console.log(
  `[win-update] generated ${path.relative(distDir, stableYmlPath)} from ${path.relative(distDir, latestYmlPath)}`,
);
