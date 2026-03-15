import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { GamificationState, QualityRollResult } from '../../shared/types/gamification';
import { XP_PER_TASK } from '../../shared/types/gamification';
import {
  GAMIFICATION_GET_STATE,
  GAMIFICATION_RECORD_COMPLETION,
  GAMIFICATION_ROLL_BUILD_QUALITY,
} from '../../shared/constants/ipc';
import { loadGamificationState, saveGamificationState } from '../gamification/persistence';
import { recordCompletion } from '../gamification/streak';
import { addXp } from '../gamification/xp';
import { rollBuildQuality } from '../gamification/build-quality';
import { logger } from '../../shared/utils/logger';

function unknownError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

export function registerGamificationHandlers(
  ipcMain: IpcMain,
  gamificationPath: string,
): void {
  ipcMain.handle(
    GAMIFICATION_GET_STATE,
    async (_event: unknown): Promise<IpcResponse<GamificationState>> => {
      try {
        const result = await loadGamificationState(gamificationPath);
        return { success: true, data: result.data };
      } catch (err: unknown) {
        logger.error('Unexpected error in gamification:get-state handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    GAMIFICATION_RECORD_COMPLETION,
    async (_event: unknown): Promise<IpcResponse<GamificationState>> => {
      try {
        const result = await loadGamificationState(gamificationPath);
        const today = new Date().toISOString().slice(0, 10);

        const updatedStreak = recordCompletion(result.data.streak, today);
        const updatedXp = addXp(result.data.xp, XP_PER_TASK);

        const newState: GamificationState = {
          streak: updatedStreak,
          xp: updatedXp,
        };

        await saveGamificationState(gamificationPath, newState);
        return { success: true, data: newState };
      } catch (err: unknown) {
        logger.error('Unexpected error in gamification:record-completion handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    GAMIFICATION_ROLL_BUILD_QUALITY,
    async (_event: unknown): Promise<IpcResponse<QualityRollResult>> => {
      try {
        const result = rollBuildQuality();
        return { success: true, data: result };
      } catch (err: unknown) {
        logger.error('Unexpected error in gamification:roll-build-quality handler', { error: err });
        return unknownError();
      }
    },
  );
}
