import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { IpcResponse } from '../../shared/types/ipc-response';
import { CREW_MEMBER_IDS, type CrewMemberId } from '../../shared/types/crew-defaults';
import { logger } from '../../shared/utils/logger';

const DEFAULTS_DIR = resolve(__dirname, '..', 'defaults');

export function getDefaultConfigPath(id: CrewMemberId): string {
  return join(DEFAULTS_DIR, `${id}.md`);
}

export async function copyDefaultConfigs(
  crewDir: string,
): Promise<IpcResponse<void>> {
  try {
    await mkdir(crewDir, { recursive: true });

    for (const id of CREW_MEMBER_IDS) {
      const src = getDefaultConfigPath(id);
      const dest = join(crewDir, `${id}.md`);
      await copyFile(src, dest);
    }

    logger.info('Default crew configs copied', { crewDir });
    return { success: true, data: undefined };
  } catch (err) {
    logger.error('Failed to copy default configs', { error: String(err) });
    return {
      success: false,
      error: { code: 'COPY_FAILED', message: `Failed to copy default configs: ${String(err)}` },
    };
  }
}

export async function loadCrewConfig(
  crewDir: string,
  id: string,
): Promise<IpcResponse<string>> {
  try {
    const filePath = join(crewDir, `${id}.md`);
    const content = await readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch {
    return {
      success: false,
      error: { code: 'CONFIG_NOT_FOUND', message: `Config not found for crew member: ${id}` },
    };
  }
}

export async function saveCrewConfig(
  crewDir: string,
  id: string,
  content: string,
): Promise<IpcResponse<void>> {
  if (!content.trim()) {
    return {
      success: false,
      error: { code: 'EMPTY_CONFIG', message: 'Config content cannot be empty' },
    };
  }

  try {
    const filePath = join(crewDir, `${id}.md`);
    await writeFile(filePath, content);
    logger.info('Crew config saved', { id });
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: { code: 'SAVE_FAILED', message: `Failed to save config: ${String(err)}` },
    };
  }
}
