// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadDoc,
  createDoc,
  deleteDoc,
  listDocs,
} from '../../../main/planning/planning-docs';

const { mockFs, mockState } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string | Buffer>,
  mockState: { dirs: new Set<string>() },
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  writeFile: vi.fn(async (path: string, content: string | Buffer) => {
    mockFs[path] = content;
  }),
  readdir: vi.fn(async () => {
    return Object.keys(mockFs)
      .filter((k) => k.startsWith('/project/.crewdev/planning/'))
      .map((k) => k.split('/').pop()!);
  }),
  unlink: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      delete mockFs[path];
      return;
    }
    throw new Error('ENOENT');
  }),
  access: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined || mockState.dirs.has(path)) {
      return;
    }
    throw new Error('ENOENT');
  }),
  stat: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return { mtimeMs: Date.now(), mtime: new Date() };
    }
    throw new Error('ENOENT');
  }),
  mkdir: vi.fn(async (path: string) => {
    mockState.dirs.add(path);
  }),
  copyFile: vi.fn(async (src: string, dest: string) => {
    mockFs[dest] = mockFs[src] ?? '';
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const PLANNING_DIR = '/project/.crewdev/planning';

describe('Planning documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
    mockState.dirs = new Set();
    mockState.dirs.add(PLANNING_DIR);
  });

  it('should upload and store PDF file', async () => {
    const result = await uploadDoc(PLANNING_DIR, '/tmp/design.pdf', 'design.pdf');

    expect(result.success).toBe(true);
    expect(mockFs[`${PLANNING_DIR}/design.pdf`]).toBeDefined();
  });

  it('should upload and store Markdown file', async () => {
    const result = await uploadDoc(PLANNING_DIR, '/tmp/notes.md', 'notes.md');

    expect(result.success).toBe(true);
    expect(mockFs[`${PLANNING_DIR}/notes.md`]).toBeDefined();
  });

  it('should upload and store plain text file', async () => {
    const result = await uploadDoc(PLANNING_DIR, '/tmp/readme.txt', 'readme.txt');

    expect(result.success).toBe(true);
    expect(mockFs[`${PLANNING_DIR}/readme.txt`]).toBeDefined();
  });

  it('should reject unsupported file types with clear error', async () => {
    const result = await uploadDoc(PLANNING_DIR, '/tmp/image.png', 'image.png');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNSUPPORTED_TYPE');
    }
  });

  it('should create new Markdown document with given name', async () => {
    const result = await createDoc(PLANNING_DIR, 'Architecture Plan');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Architecture Plan');
    }
    expect(mockFs[`${PLANNING_DIR}/Architecture Plan.md`]).toBeDefined();
  });

  it('should reject empty document name', async () => {
    const result = await createDoc(PLANNING_DIR, '');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_NAME');
    }
  });

  it('should reject duplicate document name', async () => {
    mockFs[`${PLANNING_DIR}/Existing.md`] = '# Existing';

    const result = await createDoc(PLANNING_DIR, 'Existing');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DUPLICATE_NAME');
    }
  });

  it('should delete document from disk', async () => {
    mockFs[`${PLANNING_DIR}/old.md`] = '# Old';

    const result = await deleteDoc(PLANNING_DIR, 'old.md');

    expect(result.success).toBe(true);
    expect(mockFs[`${PLANNING_DIR}/old.md`]).toBeUndefined();
  });

  it('should list documents with name and last-modified date', async () => {
    mockFs[`${PLANNING_DIR}/doc1.md`] = '# Doc 1';
    mockFs[`${PLANNING_DIR}/doc2.txt`] = 'Doc 2';

    const result = await listDocs(PLANNING_DIR);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('lastModified');
    }
  });
});
