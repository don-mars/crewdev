import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { ProjectMetadata } from '../../shared/types/project';
import { logger } from '../../shared/utils/logger';

export async function loadProject(dirPath: string): Promise<IpcResponse<ProjectMetadata>> {
  const projectJsonPath = join(dirPath, '.crewdev', 'project.json');

  try {
    await access(projectJsonPath);
  } catch {
    return {
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: `No project found at ${dirPath}` },
    };
  }

  try {
    const raw = await readFile(projectJsonPath, 'utf-8');
    const data = JSON.parse(raw) as ProjectMetadata;

    if (!data.id || !data.name || !data.dirPath) {
      return {
        success: false,
        error: { code: 'INVALID_PROJECT', message: 'Project metadata is missing required fields' },
      };
    }

    logger.info('Project loaded', { dirPath, id: data.id });
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_PROJECT', message: `Failed to parse project.json at ${dirPath}` },
    };
  }
}
