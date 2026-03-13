import { readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../../shared/utils/logger';

export async function detectFirstRun(dataDir: string): Promise<boolean> {
  try {
    const configPath = path.join(dataDir, 'config.json');
    await access(configPath);

    const entries = await readdir(dataDir, { withFileTypes: true });
    const projectDirs = entries.filter((e) => e.isDirectory());

    if (projectDirs.length > 0) {
      return false;
    }
  } catch {
    logger.debug('First run detected — no config or projects found', { dataDir });
  }

  return true;
}
