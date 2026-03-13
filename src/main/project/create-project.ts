import { mkdir, writeFile, access, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { ProjectMetadata } from '../../shared/types/project';
import { createDefaultMemory } from '../../shared/types/project';
import { logger } from '../../shared/utils/logger';

export async function createProject(
  name: string,
  dirPath: string,
): Promise<IpcResponse<ProjectMetadata>> {
  try {
    // Verify the directory exists
    try {
      const stats = await stat(dirPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: { code: 'PATH_NOT_FOUND', message: `Path is not a directory: ${dirPath}` },
        };
      }
    } catch {
      return {
        success: false,
        error: { code: 'PATH_NOT_FOUND', message: `Directory does not exist: ${dirPath}` },
      };
    }

    const crewdevDir = join(dirPath, '.crewdev');

    // Check for existing .crewdev directory
    try {
      await access(crewdevDir);
      return {
        success: false,
        error: { code: 'DUPLICATE_PROJECT', message: `Project already exists at ${dirPath}` },
      };
    } catch {
      // Expected — directory doesn't exist yet
    }

    // Create directory structure
    await mkdir(crewdevDir, { recursive: true });
    await mkdir(join(crewdevDir, 'features'), { recursive: true });
    await mkdir(join(crewdevDir, 'crew'), { recursive: true });

    // Create project metadata
    const project: ProjectMetadata = {
      id: randomUUID(),
      name,
      dirPath,
      createdAt: new Date().toISOString(),
    };

    await writeFile(join(crewdevDir, 'project.json'), JSON.stringify(project, null, 2));

    // Create shared memory file
    const memory = createDefaultMemory(project.id);
    await writeFile(join(crewdevDir, 'memory.json'), JSON.stringify(memory, null, 2));

    logger.info('Project created', { name, dirPath, id: project.id });

    return { success: true, data: project };
  } catch (err) {
    logger.error('Failed to create project', { name, dirPath, error: String(err) });
    return {
      success: false,
      error: { code: 'CREATE_FAILED', message: `Failed to create project: ${String(err)}` },
    };
  }
}
