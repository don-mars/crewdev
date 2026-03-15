// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FEATURE_CREATE,
  FEATURE_READ,
  FEATURE_UPDATE,
  FEATURE_DELETE,
  FEATURE_LOAD_TREE,
} from '../../../shared/constants/ipc';

const mockCreateFeature = vi.hoisted(() => vi.fn());
const mockReadFeature = vi.hoisted(() => vi.fn());
const mockUpdateFeature = vi.hoisted(() => vi.fn());
const mockDeleteFeature = vi.hoisted(() => vi.fn());
const mockLoadTree = vi.hoisted(() => vi.fn());

vi.mock('../../../main/features/feature-crud', () => ({
  createFeature: mockCreateFeature,
  readFeature: mockReadFeature,
  updateFeature: mockUpdateFeature,
  deleteFeature: mockDeleteFeature,
}));

vi.mock('../../../main/features/feature-tree', () => ({
  loadTree: mockLoadTree,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerFeatureHandlers } from '../../../main/ipc/feature-handlers';
import type { ProjectContext } from '../../../main/project/project-context';

function createMockProjectContext(dirPath: string | null): ProjectContext {
  const featuresDir = dirPath ? `${dirPath}/.crewdev/features` : '';
  return {
    getProject: vi.fn().mockReturnValue(dirPath ? { dirPath } : null),
    get featuresDir() { return featuresDir; },
  } as unknown as ProjectContext;
}

describe('Feature IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    mockProjectContext = createMockProjectContext('/project');
    registerFeatureHandlers(mockIpcMain as never, mockProjectContext);
  });

  it('should register handlers for all feature channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(FEATURE_CREATE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(FEATURE_READ, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(FEATURE_UPDATE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(FEATURE_DELETE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(FEATURE_LOAD_TREE, expect.any(Function));
  });

  describe('feature:create', () => {
    it('should delegate to createFeature with featuresDir and input', async () => {
      const input = { title: 'Auth', status: 'planned', parent: null, body: 'Auth feature' };
      const response = {
        success: true as const,
        data: { id: 'abc', ...input },
      };
      mockCreateFeature.mockResolvedValue(response);

      const handler = handlers.get(FEATURE_CREATE)!;
      const result = await handler({}, input);

      expect(mockCreateFeature).toHaveBeenCalledWith('/project/.crewdev/features', input);
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
      registerFeatureHandlers(localIpc as never, noProjectCtx);

      const handler = localHandlers.get(FEATURE_CREATE)!;
      const result = await handler({}, { title: 'X' });

      expect(result).toEqual({
        success: false,
        error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
      });
    });

    it('should return error response on unexpected failure', async () => {
      mockCreateFeature.mockRejectedValue(new Error('disk full'));

      const handler = handlers.get(FEATURE_CREATE)!;
      const result = await handler({}, { title: 'X' });

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('feature:read', () => {
    it('should delegate to readFeature with featuresDir and id', async () => {
      const response = {
        success: true as const,
        data: { id: 'abc', title: 'Auth', status: 'planned', parent: null, body: '' },
      };
      mockReadFeature.mockResolvedValue(response);

      const handler = handlers.get(FEATURE_READ)!;
      const result = await handler({}, 'abc');

      expect(mockReadFeature).toHaveBeenCalledWith('/project/.crewdev/features', 'abc');
      expect(result).toEqual(response);
    });
  });

  describe('feature:update', () => {
    it('should delegate to updateFeature with featuresDir, id, and updates', async () => {
      const response = {
        success: true as const,
        data: { id: 'abc', title: 'Auth v2', status: 'in-progress', parent: null, body: '' },
      };
      mockUpdateFeature.mockResolvedValue(response);

      const handler = handlers.get(FEATURE_UPDATE)!;
      const result = await handler({}, 'abc', { title: 'Auth v2' });

      expect(mockUpdateFeature).toHaveBeenCalledWith('/project/.crewdev/features', 'abc', { title: 'Auth v2' });
      expect(result).toEqual(response);
    });
  });

  describe('feature:delete', () => {
    it('should delegate to deleteFeature with featuresDir and id', async () => {
      const response = { success: true as const, data: undefined };
      mockDeleteFeature.mockResolvedValue(response);

      const handler = handlers.get(FEATURE_DELETE)!;
      const result = await handler({}, 'abc');

      expect(mockDeleteFeature).toHaveBeenCalledWith('/project/.crewdev/features', 'abc');
      expect(result).toEqual(response);
    });
  });

  describe('feature:load-tree', () => {
    it('should delegate to loadTree with featuresDir', async () => {
      const response = { success: true as const, data: [] };
      mockLoadTree.mockResolvedValue(response);

      const handler = handlers.get(FEATURE_LOAD_TREE)!;
      const result = await handler({});

      expect(mockLoadTree).toHaveBeenCalledWith('/project/.crewdev/features');
      expect(result).toEqual(response);
    });

    it('should return error response on unexpected failure', async () => {
      mockLoadTree.mockRejectedValue(new Error('read error'));

      const handler = handlers.get(FEATURE_LOAD_TREE)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });
});
