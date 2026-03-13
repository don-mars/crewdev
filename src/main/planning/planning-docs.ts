import { writeFile, readdir, unlink, access, stat, mkdir, copyFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { PlanningDoc } from '../../shared/types/planning';
import { ALLOWED_EXTENSIONS } from '../../shared/types/planning';
import { logger } from '../../shared/utils/logger';

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function uploadDoc(
  planningDir: string,
  sourcePath: string,
  fileName: string,
): Promise<IpcResponse<PlanningDoc>> {
  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      success: false,
      error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported file type: ${ext}` },
    };
  }

  await ensureDir(planningDir);
  const destPath = join(planningDir, fileName);
  await copyFile(sourcePath, destPath);

  logger.info('Document uploaded', { fileName });
  return {
    success: true,
    data: { name: fileName.replace(ext, ''), fileName, lastModified: new Date().toISOString() },
  };
}

export async function createDoc(
  planningDir: string,
  name: string,
): Promise<IpcResponse<PlanningDoc>> {
  if (!name.trim()) {
    return {
      success: false,
      error: { code: 'INVALID_NAME', message: 'Document name cannot be empty' },
    };
  }

  await ensureDir(planningDir);
  const fileName = `${name}.md`;
  const filePath = join(planningDir, fileName);

  try {
    await access(filePath);
    return {
      success: false,
      error: { code: 'DUPLICATE_NAME', message: `Document already exists: ${name}` },
    };
  } catch {
    // Expected — file doesn't exist yet
  }

  await writeFile(filePath, `# ${name}\n`);

  logger.info('Document created', { name });
  return {
    success: true,
    data: { name, fileName, lastModified: new Date().toISOString() },
  };
}

export async function deleteDoc(
  planningDir: string,
  fileName: string,
): Promise<IpcResponse<void>> {
  const filePath = join(planningDir, fileName);
  try {
    await unlink(filePath);
    logger.info('Document deleted', { fileName });
    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: { code: 'DOC_NOT_FOUND', message: `Document not found: ${fileName}` },
    };
  }
}

export async function listDocs(
  planningDir: string,
): Promise<IpcResponse<PlanningDoc[]>> {
  try {
    const files = await readdir(planningDir);
    const docs: PlanningDoc[] = [];

    for (const file of files) {
      const filePath = join(planningDir, file);
      const s = await stat(filePath);
      const ext = extname(file);
      docs.push({
        name: file.replace(ext, ''),
        fileName: file,
        lastModified: s.mtime.toISOString(),
      });
    }

    return { success: true, data: docs };
  } catch {
    return { success: true, data: [] };
  }
}
