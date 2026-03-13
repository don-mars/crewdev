// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readMemory, writeMemory } from '../../../main/memory/shared-memory';
import type { SharedMemory } from '../../../shared/types/project';

const { mockFs } = vi.hoisted(() => ({
  mockFs: {} as Record<string, string>,
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: vi.fn(async (path: string) => {
    if (mockFs[path] !== undefined) {
      return mockFs[path];
    }
    throw new Error('ENOENT');
  }),
  writeFile: vi.fn(async (path: string, content: string) => {
    mockFs[path] = content;
  }),
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const MEMORY_PATH = '/project/.crewdev/memory.json';

const VALID_MEMORY: SharedMemory = {
  projectId: 'proj-1',
  decisionLog: [{ timestamp: '2026-03-13T00:00:00Z', decision: 'Use React', reason: 'Team knows it' }],
  knowledgeProfile: { typescript: 0.9 },
};

describe('Shared Memory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockFs).forEach((key) => delete mockFs[key]);
  });

  describe('readMemory()', () => {
    it('should return correctly typed SharedMemory object', async () => {
      mockFs[MEMORY_PATH] = JSON.stringify(VALID_MEMORY);

      const result = await readMemory(MEMORY_PATH);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe('proj-1');
        expect(result.data.decisionLog).toHaveLength(1);
        expect(result.data.knowledgeProfile.typescript).toBe(0.9);
      }
    });

    it('should return MEMORY_CORRUPT error for malformed JSON', async () => {
      mockFs[MEMORY_PATH] = '{bad json!!!';

      const result = await readMemory(MEMORY_PATH);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MEMORY_CORRUPT');
      }
    });

    it('should return MEMORY_NOT_FOUND error if file missing', async () => {
      const result = await readMemory(MEMORY_PATH);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MEMORY_NOT_FOUND');
      }
    });
  });

  describe('writeMemory()', () => {
    it('should merge patch without losing existing fields', async () => {
      mockFs[MEMORY_PATH] = JSON.stringify(VALID_MEMORY);

      const result = await writeMemory(MEMORY_PATH, {
        knowledgeProfile: { react: 0.8 },
      });

      expect(result.success).toBe(true);
      const written = JSON.parse(mockFs[MEMORY_PATH]) as SharedMemory;
      expect(written.projectId).toBe('proj-1');
      expect(written.decisionLog).toHaveLength(1);
      expect(written.knowledgeProfile.react).toBe(0.8);
    });

    it('should handle empty patch as no-op', async () => {
      mockFs[MEMORY_PATH] = JSON.stringify(VALID_MEMORY);

      const result = await writeMemory(MEMORY_PATH, {});

      expect(result.success).toBe(true);
      const written = JSON.parse(mockFs[MEMORY_PATH]) as SharedMemory;
      expect(written).toEqual(VALID_MEMORY);
    });

    it('should write merged result back to disk', async () => {
      mockFs[MEMORY_PATH] = JSON.stringify(VALID_MEMORY);

      await writeMemory(MEMORY_PATH, {
        decisionLog: [
          ...VALID_MEMORY.decisionLog,
          { timestamp: '2026-03-13T01:00:00Z', decision: 'Add Zustand', reason: 'Simple state' },
        ],
      });

      const written = JSON.parse(mockFs[MEMORY_PATH]) as SharedMemory;
      expect(written.decisionLog).toHaveLength(2);
      expect(written.decisionLog[1].decision).toBe('Add Zustand');
    });

    it('should not corrupt file on concurrent writes', async () => {
      mockFs[MEMORY_PATH] = JSON.stringify(VALID_MEMORY);

      // Simulate two concurrent writes
      const [r1, r2] = await Promise.all([
        writeMemory(MEMORY_PATH, { knowledgeProfile: { go: 0.5 } }),
        writeMemory(MEMORY_PATH, { knowledgeProfile: { python: 0.7 } }),
      ]);

      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      // File should be valid JSON
      const written = JSON.parse(mockFs[MEMORY_PATH]) as SharedMemory;
      expect(written.projectId).toBe('proj-1');
    });

    it('should return error if memory file is missing', async () => {
      const result = await writeMemory(MEMORY_PATH, {
        knowledgeProfile: { go: 0.5 },
      });

      expect(result.success).toBe(false);
    });
  });
});
