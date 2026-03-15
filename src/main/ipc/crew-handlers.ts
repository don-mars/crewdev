import type { IpcMain } from 'electron';
import type { CrewManager } from '../processes/crew-manager';
import type { ProjectContext } from '../project/project-context';
import type { CrewMemberConfig } from '../../shared/types/crew';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { CrewProcess } from '../../shared/types/crew';
import type { CrewDevError } from '../../shared/types/errors';
import type { OutputHandler, StatusHandler } from '../processes/crew-output';
import { parseStatusFromLine } from '../processes/crew-output';
import {
  CREW_SPAWN,
  CREW_KILL,
  CREW_KILL_ALL,
  CREW_SEND_INPUT,
} from '../../shared/constants/ipc';
import { loadCrewConfig } from '../crew/crew-config';
import { logger } from '../../shared/utils/logger';

function isCrewDevError(err: unknown): err is CrewDevError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as CrewDevError).code === 'string' &&
    typeof (err as CrewDevError).message === 'string'
  );
}

function toErrorResponse<T>(err: unknown): IpcResponse<T> {
  if (isCrewDevError(err)) {
    logger.error('Crew IPC error', { code: err.code, message: err.message });
    return { success: false, error: { code: err.code, message: err.message } };
  }
  logger.error('Unexpected error in crew IPC handler', { error: err });
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

export function registerCrewHandlers(
  ipcMain: IpcMain,
  crewManager: CrewManager,
  projectContext: ProjectContext,
  outputHandler?: OutputHandler,
  statusHandler?: StatusHandler,
): void {
  ipcMain.handle(
    CREW_SPAWN,
    async (_event: unknown, config: CrewMemberConfig): Promise<IpcResponse<CrewProcess>> => {
      try {
        const project = projectContext.getProject();
        let configContent = config.configContent;
        if (!configContent && project) {
          const loadResult = await loadCrewConfig(projectContext.crewDir, config.id);
          if (loadResult.success) {
            configContent = loadResult.data;
          }
        }
        const spawnConfig: CrewMemberConfig = {
          ...config,
          configContent,
          cwd: project ? (config.cwd ?? project.dirPath) : config.cwd,
        };
        const process = await crewManager.spawn(spawnConfig);
        if (outputHandler) {
          crewManager.onOutput(config.id, (line: string) => {
            outputHandler(config.id, line);
            if (statusHandler) {
              const status = parseStatusFromLine(line);
              if (status) {
                statusHandler(config.id, status);
              }
            }
          });
        }
        return { success: true, data: process };
      } catch (err: unknown) {
        logger.error('crew:spawn handler failed', { error: err });
        return toErrorResponse(err);
      }
    },
  );

  ipcMain.handle(
    CREW_KILL,
    async (_event: unknown, id: string): Promise<IpcResponse<null>> => {
      try {
        crewManager.kill(id);
        return { success: true, data: null };
      } catch (err: unknown) {
        logger.error('crew:kill handler failed', { id, error: err });
        return toErrorResponse(err);
      }
    },
  );

  ipcMain.handle(
    CREW_KILL_ALL,
    async (_event: unknown): Promise<IpcResponse<null>> => {
      try {
        crewManager.killAll();
        return { success: true, data: null };
      } catch (err: unknown) {
        logger.error('crew:kill-all handler failed', { error: err });
        return toErrorResponse(err);
      }
    },
  );

  ipcMain.handle(
    CREW_SEND_INPUT,
    async (_event: unknown, id: string, message: string): Promise<IpcResponse<null>> => {
      try {
        crewManager.sendInput(id, message);
        return { success: true, data: null };
      } catch (err: unknown) {
        logger.error('crew:send-input handler failed', { id, error: err });
        return toErrorResponse(err);
      }
    },
  );
}
