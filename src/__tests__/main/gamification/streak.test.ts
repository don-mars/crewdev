// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordCompletion,
  checkStreak,
  getMilestoneStyle,
  grantMonthlyShield,
} from '../../../main/gamification/streak';
import type { StreakState } from '../../../shared/types/gamification';

function makeStreak(overrides: Partial<StreakState> = {}): StreakState {
  return {
    currentStreak: 0,
    lastCompletionDate: null,
    shieldsRemaining: 1,
    lastShieldGrantMonth: null,
    ...overrides,
  };
}

describe('Build Streak', () => {
  it('should increment streak on daily task completion', () => {
    const state = makeStreak({ currentStreak: 3, lastCompletionDate: '2026-03-11' });
    const updated = recordCompletion(state, '2026-03-12');

    expect(updated.currentStreak).toBe(4);
    expect(updated.lastCompletionDate).toBe('2026-03-12');
  });

  it('should not double-increment for same-day completions', () => {
    const state = makeStreak({ currentStreak: 3, lastCompletionDate: '2026-03-12' });
    const updated = recordCompletion(state, '2026-03-12');

    expect(updated.currentStreak).toBe(3);
  });

  it('should reset streak on missed day', () => {
    const state = makeStreak({
      currentStreak: 5,
      lastCompletionDate: '2026-03-10',
      shieldsRemaining: 0,
    });
    const updated = checkStreak(state, '2026-03-12');

    expect(updated.currentStreak).toBe(0);
  });

  it('should not reset if streak shield is available', () => {
    const state = makeStreak({
      currentStreak: 5,
      lastCompletionDate: '2026-03-10',
      shieldsRemaining: 1,
    });
    const updated = checkStreak(state, '2026-03-12');

    expect(updated.currentStreak).toBe(5);
  });

  it('should decrement shield count after use', () => {
    const state = makeStreak({
      currentStreak: 5,
      lastCompletionDate: '2026-03-10',
      shieldsRemaining: 1,
    });
    const updated = checkStreak(state, '2026-03-12');

    expect(updated.shieldsRemaining).toBe(0);
  });

  it('should grant one shield per month', () => {
    const state = makeStreak({
      shieldsRemaining: 0,
      lastShieldGrantMonth: '2026-02',
    });
    const updated = grantMonthlyShield(state, '2026-03-12');

    expect(updated.shieldsRemaining).toBe(1);
    expect(updated.lastShieldGrantMonth).toBe('2026-03');
  });

  it('should not grant shield twice in same month', () => {
    const state = makeStreak({
      shieldsRemaining: 1,
      lastShieldGrantMonth: '2026-03',
    });
    const updated = grantMonthlyShield(state, '2026-03-15');

    expect(updated.shieldsRemaining).toBe(1);
  });

  it('should apply milestone style at 7 days', () => {
    expect(getMilestoneStyle(7)).toBe('spark');
  });

  it('should apply milestone style at 30 days', () => {
    expect(getMilestoneStyle(30)).toBe('blaze');
  });

  it('should apply milestone style at 60 days', () => {
    expect(getMilestoneStyle(60)).toBe('inferno');
  });

  it('should apply milestone style at 90 days', () => {
    expect(getMilestoneStyle(90)).toBe('legendary');
  });

  it('should return none for streaks below 7', () => {
    expect(getMilestoneStyle(3)).toBe('none');
  });
});
