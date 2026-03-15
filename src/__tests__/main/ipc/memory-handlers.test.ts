// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MEMORY_READ, MEMORY_WRITE } from '../../../shared/constants/ipc';

const mockReadMemory = vi.hoisted(() => vi.fn());
const mockWriteMemory = vi.hoisted(() => vi.fn());

vi.mock('../../../main/memory/shared-memory', () => ({
  readMemory: mockReadMemory,
  writeMemory: mockWriteMemory,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerMemoryHandlers } from '../../../main/ipc/memory-handlers';
import type { ProjectContext } from '../../../main/project/project-context';

function createMockProjectContext(dirPath: string | null): ProjectContext {
  const memoryPath = dirPath ? `${dirPath}/.crewdev/memory.json` : '';
  return {
    getProject: vi.fn().mockReturnValue(dirPath ? { dirPath } : null),
    get memoryPath() { return memoryPath; },
  } as unknown as ProjectContext;
}

describe('Memory IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    const ctx = createMockProjectContext('/data');
    registerMemoryHandlers(mockIpcMain as never, ctx);
  });

  it('should register handlers for all memory channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(MEMORY_READ, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(MEMORY_WRITE, expect.any(Function));
  });

  describe('memory:read', () => {
    it('should delegate to readMemory with configured path', async () => {
      const response = {
        success: true as const,
        data: { projectId: 'abc', decisionLog: [], knowledgeProfile: {} },
      };
      mockReadMemory.mockResolvedValue(response);

      const handler = handlers.get(MEMORY_READ)!;
      const result = await handler({});

      expect(mockReadMemory).toHaveBeenCalledWith('/data/.crewdev/memory.json');
      expect(result).toEqual(response);
    });

    it('should return NO_ACTIVE_PROJECT when no project set', async () => {
      const noProjectCtx = createMockProjectContext(null);
      const localHandlers = new Map<string, (...args: unknown[]) => unknown>();
      const localIpc = {
        handle: vi.fn((ch: string, h: (...args: unknown[]) => unknown) => {
          localHandlers.set(ch, h);
        }),
      };
      registerMemoryHandlers(localIpc as never, noProjectCtx);

      const handler = localHandlers.get(MEMORY_READ)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
      });
    });

    it('should return error response on unexpected failure', async () => {
      mockReadMemory.mockRejectedValue(new Error('read failed'));

      const handler = handlers.get(MEMORY_READ)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('memory:write', () => {
    it('should delegate to writeMemory with path and patch', async () => {
      const response = { success: true as const, data: undefined };
      mockWriteMemory.mockResolvedValue(response);

      const patch = { knowledgeProfile: { typescript: 3 } };
      const handler = handlers.get(MEMORY_WRITE)!;
      const result = await handler({}, patch);

      expect(mockWriteMemory).toHaveBeenCalledWith('/data/.crewdev/memory.json', patch);
      expect(result).toEqual(response);
    });

    it('should return error response on unexpected failure', async () => {
      mockWriteMemory.mockRejectedValue(new Error('write failed'));

      const handler = handlers.get(MEMORY_WRITE)!;
      const result = await handler({}, {});

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });
});
