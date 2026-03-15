import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { SharedMemory } from '../../shared/types/project';
import type { ProjectContext } from '../project/project-context';
import { MEMORY_READ, MEMORY_WRITE } from '../../shared/constants/ipc';
import { readMemory, writeMemory } from '../memory/shared-memory';
import { logger } from '../../shared/utils/logger';

function unknownError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

function noProjectError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
  };
}

export function registerMemoryHandlers(
  ipcMain: IpcMain,
  projectContext: ProjectContext,
): void {
  ipcMain.handle(
    MEMORY_READ,
    async (_event: unknown): Promise<IpcResponse<SharedMemory>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await readMemory(projectContext.memoryPath);
      } catch (err: unknown) {
        logger.error('Unexpected error in memory:read handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    MEMORY_WRITE,
    async (_event: unknown, patch: Partial<SharedMemory>): Promise<IpcResponse<void>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await writeMemory(projectContext.memoryPath, patch);
      } catch (err: unknown) {
        logger.error('Unexpected error in memory:write handler', { error: err });
        return unknownError();
      }
    },
  );
}
