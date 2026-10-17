import { app, BrowserWindow, dialog, shell } from "electron";
import { fork, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;
let serverUrl = DEV_URL;
let isQuitting = false;
let serverReady = false;

// Log file (also visible to support):
//   macOS   ~/Library/Logs/Bizora/main.log
//   Windows %APPDATA%\Bizora\logs\main.log
//   Linux   ~/.config/Bizora/logs/main.log
function logFilePath() {
  return path.join(app.getPath("logs"), "main.log");
}

function log(...parts: unknown[]) {
  const line = `[${new Date().toISOString()}] ${parts
    .map((p) => (p instanceof Error ? (p.stack ?? p.message) : String(p)))
    .join(" ")}\n`;
  try {
    fs.mkdirSync(app.getPath("logs"), { recursive: true });
    fs.appendFileSync(logFilePath(), line);
  } catch {
    /* logging must never crash the app */
  }
  console.log(line.trimEnd());
}

process.on("uncaughtException", (error) => {
  log("uncaughtException", error);
  dialog.showErrorBox("Bizora crashed", `${error.message}\n\nLog: ${logFilePath()}`);
});

// Only one copy may run: two copies would fight over the SQLite file.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address() as net.AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(url: string, proc: ChildProcess, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isQuitting) throw new Error("Bizora is shutting down.");
    if (proc.exitCode !== null || proc.signalCode !== null) {
      throw new Error(
        `Local server stopped while starting (code ${proc.exitCode}, signal ${proc.signalCode}).`,
      );
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Local server did not start in time at ${url}.`);
}

async function startProductionServer() {
  const appDir = path.join(process.resourcesPath, "app");
  const serverPath = path.join(appDir, "server.js");
  log("Starting server:", serverPath, "| userData:", app.getPath("userData"));
  const migrationsDir = path.join(process.resourcesPath, "drizzle");

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Packaged server not found: ${serverPath}`);
  }

  // Writable per-user folder. Database + uploads live here and survive updates.
  //   macOS   ~/Library/Application Support/Bizora
  //   Windows %APPDATA%\Bizora
  //   Linux   ~/.config/Bizora
  const userData = app.getPath("userData");
  fs.mkdirSync(userData, { recursive: true });

  const port = await getFreePort();
  serverUrl = `http://127.0.0.1:${port}`;

  nextServer = fork(serverPath, [], {
    cwd: appDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      BIZORA_USER_DATA_DIR: userData,
      BIZORA_MIGRATIONS_DIR: migrationsDir,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  nextServer.stdout?.on("data", (d) => log("[server]", String(d).trimEnd()));
  nextServer.stderr?.on("data", (d) => log("[server:error]", String(d).trimEnd()));

  nextServer.on("exit", (code, signal) => {
    log(`Server exited (code ${code}, signal ${signal ?? "none"}).`);
    // During startup the error dialog is shown by the startup code instead.
    if (serverReady && !isQuitting) app.quit();
  });

  await waitForServer(serverUrl, nextServer);
  serverReady = true;
  log("Server ready at", serverUrl);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in the real browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(serverUrl)) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.webContents.on("did-fail-load", (_e, code, description, url) => {
    log("did-fail-load", code, description, url);
    mainWindow?.show();
  });

  // "/" decides: business not set up -> /setup, otherwise -> /dashboard
  void mainWindow.loadURL(serverUrl);
}

app.whenReady().then(async () => {
  try {
    if (!isDev) await startProductionServer();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    log("Startup failed:", error instanceof Error ? error : String(error));
    dialog.showErrorBox(
      "Bizora could not start",
      `${error instanceof Error ? error.message : String(error)}\n\nLog file: ${logFilePath()}`,
    );
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  if (nextServer && !nextServer.killed) nextServer.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
