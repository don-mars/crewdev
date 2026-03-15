import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { FeatureNode, FeatureTree } from '../../shared/types/feature';
import type { ProjectContext } from '../project/project-context';
import {
  FEATURE_CREATE,
  FEATURE_READ,
  FEATURE_UPDATE,
  FEATURE_DELETE,
  FEATURE_LOAD_TREE,
} from '../../shared/constants/ipc';
import { createFeature, readFeature, updateFeature, deleteFeature } from '../features/feature-crud';
import { loadTree } from '../features/feature-tree';
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

export function registerFeatureHandlers(
  ipcMain: IpcMain,
  projectContext: ProjectContext,
): void {
  ipcMain.handle(
    FEATURE_CREATE,
    async (_event: unknown, input: Parameters<typeof createFeature>[1]): Promise<IpcResponse<FeatureNode>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await createFeature(projectContext.featuresDir, input);
      } catch (err: unknown) {
        logger.error('Unexpected error in feature:create handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    FEATURE_READ,
    async (_event: unknown, id: string): Promise<IpcResponse<FeatureNode>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await readFeature(projectContext.featuresDir, id);
      } catch (err: unknown) {
        logger.error('Unexpected error in feature:read handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    FEATURE_UPDATE,
    async (_event: unknown, id: string, updates: Parameters<typeof updateFeature>[2]): Promise<IpcResponse<FeatureNode>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await updateFeature(projectContext.featuresDir, id, updates);
      } catch (err: unknown) {
        logger.error('Unexpected error in feature:update handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    FEATURE_DELETE,
    async (_event: unknown, id: string): Promise<IpcResponse<void>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await deleteFeature(projectContext.featuresDir, id);
      } catch (err: unknown) {
        logger.error('Unexpected error in feature:delete handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    FEATURE_LOAD_TREE,
    async (_event: unknown): Promise<IpcResponse<FeatureTree>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        return await loadTree(projectContext.featuresDir);
      } catch (err: unknown) {
        logger.error('Unexpected error in feature:load-tree handler', { error: err });
        return unknownError();
      }
    },
  );
}
