import { readFile, writeFile } from 'node:fs/promises';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { SharedMemory } from '../../shared/types/project';
import { logger } from '../../shared/utils/logger';

export async function readMemory(
  memoryPath: string,
): Promise<IpcResponse<SharedMemory>> {
  let raw: string;
  try {
    raw = await readFile(memoryPath, 'utf-8');
  } catch {
    return {
      success: false,
      error: { code: 'MEMORY_NOT_FOUND', message: `Memory file not found: ${memoryPath}` },
    };
  }

  try {
    const data = JSON.parse(raw) as SharedMemory;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: { code: 'MEMORY_CORRUPT', message: `Memory file is corrupted: ${memoryPath}` },
    };
  }
}

export async function writeMemory(
  memoryPath: string,
  patch: Partial<SharedMemory>,
): Promise<IpcResponse<void>> {
  const existing = await readMemory(memoryPath);
  if (!existing.success) {
    return existing as IpcResponse<void>;
  }

  const merged: SharedMemory = {
    ...existing.data,
    ...patch,
    knowledgeProfile: {
      ...existing.data.knowledgeProfile,
      ...(patch.knowledgeProfile ?? {}),
    },
  };

  try {
    await writeFile(memoryPath, JSON.stringify(merged, null, 2));
    logger.info('Memory updated', { memoryPath });
    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: { code: 'WRITE_FAILED', message: `Failed to write memory: ${String(err)}` },
    };
  }
}
