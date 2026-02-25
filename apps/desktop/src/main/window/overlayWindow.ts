import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class OverlayWindowManager {
  private window: BrowserWindow | null = null;
  private locked = false;

  create(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 1100,
      height: 700,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true,
      movable: true,
      hasShadow: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload/preload.cjs")
      }
    });

    this.window.setAlwaysOnTop(true, "screen-saver");
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.window.setIgnoreMouseEvents(false);
    this.setLocked(false);

    const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    const rendererPath = path.join(__dirname, "../../renderer/index.html");
    const overlayUrl = app.isPackaged ? `file://${rendererPath}#overlay` : `${devServerUrl}#overlay`;
    void this.window.loadURL(overlayUrl);

    this.window.on("closed", () => {
      this.window = null;
      this.locked = false;
    });

    return this.window;
  }

  close(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.close();
  }

  setLocked(locked: boolean): { locked: boolean } {
    this.locked = locked;
    if (this.window && !this.window.isDestroyed()) {
      this.window.setMovable(!locked);
      this.window.setResizable(!locked);
    }
    return { locked: this.locked };
  }

  getWindow(): BrowserWindow | null {
    return this.window && !this.window.isDestroyed() ? this.window : null;
  }
}
