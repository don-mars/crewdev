import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CREW_OUTPUT } from '../../shared/constants/ipc';

type IpcHandler = (_event: unknown, line: string) => void;
const registeredHandlers: Map<string, IpcHandler[]> = new Map();

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn((channel: string, handler: IpcHandler) => {
      const handlers = registeredHandlers.get(channel) ?? [];
      handlers.push(handler);
      registeredHandlers.set(channel, handlers);
    }),
    removeListener: vi.fn((channel: string, handler: IpcHandler) => {
      const handlers = registeredHandlers.get(channel) ?? [];
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
      registeredHandlers.set(channel, handlers);
    }),
  },
}));

describe('preload crew.onOutput', () => {
  beforeEach(() => {
    registeredHandlers.clear();
    vi.resetModules();
  });

  it('should register callback for crew output events', async () => {
    await import('../../preload/index');
    const { contextBridge } = await import('electron');

    const exposeCall = vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
    const api = exposeCall[1] as { crew: { onOutput: (id: string, cb: (line: string) => void) => () => void } };

    const callback = vi.fn();
    api.crew.onOutput('crew-1', callback);

    const channel = `${CREW_OUTPUT}:crew-1`;
    expect(registeredHandlers.get(channel)?.length).toBe(1);
  });

  it('should return cleanup function that removes listener', async () => {
    await import('../../preload/index');
    const { contextBridge } = await import('electron');

    const exposeCall = vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
    const api = exposeCall[1] as { crew: { onOutput: (id: string, cb: (line: string) => void) => () => void } };

    const callback = vi.fn();
    const cleanup = api.crew.onOutput('crew-1', callback);

    expect(typeof cleanup).toBe('function');

    cleanup();

    const channel = `${CREW_OUTPUT}:crew-1`;
    expect(registeredHandlers.get(channel)?.length).toBe(0);
  });

  it('should not receive events after cleanup is called', async () => {
    await import('../../preload/index');
    const { contextBridge } = await import('electron');

    const exposeCall = vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0];
    const api = exposeCall[1] as { crew: { onOutput: (id: string, cb: (line: string) => void) => () => void } };

    const callback = vi.fn();
    const cleanup = api.crew.onOutput('crew-1', callback);

    // Simulate receiving an event
    const channel = `${CREW_OUTPUT}:crew-1`;
    const handlers = registeredHandlers.get(channel) ?? [];
    handlers.forEach(h => h(null, 'before cleanup'));

    expect(callback).toHaveBeenCalledTimes(1);

    cleanup();

    // No handlers left to call after cleanup
    const remaining = registeredHandlers.get(channel) ?? [];
    remaining.forEach(h => h(null, 'after cleanup'));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
