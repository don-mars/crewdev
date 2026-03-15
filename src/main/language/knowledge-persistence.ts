import { readFile, writeFile } from 'node:fs/promises';
import type { KnowledgeProfile } from '../../shared/types/knowledge';
import { createDefaultProfile } from '../../shared/types/knowledge';
import { logger } from '../../shared/utils/logger';

export async function loadKnowledgeProfile(filePath: string): Promise<KnowledgeProfile> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as KnowledgeProfile;
  } catch {
    logger.info('No existing knowledge profile found, using defaults', { filePath });
    return createDefaultProfile();
  }
}

export async function saveKnowledgeProfile(
  filePath: string,
  profile: KnowledgeProfile,
): Promise<void> {
  await writeFile(filePath, JSON.stringify(profile, null, 2));
  logger.info('Knowledge profile saved', { filePath });
}
