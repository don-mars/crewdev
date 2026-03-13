// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFeature,
  readFeature,
  updateFeature,
  deleteFeature,
} from '../../../main/features/feature-crud';
import type { FeatureStatus } from '../../../shared/types/feature';

const { mockFs } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string>,
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  writeFile: vi.fn(async (path: string, content: string) => {
    mockFs[path] = content;
  }),
  readFile: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return mockFs[path];
    }
    throw new Error('ENOENT');
  }),
  unlink: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      delete mockFs[path];
      return;
    }
    throw new Error('ENOENT');
  }),
  access: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return;
    }
    throw new Error('ENOENT');
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const FEATURES_DIR = '/project/.crewdev/features';

describe('Feature CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
  });

  it('should create feature file with correct YAML frontmatter', async () => {
    const result = await createFeature(FEATURES_DIR, {
      title: 'Auth System',
      status: 'planned',
      parent: null,
      body: '',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fileContent = mockFs[`${FEATURES_DIR}/${result.data.id}.md`];
    expect(fileContent).toBeDefined();
    expect(fileContent).toContain('title: Auth System');
    expect(fileContent).toContain('status: planned');
    expect(fileContent).toContain(`id: ${result.data.id}`);
  });

  it('should create feature file with markdown body', async () => {
    const result = await createFeature(FEATURES_DIR, {
      title: 'Auth System',
      status: 'planned',
      parent: null,
      body: '# Auth\n\nImplement OAuth2 flow.',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fileContent = mockFs[`${FEATURES_DIR}/${result.data.id}.md`];
    expect(fileContent).toContain('# Auth');
    expect(fileContent).toContain('Implement OAuth2 flow.');
  });

  it('should read and parse feature file into FeatureNode type', async () => {
    mockFs[`${FEATURES_DIR}/feat-1.md`] = [
      '---',
      'id: feat-1',
      'title: Auth System',
      'status: planned',
      'parent: null',
      '---',
      '# Auth',
      '',
      'Details here.',
    ].join('\n');

    const result = await readFeature(FEATURES_DIR, 'feat-1');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe('feat-1');
    expect(result.data.title).toBe('Auth System');
    expect(result.data.status).toBe('planned');
    expect(result.data.parent).toBeNull();
    expect(result.data.body).toContain('Details here.');
  });

  it('should update feature frontmatter fields', async () => {
    mockFs[`${FEATURES_DIR}/feat-1.md`] = [
      '---',
      'id: feat-1',
      'title: Auth System',
      'status: planned',
      'parent: null',
      '---',
      'Body content.',
    ].join('\n');

    const result = await updateFeature(FEATURES_DIR, 'feat-1', {
      status: 'in-progress',
      title: 'Auth System v2',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fileContent = mockFs[`${FEATURES_DIR}/feat-1.md`];
    expect(fileContent).toContain('status: in-progress');
    expect(fileContent).toContain('title: Auth System v2');
    expect(fileContent).toContain('Body content.');
  });

  it('should update feature markdown body', async () => {
    mockFs[`${FEATURES_DIR}/feat-1.md`] = [
      '---',
      'id: feat-1',
      'title: Auth System',
      'status: planned',
      'parent: null',
      '---',
      'Old body.',
    ].join('\n');

    const result = await updateFeature(FEATURES_DIR, 'feat-1', {
      body: 'New body content.',
    });

    expect(result.success).toBe(true);
    const fileContent = mockFs[`${FEATURES_DIR}/feat-1.md`];
    expect(fileContent).toContain('New body content.');
    expect(fileContent).not.toContain('Old body.');
  });

  it('should delete feature file from disk', async () => {
    mockFs[`${FEATURES_DIR}/feat-1.md`] = '---\nid: feat-1\n---\n';

    const result = await deleteFeature(FEATURES_DIR, 'feat-1');

    expect(result.success).toBe(true);
    expect(mockFs[`${FEATURES_DIR}/feat-1.md`]).toBeUndefined();
  });

  it('should return error for malformed frontmatter', async () => {
    mockFs[`${FEATURES_DIR}/bad.md`] = '---\n: broken yaml {{{\n---\n';

    const result = await readFeature(FEATURES_DIR, 'bad');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_FEATURE');
    }
  });

  it('should accept all valid status values: planned, in-progress, complete, blocked', async () => {
    const statuses: FeatureStatus[] = ['planned', 'in-progress', 'complete', 'blocked'];

    for (const status of statuses) {
      Object.keys(mockFs).forEach((key) => delete mockFs[key]);

      const result = await createFeature(FEATURES_DIR, {
        title: `Feature ${status}`,
        status,
        parent: null,
        body: '',
      });

      expect(result.success).toBe(true);
    }
  });

  it('should return validation error for invalid status value', async () => {
    const result = await createFeature(FEATURES_DIR, {
      title: 'Bad Feature',
      status: 'invalid-status' as FeatureStatus,
      parent: null,
      body: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_STATUS');
    }
  });
});
