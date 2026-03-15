import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define Vite globals that Electron Forge injects at build time
declare const globalThis: { MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined; MAIN_WINDOW_VITE_NAME: string };
globalThis.MAIN_WINDOW_VITE_DEV_SERVER_URL = 'http://localhost:5173';
globalThis.MAIN_WINDOW_VITE_NAME = 'main_window';

// Track constructor calls
let windowConstructorArgs: Record<string, unknown>[] = [];

vi.mock('electron', () => {
  const appCallbacks: Record<string, Function> = {};

  function MockBrowserWindow(opts: Record<string, unknown>) {
    windowConstructorArgs.push(opts);
    return {
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      once: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
      webContents: { openDevTools: vi.fn() },
    };
  }
  MockBrowserWindow.getAllWindows = vi.fn(() => []);

  return {
    app: {
      on: vi.fn((event: string, cb: Function) => {
        appCallbacks[event] = cb;
      }),
      quit: vi.fn(),
      dock: { bounce: vi.fn() },
      _trigger: (event: string) => appCallbacks[event]?.(),
    },
    BrowserWindow: MockBrowserWindow,
    ipcMain: { handle: vi.fn() },
  };
});

vi.mock('electron-squirrel-startup', () => ({ default: false }));

vi.mock('../../main/ipc/register-all', () => ({
  registerAllHandlers: vi.fn(),
}));

describe('BrowserWindow creation', () => {
  beforeEach(async () => {
    windowConstructorArgs = [];
    vi.resetModules();
  });

  async function importMainAndTriggerReady(): Promise<void> {
    await import('../../main');
    const { app } = await import('electron');
    (app as unknown as { _trigger: (e: string) => void })._trigger('ready');
  }

  it('should create window with contextIsolation: true', async () => {
    await importMainAndTriggerReady();

    expect(windowConstructorArgs.length).toBe(1);
    const opts = windowConstructorArgs[0] as { webPreferences: { contextIsolation: boolean } };
    expect(opts.webPreferences.contextIsolation).toBe(true);
  });

  it('should create window with nodeIntegration: false', async () => {
    await importMainAndTriggerReady();

    const opts = windowConstructorArgs[0] as { webPreferences: { nodeIntegration: boolean } };
    expect(opts.webPreferences.nodeIntegration).toBe(false);
  });

  it('should create window with sandbox: true', async () => {
    await importMainAndTriggerReady();

    const opts = windowConstructorArgs[0] as { webPreferences: { sandbox: boolean } };
    expect(opts.webPreferences.sandbox).toBe(true);
  });

  it('should set correct preload script path', async () => {
    await importMainAndTriggerReady();

    const opts = windowConstructorArgs[0] as { webPreferences: { preload: string } };
    expect(opts.webPreferences.preload).toBeDefined();
    expect(typeof opts.webPreferences.preload).toBe('string');
    expect(opts.webPreferences.preload).toContain('index');
  });
});
