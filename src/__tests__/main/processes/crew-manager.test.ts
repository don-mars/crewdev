import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import type { CrewMemberConfig } from '../../../shared/types/crew';
import { CrewManager } from '../../../main/processes/crew-manager';

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockChildProcess(pid = 1234) {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: ReturnType<typeof vi.fn> };
    pid: number;
    kill: ReturnType<typeof vi.fn>;
    killed: boolean;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.stdin = { write: vi.fn() };
  proc.pid = pid;
  proc.kill = vi.fn(() => {
    proc.killed = true;
    proc.emit('close', 0, null);
  });
  proc.killed = false;
  return proc;
}

function createMockSpawn(mockProc: ReturnType<typeof createMockChildProcess>) {
  return vi.fn(() => mockProc) as unknown as typeof import('node:child_process').spawn;
}

const DEFAULT_CONFIG: CrewMemberConfig = {
  id: 'builder-1',
  name: 'Builder',
  role: 'builder',
  configContent: '# Builder config',
};

describe('CrewManager', () => {
  let mockProc: ReturnType<typeof createMockChildProcess>;
  let mockSpawn: ReturnType<typeof createMockSpawn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockProc = createMockChildProcess();
    mockSpawn = createMockSpawn(mockProc);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('spawn()', () => {
    it('should return CrewProcess with pid and status running', async () => {
      const manager = new CrewManager(mockSpawn);
      const result = await manager.spawn(DEFAULT_CONFIG);

      expect(result.pid).toBe(1234);
      expect(result.status).toBe('running');
      expect(result.id).toBe('builder-1');
    });

    it('should throw SPAWN_FAILED when CLI binary not found', async () => {
      const errProc = createMockChildProcess();
      // Override pid to 0 to simulate failed spawn
      errProc.pid = 0;
      const errSpawn = vi.fn(() => {
        // Emit error on next microtask (before promise settles)
        process.nextTick(() => {
          const err = new Error('spawn claude ENOENT') as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          errProc.emit('error', err);
        });
        return errProc;
      }) as unknown as typeof import('node:child_process').spawn;

      const manager = new CrewManager(errSpawn);

      await expect(manager.spawn(DEFAULT_CONFIG)).rejects.toMatchObject({
        code: 'SPAWN_FAILED',
      });
    });

    it('should handle stdout.data events', async () => {
      const manager = new CrewManager(mockSpawn);
      const onOutput = vi.fn();
      manager.onOutput(DEFAULT_CONFIG.id, onOutput);

      await manager.spawn(DEFAULT_CONFIG);
      mockProc.stdout.emit('data', Buffer.from('Hello from Claude\n'));

      expect(onOutput).toHaveBeenCalledWith('Hello from Claude\n');
    });

    it('should handle stderr.data events', async () => {
      const manager = new CrewManager(mockSpawn);
      const onStderr = vi.fn();
      manager.onStderr(DEFAULT_CONFIG.id, onStderr);

      await manager.spawn(DEFAULT_CONFIG);
      mockProc.stderr.emit('data', Buffer.from('Warning: something\n'));

      expect(onStderr).toHaveBeenCalledWith('Warning: something\n');
    });

    it('should handle process error events and set status to error', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      mockProc.emit('error', new Error('unexpected crash'));

      const process = manager.getProcess(DEFAULT_CONFIG.id);
      expect(process?.status).toBe('error');
    });

    it('should handle process close events and set status to idle', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      mockProc.emit('close', 0, null);

      const process = manager.getProcess(DEFAULT_CONFIG.id);
      expect(process?.status).toBe('idle');
    });

    it('should kill process after inactivity timeout', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      expect(mockProc.kill).toHaveBeenCalled();
    });

    it('should reset timeout on new stdout data', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      // Advance 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);

      // New output resets timer
      mockProc.stdout.emit('data', Buffer.from('still working\n'));

      // Advance another 4 minutes (only 4 from last output)
      vi.advanceTimersByTime(4 * 60 * 1000);
      expect(mockProc.kill).not.toHaveBeenCalled();

      // Advance past timeout from last output
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(mockProc.kill).toHaveBeenCalled();
    });
  });

  describe('kill()', () => {
    it('should terminate the correct process by id', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      manager.kill(DEFAULT_CONFIG.id);

      expect(mockProc.kill).toHaveBeenCalled();
    });

    it('should update process status to idle after kill', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      manager.kill(DEFAULT_CONFIG.id);

      const process = manager.getProcess(DEFAULT_CONFIG.id);
      expect(process?.status).toBe('idle');
    });

    it('should throw if process id does not exist', () => {
      const manager = new CrewManager(mockSpawn);

      expect(() => manager.kill('nonexistent')).toThrowError();
    });

    it('should clean up all event listeners', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      expect(mockProc.stdout.listenerCount('data')).toBeGreaterThan(0);
      expect(mockProc.stderr.listenerCount('data')).toBeGreaterThan(0);

      manager.kill(DEFAULT_CONFIG.id);

      expect(mockProc.stdout.listenerCount('data')).toBe(0);
      expect(mockProc.stderr.listenerCount('data')).toBe(0);
    });
  });

  describe('killAll()', () => {
    it('should terminate all active processes', async () => {
      const mock1 = createMockChildProcess(1001);
      const mock2 = createMockChildProcess(1002);
      const multiSpawn = vi.fn()
        .mockReturnValueOnce(mock1)
        .mockReturnValueOnce(mock2) as unknown as typeof import('node:child_process').spawn;

      const manager = new CrewManager(multiSpawn);
      await manager.spawn({ ...DEFAULT_CONFIG, id: 'crew-1' });
      await manager.spawn({ ...DEFAULT_CONFIG, id: 'crew-2' });

      manager.killAll();

      expect(mock1.kill).toHaveBeenCalled();
      expect(mock2.kill).toHaveBeenCalled();
    });

    it('should leave process map empty', async () => {
      const manager = new CrewManager(mockSpawn);
      await manager.spawn(DEFAULT_CONFIG);

      manager.killAll();

      expect(manager.getActiveCount()).toBe(0);
    });

    it('should handle empty process map gracefully', () => {
      const manager = new CrewManager(mockSpawn);

      expect(() => manager.killAll()).not.toThrow();
      expect(manager.getActiveCount()).toBe(0);
    });
  });
});
