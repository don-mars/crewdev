// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { loadKnowledgeProfile, saveKnowledgeProfile } from '../../../main/language/knowledge-persistence';
import type { KnowledgeProfile } from '../../../shared/types/knowledge';

describe('knowledge-persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadKnowledgeProfile', () => {
    it('should load and parse profile from disk', async () => {
      const profile: KnowledgeProfile = {
        component: { level: 2, exposures: 5 },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(profile));

      const result = await loadKnowledgeProfile('/project/.crewdev/knowledge.json');

      expect(result).toEqual(profile);
      expect(mockReadFile).toHaveBeenCalledWith('/project/.crewdev/knowledge.json', 'utf-8');
    });

    it('should return default profile when file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const result = await loadKnowledgeProfile('/project/.crewdev/knowledge.json');

      expect(result).toHaveProperty('component');
      expect(result.component.level).toBe(0);
    });
  });

  describe('saveKnowledgeProfile', () => {
    it('should write profile to disk as JSON', async () => {
      mockWriteFile.mockResolvedValue(undefined);
      const profile: KnowledgeProfile = {
        component: { level: 3, exposures: 10 },
      };

      await saveKnowledgeProfile('/project/.crewdev/knowledge.json', profile);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/project/.crewdev/knowledge.json',
        JSON.stringify(profile, null, 2),
      );
    });
  });
});
