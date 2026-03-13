import { writeFile, readFile, unlink, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { FeatureNode, FeatureStatus } from '../../shared/types/feature';
import { FEATURE_STATUSES } from '../../shared/types/feature';
import { logger } from '../../shared/utils/logger';

interface CreateFeatureInput {
  title: string;
  status: FeatureStatus;
  parent: string | null;
  body: string;
}

interface UpdateFeatureInput {
  title?: string;
  status?: FeatureStatus;
  parent?: string | null;
  body?: string;
}

function featurePath(featuresDir: string, id: string): string {
  return join(featuresDir, `${id}.md`);
}

function serializeFeature(node: FeatureNode): string {
  const frontmatter: Record<string, unknown> = {
    id: node.id,
    title: node.title,
    status: node.status,
    parent: node.parent,
  };
  return matter.stringify(node.body, frontmatter);
}

function parseFeature(raw: string): FeatureNode {
  const { data, content } = matter(raw);
  return {
    id: data.id as string,
    title: data.title as string,
    status: data.status as FeatureStatus,
    parent: data.parent === 'null' || data.parent === null ? null : (data.parent as string),
    body: content.trim(),
  };
}

export async function createFeature(
  featuresDir: string,
  input: CreateFeatureInput,
): Promise<IpcResponse<FeatureNode>> {
  if (!FEATURE_STATUSES.includes(input.status)) {
    return {
      success: false,
      error: { code: 'INVALID_STATUS', message: `Invalid status: ${input.status}` },
    };
  }

  const id = randomUUID();
  const node: FeatureNode = {
    id,
    title: input.title,
    status: input.status,
    parent: input.parent,
    body: input.body,
  };

  const filePath = featurePath(featuresDir, id);
  await writeFile(filePath, serializeFeature(node));

  logger.info('Feature created', { id, title: input.title });
  return { success: true, data: node };
}

export async function readFeature(
  featuresDir: string,
  id: string,
): Promise<IpcResponse<FeatureNode>> {
  const filePath = featurePath(featuresDir, id);

  try {
    await access(filePath);
  } catch {
    return {
      success: false,
      error: { code: 'FEATURE_NOT_FOUND', message: `Feature not found: ${id}` },
    };
  }

  try {
    const raw = await readFile(filePath, 'utf-8');
    const node = parseFeature(raw);

    if (!node.id || !node.title || !node.status) {
      return {
        success: false,
        error: { code: 'INVALID_FEATURE', message: `Feature is missing required fields: ${id}` },
      };
    }

    return { success: true, data: node };
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_FEATURE', message: `Failed to parse feature: ${id}` },
    };
  }
}

export async function updateFeature(
  featuresDir: string,
  id: string,
  updates: UpdateFeatureInput,
): Promise<IpcResponse<FeatureNode>> {
  const existing = await readFeature(featuresDir, id);
  if (!existing.success) return existing;

  const updated: FeatureNode = {
    ...existing.data,
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.parent !== undefined && { parent: updates.parent }),
    ...(updates.body !== undefined && { body: updates.body }),
  };

  const filePath = featurePath(featuresDir, id);
  await writeFile(filePath, serializeFeature(updated));

  logger.info('Feature updated', { id });
  return { success: true, data: updated };
}

export async function deleteFeature(
  featuresDir: string,
  id: string,
): Promise<IpcResponse<void>> {
  const filePath = featurePath(featuresDir, id);

  try {
    await unlink(filePath);
    logger.info('Feature deleted', { id });
    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: { code: 'FEATURE_NOT_FOUND', message: `Feature not found: ${id}` },
    };
  }
}
