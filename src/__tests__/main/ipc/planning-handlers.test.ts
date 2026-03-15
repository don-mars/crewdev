// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PLANNING_UPLOAD,
  PLANNING_CREATE,
  PLANNING_LIST,
  PLANNING_DELETE,
} from '../../../shared/constants/ipc';

const mockUploadDoc = vi.hoisted(() => vi.fn());
const mockCreateDoc = vi.hoisted(() => vi.fn());
const mockListDocs = vi.hoisted(() => vi.fn());
const mockDeleteDoc = vi.hoisted(() => vi.fn());

vi.mock('../../../main/planning/planning-docs', () => ({
  uploadDoc: mockUploadDoc,
  createDoc: mockCreateDoc,
  listDocs: mockListDocs,
  deleteDoc: mockDeleteDoc,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerPlanningHandlers } from '../../../main/ipc/planning-handlers';
import type { ProjectContext } from '../../../main/project/project-context';

function createMockProjectContext(dirPath: string | null): ProjectContext {
  const planningDir = dirPath ? `${dirPath}/.crewdev/planning` : '';
  return {
    getProject: vi.fn().mockReturnValue(dirPath ? { dirPath } : null),
    get planningDir() { return planningDir; },
  } as unknown as ProjectContext;
}

describe('Planning IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  const planningDir = '/project/.crewdev/planning';

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    const ctx = createMockProjectContext('/project');
    registerPlanningHandlers(mockIpcMain as never, ctx);
  });

  it('should register handlers for all planning channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PLANNING_UPLOAD, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PLANNING_CREATE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PLANNING_LIST, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PLANNING_DELETE, expect.any(Function));
  });

  describe('planning:upload', () => {
    it('should delegate to uploadDoc with planningDir, sourcePath, fileName', async () => {
      const response = {
        success: true as const,
        data: { name: 'spec', fileName: 'spec.pdf', lastModified: '2026-03-12' },
      };
      mockUploadDoc.mockResolvedValue(response);

      const handler = handlers.get(PLANNING_UPLOAD)!;
      const result = await handler({}, '/tmp/spec.pdf', 'spec.pdf');

      expect(mockUploadDoc).toHaveBeenCalledWith(planningDir, '/tmp/spec.pdf', 'spec.pdf');
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
      registerPlanningHandlers(localIpc as never, noProjectCtx);

      const handler = localHandlers.get(PLANNING_UPLOAD)!;
      const result = await handler({}, '/tmp/spec.pdf', 'spec.pdf');

      expect(result).toEqual({
        success: false,
        error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
      });
    });

    it('should return error response on unexpected failure', async () => {
      mockUploadDoc.mockRejectedValue(new Error('copy failed'));

      const handler = handlers.get(PLANNING_UPLOAD)!;
      const result = await handler({}, '/tmp/spec.pdf', 'spec.pdf');

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('planning:create', () => {
    it('should delegate to createDoc with planningDir and name', async () => {
      const response = {
        success: true as const,
        data: { name: 'notes', fileName: 'notes.md', lastModified: '2026-03-12' },
      };
      mockCreateDoc.mockResolvedValue(response);

      const handler = handlers.get(PLANNING_CREATE)!;
      const result = await handler({}, 'notes');

      expect(mockCreateDoc).toHaveBeenCalledWith(planningDir, 'notes');
      expect(result).toEqual(response);
    });
  });

  describe('planning:list', () => {
    it('should delegate to listDocs with planningDir', async () => {
      const response = { success: true as const, data: [] };
      mockListDocs.mockResolvedValue(response);

      const handler = handlers.get(PLANNING_LIST)!;
      const result = await handler({});

      expect(mockListDocs).toHaveBeenCalledWith(planningDir);
      expect(result).toEqual(response);
    });
  });

  describe('planning:delete', () => {
    it('should delegate to deleteDoc with planningDir and fileName', async () => {
      const response = { success: true as const, data: undefined };
      mockDeleteDoc.mockResolvedValue(response);

      const handler = handlers.get(PLANNING_DELETE)!;
      const result = await handler({}, 'notes.md');

      expect(mockDeleteDoc).toHaveBeenCalledWith(planningDir, 'notes.md');
      expect(result).toEqual(response);
    });
  });
});
