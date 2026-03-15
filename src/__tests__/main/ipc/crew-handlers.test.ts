// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CrewMemberConfig, CrewProcess } from '../../../shared/types/crew';
import {
  CREW_SPAWN,
  CREW_KILL,
  CREW_KILL_ALL,
  CREW_SEND_INPUT,
} from '../../../shared/constants/ipc';

const mockLoadCrewConfig = vi.hoisted(() => vi.fn());

vi.mock('../../../main/crew/crew-config', () => ({
  loadCrewConfig: mockLoadCrewConfig,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerCrewHandlers } from '../../../main/ipc/crew-handlers';
import type { ProjectContext } from '../../../main/project/project-context';

describe('Crew IPC handlers', () => {
  let mockIpcMain: {
    handle: ReturnType<typeof vi.fn>;
  };
  let mockCrewManager: {
    spawn: ReturnType<typeof vi.fn>;
    kill: ReturnType<typeof vi.fn>;
    killAll: ReturnType<typeof vi.fn>;
    sendInput: ReturnType<typeof vi.fn>;
    getProcess: ReturnType<typeof vi.fn>;
    getActiveCount: ReturnType<typeof vi.fn>;
    onOutput: ReturnType<typeof vi.fn>;
    onStderr: ReturnType<typeof vi.fn>;
  };
  let mockProjectContext: ProjectContext;
  let handlers: Map<string, (...args: unknown[]) => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    mockCrewManager = {
      spawn: vi.fn(),
      kill: vi.fn(),
      killAll: vi.fn(),
      sendInput: vi.fn(),
      getProcess: vi.fn(),
      getActiveCount: vi.fn(),
      onOutput: vi.fn(),
      onStderr: vi.fn(),
    };

    mockLoadCrewConfig.mockResolvedValue({ success: true, data: '# Config content' });

    mockProjectContext = {
      getProject: vi.fn().mockReturnValue({ dirPath: '/project' }),
      setProject: vi.fn(),
      get crewDir() { return '/project/.crewdev/crew'; },
    } as unknown as ProjectContext;

    registerCrewHandlers(
      mockIpcMain as never,
      mockCrewManager as never,
      mockProjectContext,
    );
  });

  it('should register handlers for all crew channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(CREW_SPAWN, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(CREW_KILL, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(CREW_KILL_ALL, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(CREW_SEND_INPUT, expect.any(Function));
  });

  describe('crew:spawn', () => {
    const config: CrewMemberConfig = {
      id: 'builder-1',
      name: 'Builder',
      role: 'builder',
      configContent: '# Builder config',
    };

    it('should return success response with CrewProcess on spawn', async () => {
      const crewProcess: CrewProcess = { id: 'builder-1', pid: 1234, status: 'running' };
      mockCrewManager.spawn.mockResolvedValue(crewProcess);

      const handler = handlers.get(CREW_SPAWN)!;
      const result = await handler({}, config);

      expect(result).toEqual({ success: true, data: crewProcess });
      expect(mockCrewManager.spawn).toHaveBeenCalledWith(
        expect.objectContaining({ ...config, cwd: '/project' }),
      );
    });

    it('should load crew config from disk when configContent is empty', async () => {
      const emptyConfig: CrewMemberConfig = {
        id: 'builder-1',
        name: 'Builder',
        role: 'builder',
        configContent: '',
      };
      const crewProcess: CrewProcess = { id: 'builder-1', pid: 1234, status: 'running' };
      mockCrewManager.spawn.mockResolvedValue(crewProcess);

      const handler = handlers.get(CREW_SPAWN)!;
      await handler({}, emptyConfig);

      expect(mockLoadCrewConfig).toHaveBeenCalledWith('/project/.crewdev/crew', 'builder-1');
      expect(mockCrewManager.spawn).toHaveBeenCalledWith(
        expect.objectContaining({ configContent: '# Config content' }),
      );
    });

    it('should register onOutput callback when outputHandler is provided', async () => {
      const mockOutputHandler = vi.fn();
      const localHandlers = new Map<string, (...args: unknown[]) => unknown>();
      const localIpc = {
        handle: vi.fn((ch: string, h: (...args: unknown[]) => unknown) => {
          localHandlers.set(ch, h);
        }),
      };
      registerCrewHandlers(
        localIpc as never,
        mockCrewManager as never,
        mockProjectContext,
        mockOutputHandler,
      );

      const crewProcess: CrewProcess = { id: 'builder-1', pid: 1234, status: 'running' };
      mockCrewManager.spawn.mockResolvedValue(crewProcess);

      const handler = localHandlers.get(CREW_SPAWN)!;
      await handler({}, config);

      expect(mockCrewManager.onOutput).toHaveBeenCalledWith(config.id, expect.any(Function));
    });

    it('should return error response when spawn fails', async () => {
      mockCrewManager.spawn.mockRejectedValue({
        code: 'SPAWN_FAILED',
        message: 'Could not start the coding agent.',
      });

      const handler = handlers.get(CREW_SPAWN)!;
      const result = await handler({}, config);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'SPAWN_FAILED',
          message: 'Could not start the coding agent.',
        },
      });
    });

    it('should return generic error for unexpected exceptions', async () => {
      mockCrewManager.spawn.mockRejectedValue(new Error('something broke'));

      const handler = handlers.get(CREW_SPAWN)!;
      const result = await handler({}, config);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });

  describe('crew:kill', () => {
    it('should return success response on kill', async () => {
      mockCrewManager.kill.mockReturnValue(undefined);

      const handler = handlers.get(CREW_KILL)!;
      const result = await handler({}, 'builder-1');

      expect(result).toEqual({ success: true, data: null });
      expect(mockCrewManager.kill).toHaveBeenCalledWith('builder-1');
    });

    it('should return error response when process not found', async () => {
      mockCrewManager.kill.mockImplementation(() => {
        throw { code: 'PROCESS_NOT_FOUND', message: 'No active process found with id "bad-id"' };
      });

      const handler = handlers.get(CREW_KILL)!;
      const result = await handler({}, 'bad-id');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message: 'No active process found with id "bad-id"',
        },
      });
    });
  });

  describe('crew:kill-all', () => {
    it('should return success response on killAll', async () => {
      mockCrewManager.killAll.mockReturnValue(undefined);

      const handler = handlers.get(CREW_KILL_ALL)!;
      const result = await handler({});

      expect(result).toEqual({ success: true, data: null });
      expect(mockCrewManager.killAll).toHaveBeenCalled();
    });

    it('should return error response on failure', async () => {
      mockCrewManager.killAll.mockImplementation(() => {
        throw new Error('kill failed');
      });

      const handler = handlers.get(CREW_KILL_ALL)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });

  describe('crew:send-input', () => {
    it('should return success response on sendInput', async () => {
      mockCrewManager.sendInput.mockReturnValue(undefined);

      const handler = handlers.get(CREW_SEND_INPUT)!;
      const result = await handler({}, 'builder-1', 'write a function');

      expect(result).toEqual({ success: true, data: null });
      expect(mockCrewManager.sendInput).toHaveBeenCalledWith('builder-1', 'write a function');
    });

    it('should return error response when sending input to missing process', async () => {
      mockCrewManager.sendInput.mockImplementation(() => {
        throw { code: 'PROCESS_NOT_FOUND', message: 'No active process found' };
      });

      const handler = handlers.get(CREW_SEND_INPUT)!;
      const result = await handler({}, 'ghost', 'hello');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'PROCESS_NOT_FOUND',
          message: 'No active process found',
        },
      });
    });
  });
});
