import { describe, it, expect, vi, beforeEach } from 'vitest';

let exposedApi: Record<string, unknown> = {};

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((apiKey: string, api: Record<string, unknown>) => {
      exposedApi = { [apiKey]: api };
    }),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe('Preload contextBridge', () => {
  beforeEach(async () => {
    exposedApi = {};
    vi.resetModules();
  });

  it('should expose crewdev object on window', async () => {
    await import('../../preload/index');

    expect(exposedApi).toHaveProperty('crewdev');
    expect(typeof exposedApi.crewdev).toBe('object');
  });

  it('should NOT expose ipcRenderer directly', async () => {
    await import('../../preload/index');

    expect(exposedApi).not.toHaveProperty('ipcRenderer');
    // Also check that crewdev doesn't leak ipcRenderer
    const crewdevApi = exposedApi.crewdev as Record<string, unknown>;
    expect(crewdevApi).not.toHaveProperty('ipcRenderer');
  });

  it('should NOT expose require or process on window', async () => {
    await import('../../preload/index');

    expect(exposedApi).not.toHaveProperty('require');
    expect(exposedApi).not.toHaveProperty('process');

    const crewdevApi = exposedApi.crewdev as Record<string, unknown>;
    expect(crewdevApi).not.toHaveProperty('require');
    expect(crewdevApi).not.toHaveProperty('process');
  });

  it('should expose typed API methods under crewdev', async () => {
    await import('../../preload/index');

    const crewdevApi = exposedApi.crewdev as Record<string, unknown>;
    // At minimum, the API should expose some method namespaces
    expect(Object.keys(crewdevApi).length).toBeGreaterThan(0);
  });
});
