import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { OnboardingProgress, OnboardingStep } from '../../shared/types/onboarding';
import { ONBOARDING_STEPS } from '../../shared/types/onboarding';
import {
  ONBOARDING_GET_PROGRESS,
  ONBOARDING_STEP_COMPLETE,
  ONBOARDING_SKIP,
  ONBOARDING_DETECT_FIRST_RUN,
} from '../../shared/constants/ipc';
import { loadProgress, saveProgress } from '../onboarding/persistence';
import { detectFirstRun } from '../onboarding/detect-first-run';
import { logger } from '../../shared/utils/logger';

function unknownError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

function nextStep(current: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(current);
  if (idx === -1 || idx >= ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[idx + 1];
}

function advanceProgress(
  progress: OnboardingProgress,
  completedStep: OnboardingStep,
): OnboardingProgress {
  const completedSteps = [...progress.completedSteps, completedStep];
  const next = nextStep(completedStep);

  if (!next) {
    return { currentStep: completedStep, completedSteps, completed: true };
  }

  return { currentStep: next, completedSteps, completed: false };
}

export function registerOnboardingHandlers(
  ipcMain: IpcMain,
  onboardingPath: string,
  dataDir: string,
): void {
  ipcMain.handle(
    ONBOARDING_GET_PROGRESS,
    async (_event: unknown): Promise<IpcResponse<OnboardingProgress>> => {
      try {
        const progress = await loadProgress(onboardingPath);
        return { success: true, data: progress };
      } catch (err: unknown) {
        logger.error('Unexpected error in onboarding:get-progress handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    ONBOARDING_STEP_COMPLETE,
    async (_event: unknown, step: OnboardingStep): Promise<IpcResponse<OnboardingProgress>> => {
      try {
        const progress = await loadProgress(onboardingPath);
        const updated = advanceProgress(progress, step);
        await saveProgress(onboardingPath, updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        logger.error('Unexpected error in onboarding:step-complete handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    ONBOARDING_SKIP,
    async (_event: unknown, step: OnboardingStep): Promise<IpcResponse<OnboardingProgress>> => {
      try {
        const progress = await loadProgress(onboardingPath);
        const next = nextStep(step);

        if (!next) {
          return { success: true, data: progress };
        }

        const updated: OnboardingProgress = {
          currentStep: next,
          completedSteps: progress.completedSteps,
          completed: false,
        };

        await saveProgress(onboardingPath, updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        logger.error('Unexpected error in onboarding:skip handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    ONBOARDING_DETECT_FIRST_RUN,
    async (_event: unknown): Promise<IpcResponse<boolean>> => {
      try {
        const isFirst = await detectFirstRun(dataDir);
        return { success: true, data: isFirst };
      } catch (err: unknown) {
        logger.error('Unexpected error in onboarding:detect-first-run handler', { error: err });
        return unknownError();
      }
    },
  );
}
