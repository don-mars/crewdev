import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { ProjectMetadata } from '../../shared/types/project';
import type { GitRepoInfo } from '../../shared/types/git';
import type { ProjectContext } from '../project/project-context';
import {
  PROJECT_CREATE,
  PROJECT_LIST,
  PROJECT_SELECT,
  PROJECT_GIT_CONNECT,
} from '../../shared/constants/ipc';
import { createProject } from '../project/create-project';
import { loadProject } from '../project/load-projects';
import { copyDefaultConfigs } from '../crew/crew-config';
import { handleGitConnect } from './git-connect';
import { logger } from '../../shared/utils/logger';

function unknownError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

export function registerProjectHandlers(
  ipcMain: IpcMain,
  projectContext: ProjectContext,
): void {
  ipcMain.handle(
    PROJECT_CREATE,
    async (_event: unknown, name: string, dirPath: string): Promise<IpcResponse<ProjectMetadata>> => {
      try {
        const result = await createProject(name, dirPath);
        if (result.success) {
          projectContext.setProject(result.data);
          await copyDefaultConfigs(projectContext.crewDir);
        }
        return result;
      } catch (err: unknown) {
        logger.error('Unexpected error in project:create handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PROJECT_LIST,
    async (_event: unknown, dirPath: string): Promise<IpcResponse<ProjectMetadata>> => {
      try {
        return await loadProject(dirPath);
      } catch (err: unknown) {
        logger.error('Unexpected error in project:list handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PROJECT_SELECT,
    async (_event: unknown, dirPath: string): Promise<IpcResponse<ProjectMetadata>> => {
      try {
        const result = await loadProject(dirPath);
        if (result.success) {
          projectContext.setProject(result.data);
        }
        return result;
      } catch (err: unknown) {
        logger.error('Unexpected error in project:select handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    PROJECT_GIT_CONNECT,
    async (_event: unknown, dirPath: string): Promise<IpcResponse<GitRepoInfo>> => {
      try {
        return await handleGitConnect(dirPath);
      } catch (err: unknown) {
        logger.error('Unexpected error in project:git-connect handler', { error: err });
        return unknownError();
      }
    },
  );
}
