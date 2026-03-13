import { readFile, writeFile } from 'node:fs/promises';
import type { GamificationState } from '../../shared/types/gamification';
import { createDefaultGamificationState } from '../../shared/types/gamification';

interface LoadResult {
  success: boolean;
  data: GamificationState;
}

export async function saveGamificationState(
  filePath: string,
  state: GamificationState,
): Promise<void> {
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

export async function loadGamificationState(filePath: string): Promise<LoadResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as GamificationState;
    return { success: true, data };
  } catch {
    return { success: true, data: createDefaultGamificationState() };
  }
}
