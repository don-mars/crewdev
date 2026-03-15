import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { DependencyGraph } from '../../shared/types/nerve-map';
import { NERVE_MAP_SCAN } from '../../shared/constants/ipc';
import { buildDependencyGraph } from '../nerve-map/import-parser';
import { logger } from '../../shared/utils/logger';

export function registerNerveMapHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(
    NERVE_MAP_SCAN,
    async (_event: unknown, rootDir: string): Promise<IpcResponse<DependencyGraph>> => {
      try {
        const graph = await buildDependencyGraph(rootDir);
        return { success: true, data: graph };
      } catch (err: unknown) {
        logger.error('Unexpected error in nerve-map:scan handler', { error: err });
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
        };
      }
    },
  );
}
