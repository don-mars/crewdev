// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { addXp, getDisplayPercent } from '../../../main/gamification/xp';
import type { XpState } from '../../../shared/types/gamification';

function makeXp(overrides: Partial<XpState> = {}): XpState {
  return {
    totalXp: 0,
    level: 1,
    displayPercent: 80,
    ...overrides,
  };
}

describe('Crew XP', () => {
  it('should increment XP on task completion', () => {
    const state = makeXp({ totalXp: 50 });
    const updated = addXp(state, 25);

    expect(updated.totalXp).toBe(75);
  });

  it('should keep bar display between 80-99% until level-up', () => {
    const state = makeXp({ totalXp: 10, level: 1 });
    const updated = addXp(state, 25);

    expect(updated.displayPercent).toBeGreaterThanOrEqual(80);
    expect(updated.displayPercent).toBeLessThanOrEqual(99);
  });

  it('should trigger level-up at correct threshold', () => {
    const state = makeXp({ totalXp: 90, level: 1 });
    const updated = addXp(state, 25);

    expect(updated.level).toBe(2);
  });

  it('should reset bar display after level-up', () => {
    const state = makeXp({ totalXp: 90, level: 1 });
    const updated = addXp(state, 25);

    expect(updated.displayPercent).toBeGreaterThanOrEqual(80);
    expect(updated.displayPercent).toBeLessThanOrEqual(99);
  });

  it('should handle multiple level-ups at once', () => {
    const state = makeXp({ totalXp: 50, level: 1 });
    const updated = addXp(state, 250);

    expect(updated.level).toBe(4);
    expect(updated.totalXp).toBe(300);
  });

  it('should compute display percent correctly', () => {
    // 60% progress into current level → mapped to 80-99 range
    const percent = getDisplayPercent(60, 100);
    expect(percent).toBeGreaterThanOrEqual(80);
    expect(percent).toBeLessThanOrEqual(99);
  });
});
