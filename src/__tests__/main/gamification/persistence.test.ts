// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: mockFs.readFile,
  writeFile: mockFs.writeFile,
}));

import { saveGamificationState, loadGamificationState } from '../../../main/gamification/persistence';
import type { GamificationState } from '../../../shared/types/gamification';
import { createDefaultGamificationState } from '../../../shared/types/gamification';

describe('Gamification persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save state to .crewdev/gamification.json', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);

    const state = createDefaultGamificationState();
    state.streak.currentStreak = 5;

    await saveGamificationState('/project/.crewdev/gamification.json', state);

    expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    const [path, content] = mockFs.writeFile.mock.calls[0];
    expect(path).toBe('/project/.crewdev/gamification.json');
    const parsed = JSON.parse(content);
    expect(parsed.streak.currentStreak).toBe(5);
  });

  it('should reload state correctly after restart', async () => {
    const state: GamificationState = {
      streak: {
        currentStreak: 10,
        lastCompletionDate: '2026-03-12',
        shieldsRemaining: 0,
        lastShieldGrantMonth: '2026-03',
      },
      xp: { totalXp: 150, level: 2, displayPercent: 90 },
    };
    mockFs.readFile.mockResolvedValue(JSON.stringify(state));

    const loaded = await loadGamificationState('/project/.crewdev/gamification.json');

    expect(loaded.success).toBe(true);
    if (loaded.success) {
      expect(loaded.data.streak.currentStreak).toBe(10);
      expect(loaded.data.xp.level).toBe(2);
    }
  });

  it('should handle missing gamification.json with defaults', async () => {
    mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

    const loaded = await loadGamificationState('/project/.crewdev/gamification.json');

    expect(loaded.success).toBe(true);
    if (loaded.success) {
      expect(loaded.data.streak.currentStreak).toBe(0);
      expect(loaded.data.xp.level).toBe(1);
    }
  });
});
