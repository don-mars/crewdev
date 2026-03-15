import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { PlanningDoc } from '../../shared/types/planning';
import type { ProjectContext } from '../project/project-context';
import {
  PLANNING_UPLOAD,
  PLANNING_CREATE,
  PLANNING_LIST,
  PLANNING_DELETE,
} from '../../shared/constants/ipc';
import { uploadDoc, createDoc, listDocs, deleteDoc } from '../planning/planning-docs';
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

export function registerPlanningHandlers(
  ipcMain: IpcMain,
  projectContext: ProjectContext,
): void {
  ipcMain.handle(
    PLANNING_UPLOAD,
    async (_event: unknown, sourcePath: string, fileName: string): Promise<IpcResponse<PlanningDoc>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await uploadDoc(projectContext.planningDir, sourcePath, fileName);
      } catch (err: unknown) {
        logger.error('Unexpected error in planning:upload handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PLANNING_CREATE,
    async (_event: unknown, name: string): Promise<IpcResponse<PlanningDoc>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await createDoc(projectContext.planningDir, name);
      } catch (err: unknown) {
        logger.error('Unexpected error in planning:create handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PLANNING_LIST,
    async (_event: unknown): Promise<IpcResponse<PlanningDoc[]>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await listDocs(projectContext.planningDir);
      } catch (err: unknown) {
        logger.error('Unexpected error in planning:list handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PLANNING_DELETE,
    async (_event: unknown, fileName: string): Promise<IpcResponse<void>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await deleteDoc(projectContext.planningDir, fileName);
      } catch (err: unknown) {
        logger.error('Unexpected error in planning:delete handler', { error: err });
        return unknownError();
      }
    },
  );
}
