// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadProject } from '../../../main/project/load-projects';

const { mockFiles } = vi.hoisted(() => ({
  mockFiles: {} as Record<string, string>,
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: vi.fn(async (path: string) => {
    if (mockFiles[path] !== undefined) {
      return mockFiles[path];
    }
    throw new Error('ENOENT');
  }),
  access: vi.fn(async (path: string) => {
    if (mockFiles[path] !== undefined) {
      return;
    }
    throw new Error('ENOENT');
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Project loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFiles).forEach((key) => delete mockFiles[key]);
  });

  it('should load project from disk', async () => {
    mockFiles['/test/.crewdev/project.json'] = JSON.stringify({
      id: 'proj-1',
      name: 'Test Project',
      dirPath: '/test',
      createdAt: '2026-03-13T00:00:00Z',
    });

    const result = await loadProject('/test');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Project');
      expect(result.data.id).toBe('proj-1');
    }
  });

  it('should handle missing project.json gracefully', async () => {
    const result = await loadProject('/missing');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PROJECT_NOT_FOUND');
    }
  });

  it('should handle corrupted project.json with INVALID_PROJECT error', async () => {
    mockFiles['/corrupt/.crewdev/project.json'] = '{bad json!!!';

    const result = await loadProject('/corrupt');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PROJECT');
    }
  });
});
