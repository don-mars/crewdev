import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { FeatureNode, FeatureTree, FeatureTreeNode, FeatureStatus } from '../../shared/types/feature';
import { logger } from '../../shared/utils/logger';

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

export async function loadTree(featuresDir: string): Promise<IpcResponse<FeatureTree>> {
  try {
    const files = await readdir(featuresDir);
    const mdFiles = files.filter((f: string) => f.endsWith('.md'));

    const nodes: FeatureNode[] = [];
    for (const file of mdFiles) {
      const raw = await readFile(join(featuresDir, file), 'utf-8');
      nodes.push(parseFeature(raw));
    }

    // Build tree: index nodes, then attach children
    const treeNodeMap = new Map<string, FeatureTreeNode>();
    for (const node of nodes) {
      treeNodeMap.set(node.id, { ...node, children: [] });
    }

    const roots: FeatureTreeNode[] = [];
    for (const node of nodes) {
      const treeNode = treeNodeMap.get(node.id)!;
      if (node.parent !== null && treeNodeMap.has(node.parent)) {
        const parent = treeNodeMap.get(node.parent)!;
        (parent.children as FeatureTreeNode[]).push(treeNode);
      } else {
        roots.push(treeNode);
      }
    }

    logger.info('Feature tree loaded', { count: nodes.length });
    return { success: true, data: roots };
  } catch (err) {
    logger.error('Failed to load feature tree', { error: String(err) });
    return {
      success: false,
      error: { code: 'LOAD_FAILED', message: `Failed to load feature tree: ${String(err)}` },
    };
  }
}
