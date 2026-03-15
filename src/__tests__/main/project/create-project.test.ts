// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProject } from '../../../main/project/create-project';

const { mockFs, mockState } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string>,
  mockState: { dirs: new Set<string>() },
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  mkdir: vi.fn(async (path: string) => {
    mockState.dirs.add(path);
  }),
  writeFile: vi.fn(async (path: string, content: string) => {
    mockFs[path] = content;
  }),
  access: vi.fn(async (path: string) => {
    if (mockState.dirs.has(path) || mockFs[path] !== undefined) {
      return;
    }
    throw new Error('ENOENT');
  }),
  stat: vi.fn(async (path: string) => {
    if (mockState.dirs.has(path)) {
      return { isDirectory: () => true };
    }
    throw new Error('ENOENT');
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Project creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
    mockState.dirs = new Set();
    // Parent dir exists
    mockState.dirs.add('/test/dir');
  });

  it('should create .crewdev/ directory at specified path', async () => {
    const result = await createProject('My Project', '/test/dir');

    expect(result.success).toBe(true);
    expect(mockState.dirs.has('/test/dir/.crewdev')).toBe(true);
  });

  it('should create project.json with correct metadata', async () => {
    const result = await createProject('My Project', '/test/dir');

    expect(result.success).toBe(true);
    const projectJson = JSON.parse(mockFs['/test/dir/.crewdev/project.json']);
    expect(projectJson.name).toBe('My Project');
    expect(projectJson.dirPath).toBe('/test/dir');
    expect(projectJson.id).toBeDefined();
    expect(projectJson.createdAt).toBeDefined();
  });

  it('should create memory.json matching SharedMemory type', async () => {
    const result = await createProject('My Project', '/test/dir');

    expect(result.success).toBe(true);
    const memoryJson = JSON.parse(mockFs['/test/dir/.crewdev/memory.json']);
    expect(memoryJson).toHaveProperty('projectId');
    expect(memoryJson).toHaveProperty('decisionLog');
    expect(memoryJson).toHaveProperty('projectState');
    expect(memoryJson).toHaveProperty('errorHistory');
    expect(memoryJson).toHaveProperty('userPreferences');
    expect(Array.isArray(memoryJson.decisionLog)).toBe(true);
    expect(Array.isArray(memoryJson.errorHistory)).toBe(true);
  });

  it('should create features/ directory', async () => {
    await createProject('My Project', '/test/dir');

    expect(mockState.dirs.has('/test/dir/.crewdev/features')).toBe(true);
  });

  it('should create crew/ directory', async () => {
    await createProject('My Project', '/test/dir');

    expect(mockState.dirs.has('/test/dir/.crewdev/crew')).toBe(true);
  });

  it('should return DUPLICATE_PROJECT error for existing .crewdev/ in directory', async () => {
    mockState.dirs.add('/test/dir/.crewdev');

    const result = await createProject('My Project', '/test/dir');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DUPLICATE_PROJECT');
    }
  });

  it('should return PATH_NOT_FOUND for invalid directory path', async () => {
    const result = await createProject('My Project', '/nonexistent/path');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PATH_NOT_FOUND');
    }
  });
});
