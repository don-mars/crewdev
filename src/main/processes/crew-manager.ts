import { spawn as nodeSpawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { logger } from '../../shared/utils/logger';
import { createCrewDevError } from '../../shared/types/errors';
import type { CrewMemberConfig, CrewProcess } from '../../shared/types/crew';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

type SpawnFn = typeof nodeSpawn;

interface ManagedProcess {
  child: ChildProcess;
  crewProcess: CrewProcess;
  timeout: ReturnType<typeof setTimeout>;
  outputCallbacks: Array<(line: string) => void>;
  stderrCallbacks: Array<(line: string) => void>;
}

export class CrewManager {
  private processes: Map<string, ManagedProcess> = new Map();
  private pendingOutputCallbacks: Map<string, Array<(line: string) => void>> = new Map();
  private pendingStderrCallbacks: Map<string, Array<(line: string) => void>> = new Map();
  private spawnFn: SpawnFn;

  constructor(spawnFn?: SpawnFn) {
    this.spawnFn = spawnFn ?? nodeSpawn;
  }

  async spawn(config: CrewMemberConfig): Promise<CrewProcess> {
    return new Promise<CrewProcess>((resolve, reject) => {
      const child = this.spawnFn('claude', ['--print', '--output-format', 'stream-json'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const crewProcess: CrewProcess = {
        id: config.id,
        pid: child.pid ?? 0,
        status: 'running',
      };

      let resolved = false;

      const pendingOutput = this.pendingOutputCallbacks.get(config.id) ?? [];
      const pendingStderr = this.pendingStderrCallbacks.get(config.id) ?? [];
      this.pendingOutputCallbacks.delete(config.id);
      this.pendingStderrCallbacks.delete(config.id);

      const timeout = this.startInactivityTimeout(config.id);

      const managed: ManagedProcess = {
        child,
        crewProcess,
        timeout,
        outputCallbacks: [...pendingOutput],
        stderrCallbacks: [...pendingStderr],
      };

      this.processes.set(config.id, managed);

      child.on('error', (err: NodeJS.ErrnoException) => {
        this.clearInactivityTimeout(config.id);

        if (!resolved) {
          resolved = true;
          this.processes.delete(config.id);
          const error = createCrewDevError(
            'SPAWN_FAILED',
            'Could not start the coding agent. Make sure Claude CLI is installed and accessible.',
            err.message,
          );
          reject(error);
          return;
        }

        crewProcess.status = 'error';
        logger.error('Crew process crashed unexpectedly', {
          id: config.id,
          name: config.name,
          error: err.message,
        });
      });

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          this.resetInactivityTimeout(config.id);
          const line = data.toString();
          for (const cb of managed.outputCallbacks) {
            cb(line);
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          const line = data.toString();
          for (const cb of managed.stderrCallbacks) {
            cb(line);
          }
        });
      }

      child.on('close', (code: number | null) => {
        this.clearInactivityTimeout(config.id);
        crewProcess.status = 'idle';
        this.cleanupListeners(config.id);

        logger.info('Crew process exited', {
          id: config.id,
          code,
        });
      });

      // Defer resolution to allow error events to fire first
      process.nextTick(() => {
        if (!resolved) {
          resolved = true;
          resolve(crewProcess);
        }
      });
    });
  }

  kill(id: string): void {
    const managed = this.processes.get(id);
    if (!managed) {
      throw createCrewDevError(
        'PROCESS_NOT_FOUND',
        `No active process found with id "${id}"`,
      );
    }

    this.clearInactivityTimeout(id);
    this.cleanupListeners(id);
    managed.child.kill();
    managed.crewProcess.status = 'idle';
  }

  killAll(): void {
    const ids = [...this.processes.keys()];
    for (const id of ids) {
      this.kill(id);
    }
  }

  getProcess(id: string): CrewProcess | undefined {
    return this.processes.get(id)?.crewProcess;
  }

  getActiveCount(): number {
    let count = 0;
    for (const [, managed] of this.processes) {
      if (managed.crewProcess.status === 'running') {
        count++;
      }
    }
    return count;
  }

  onOutput(id: string, callback: (line: string) => void): void {
    const managed = this.processes.get(id);
    if (managed) {
      managed.outputCallbacks.push(callback);
      return;
    }
    this.pendingOutputCallbacks.set(id, [
      ...(this.pendingOutputCallbacks.get(id) ?? []),
      callback,
    ]);
  }

  onStderr(id: string, callback: (line: string) => void): void {
    const managed = this.processes.get(id);
    if (managed) {
      managed.stderrCallbacks.push(callback);
      return;
    }
    this.pendingStderrCallbacks.set(id, [
      ...(this.pendingStderrCallbacks.get(id) ?? []),
      callback,
    ]);
  }

  private startInactivityTimeout(id: string): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      const managed = this.processes.get(id);
      if (managed) {
        logger.warn('Crew process timed out due to inactivity', { id });
        managed.child.kill();
        managed.crewProcess.status = 'error';
      }
    }, INACTIVITY_TIMEOUT_MS);
  }

  private resetInactivityTimeout(id: string): void {
    const managed = this.processes.get(id);
    if (!managed) {
      return;
    }
    clearTimeout(managed.timeout);
    managed.timeout = this.startInactivityTimeout(id);
  }

  private clearInactivityTimeout(id: string): void {
    const managed = this.processes.get(id);
    if (managed) {
      clearTimeout(managed.timeout);
    }
  }

  private cleanupListeners(id: string): void {
    const managed = this.processes.get(id);
    if (!managed) {
      return;
    }
    managed.child.stdout?.removeAllListeners('data');
    managed.child.stderr?.removeAllListeners('data');
    managed.outputCallbacks = [];
    managed.stderrCallbacks = [];
  }
}
