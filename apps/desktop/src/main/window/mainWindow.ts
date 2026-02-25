import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type MainWindowOptions = {
  width?: number;
  height?: number;
  onClosed?: () => void;
};

export class MainWindowManager {
  private window: BrowserWindow | null = null;
  private readonly options: MainWindowOptions;

  constructor(options: MainWindowOptions = {}) {
    this.options = options;
  }

  create(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      return this.window;
    }

    this.window = new BrowserWindow({
      width: this.options.width ?? 1200,
      height: this.options.height ?? 800,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload/preload.cjs")
      }
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    const rendererPath = path.join(__dirname, "../../renderer/index.html");
    const loadUrl = app.isPackaged ? `file://${rendererPath}` : devServerUrl;
    void this.window.loadURL(loadUrl);

    this.window.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      return { action: "deny" };
    });

    this.window.on("closed", () => {
      this.window = null;
      this.options.onClosed?.();
    });

    return this.window;
  }

  getWindow(): BrowserWindow | null {
    return this.window && !this.window.isDestroyed() ? this.window : null;
  }
}
