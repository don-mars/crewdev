// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTree } from '../../../main/features/feature-tree';

const { mockFs, mockDirFiles } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string>,
  mockDirFiles: [] as string[],
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return mockFs[path];
    }
    throw new Error('ENOENT');
  }),
  readdir: vi.fn(async () => {
    return mockDirFiles.slice();
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const FEATURES_DIR = '/project/.crewdev/features';

function addFeatureFile(id: string, title: string, status: string, parent: string | null): void {
  const parentLine = parent === null ? 'parent: null' : `parent: ${parent}`;
  mockFs[`${FEATURES_DIR}/${id}.md`] = [
    '---',
    `id: ${id}`,
    `title: ${title}`,
    `status: ${status}`,
    parentLine,
    '---',
    `Body for ${title}.`,
  ].join('\n');
  mockDirFiles.push(`${id}.md`);
}

describe('Feature tree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
    mockDirFiles.length = 0;
  });

  it('should build tree hierarchy from flat feature files', async () => {
    addFeatureFile('root-1', 'Root Feature', 'planned', null);
    addFeatureFile('child-1', 'Child Feature', 'planned', 'root-1');

    const result = await loadTree(FEATURES_DIR);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('root-1');
    expect(result.data[0].children).toHaveLength(1);
    expect(result.data[0].children[0].id).toBe('child-1');
  });

  it('should handle features with no parent as root nodes', async () => {
    addFeatureFile('a', 'Feature A', 'planned', null);
    addFeatureFile('b', 'Feature B', 'complete', null);

    const result = await loadTree(FEATURES_DIR);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(2);
    const ids = result.data.map((n) => n.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('should nest child features under correct parent', async () => {
    addFeatureFile('root', 'Root', 'planned', null);
    addFeatureFile('child-a', 'Child A', 'planned', 'root');
    addFeatureFile('child-b', 'Child B', 'in-progress', 'root');
    addFeatureFile('grandchild', 'Grandchild', 'blocked', 'child-a');

    const result = await loadTree(FEATURES_DIR);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(1);
    const root = result.data[0];
    expect(root.children).toHaveLength(2);
    const childA = root.children.find((c) => c.id === 'child-a');
    expect(childA).toBeDefined();
    expect(childA!.children).toHaveLength(1);
    expect(childA!.children[0].id).toBe('grandchild');
  });

  it('should handle empty features directory', async () => {
    const result = await loadTree(FEATURES_DIR);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(0);
  });

  it('should handle orphaned children gracefully', async () => {
    addFeatureFile('orphan', 'Orphan', 'planned', 'nonexistent-parent');

    const result = await loadTree(FEATURES_DIR);

    expect(result.success).toBe(true);
    if (!result.success) return;
    // Orphans should appear as root nodes
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('orphan');
  });
});
