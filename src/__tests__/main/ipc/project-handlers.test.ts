// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PROJECT_CREATE,
  PROJECT_LIST,
  PROJECT_SELECT,
  PROJECT_GIT_CONNECT,
} from '../../../shared/constants/ipc';

const mockCreateProject = vi.hoisted(() => vi.fn());
const mockLoadProject = vi.hoisted(() => vi.fn());
const mockHandleGitConnect = vi.hoisted(() => vi.fn());
const mockCopyDefaultConfigs = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true, data: undefined }));

vi.mock('../../../main/project/create-project', () => ({
  createProject: mockCreateProject,
}));

vi.mock('../../../main/project/load-projects', () => ({
  loadProject: mockLoadProject,
}));

vi.mock('../../../main/crew/crew-config', () => ({
  copyDefaultConfigs: mockCopyDefaultConfigs,
}));

vi.mock('../../../main/ipc/git-connect', () => ({
  handleGitConnect: mockHandleGitConnect,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerProjectHandlers } from '../../../main/ipc/project-handlers';
import type { ProjectContext } from '../../../main/project/project-context';

describe('Project IPC handlers', () => {
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

    mockProjectContext = {
      setProject: vi.fn(),
      getProject: vi.fn().mockReturnValue(null),
      get crewDir() { return '/test/.crewdev/crew'; },
    } as unknown as ProjectContext;

    registerProjectHandlers(mockIpcMain as never, mockProjectContext);
  });

  it('should register handlers for all project channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PROJECT_CREATE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PROJECT_LIST, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PROJECT_SELECT, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(PROJECT_GIT_CONNECT, expect.any(Function));
  });

  describe('project:create', () => {
    it('should delegate to createProject and return its response', async () => {
      const projectMeta = { id: 'abc', name: 'Test', dirPath: '/test', createdAt: '2026-03-12' };
      const response = { success: true as const, data: projectMeta };
      mockCreateProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_CREATE)!;
      const result = await handler({}, 'Test', '/test');

      expect(mockCreateProject).toHaveBeenCalledWith('Test', '/test');
      expect(result).toEqual(response);
    });

    it('should call setProject on ProjectContext after successful create', async () => {
      const projectMeta = { id: 'abc', name: 'Test', dirPath: '/test', createdAt: '2026-03-12' };
      const response = { success: true as const, data: projectMeta };
      mockCreateProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_CREATE)!;
      await handler({}, 'Test', '/test');

      expect(mockProjectContext.setProject).toHaveBeenCalledWith(projectMeta);
    });

    it('should call copyDefaultConfigs after successful create', async () => {
      const projectMeta = { id: 'abc', name: 'Test', dirPath: '/test', createdAt: '2026-03-12' };
      const response = { success: true as const, data: projectMeta };
      mockCreateProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_CREATE)!;
      await handler({}, 'Test', '/test');

      expect(mockCopyDefaultConfigs).toHaveBeenCalledWith('/test/.crewdev/crew');
    });

    it('should not call setProject when create fails', async () => {
      const response = {
        success: false as const,
        error: { code: 'DUPLICATE_PROJECT', message: 'Already exists' },
      };
      mockCreateProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_CREATE)!;
      await handler({}, 'Test', '/test');

      expect(mockProjectContext.setProject).not.toHaveBeenCalled();
    });

    it('should return error response on unexpected failure', async () => {
      mockCreateProject.mockRejectedValue(new Error('disk full'));

      const handler = handlers.get(PROJECT_CREATE)!;
      const result = await handler({}, 'Test', '/test');

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('project:list', () => {
    it('should delegate to loadProject and return projects list', async () => {
      const response = {
        success: true as const,
        data: { id: 'abc', name: 'Test', dirPath: '/test', createdAt: '2026-03-12' },
      };
      mockLoadProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_LIST)!;
      const result = await handler({}, '/test');

      expect(mockLoadProject).toHaveBeenCalledWith('/test');
      expect(result).toEqual(response);
    });
  });

  describe('project:select', () => {
    it('should delegate to loadProject with the given directory', async () => {
      const projectMeta = { id: 'abc', name: 'Test', dirPath: '/projects/test', createdAt: '2026-03-12' };
      const response = { success: true as const, data: projectMeta };
      mockLoadProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_SELECT)!;
      const result = await handler({}, '/projects/test');

      expect(mockLoadProject).toHaveBeenCalledWith('/projects/test');
      expect(result).toEqual(response);
    });

    it('should call setProject on ProjectContext after successful select', async () => {
      const projectMeta = { id: 'abc', name: 'Test', dirPath: '/projects/test', createdAt: '2026-03-12' };
      const response = { success: true as const, data: projectMeta };
      mockLoadProject.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_SELECT)!;
      await handler({}, '/projects/test');

      expect(mockProjectContext.setProject).toHaveBeenCalledWith(projectMeta);
    });
  });

  describe('project:git-connect', () => {
    it('should delegate to handleGitConnect and return its response', async () => {
      const response = {
        success: true as const,
        data: { branch: 'main', commits: [], isClean: true },
      };
      mockHandleGitConnect.mockResolvedValue(response);

      const handler = handlers.get(PROJECT_GIT_CONNECT)!;
      const result = await handler({}, '/my-repo');

      expect(mockHandleGitConnect).toHaveBeenCalledWith('/my-repo');
      expect(result).toEqual(response);
    });

    it('should return error response on unexpected failure', async () => {
      mockHandleGitConnect.mockRejectedValue(new Error('git not found'));

      const handler = handlers.get(PROJECT_GIT_CONNECT)!;
      const result = await handler({}, '/my-repo');

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });
});
