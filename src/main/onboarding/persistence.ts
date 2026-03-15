import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { OnboardingProgress } from '../../shared/types/onboarding';
import { createDefaultProgress } from '../../shared/types/onboarding';
import { logger } from '../../shared/utils/logger';

export async function saveProgress(filePath: string, progress: OnboardingProgress): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8');
}

export async function loadProgress(filePath: string): Promise<OnboardingProgress> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as OnboardingProgress;

    if (!data.currentStep || !Array.isArray(data.completedSteps)) {
      logger.warn('Invalid onboarding progress, using defaults');
      return createDefaultProgress();
    }

    return data;
  } catch {
    logger.debug('No onboarding progress found, using defaults');
    return createDefaultProgress();
  }
}
