import type { StreakState, MilestoneStyle } from '../../shared/types/gamification';
import { MILESTONE_THRESHOLDS } from '../../shared/types/gamification';

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function recordCompletion(state: StreakState, todayDate: string): StreakState {
  if (state.lastCompletionDate === todayDate) {
    return state;
  }

  const gap = state.lastCompletionDate ? daysBetween(state.lastCompletionDate, todayDate) : 0;

  if (!state.lastCompletionDate || gap === 1) {
    return {
      ...state,
      currentStreak: state.currentStreak + 1,
      lastCompletionDate: todayDate,
    };
  }

  // Gap > 1: streak broken, start fresh at 1
  return {
    ...state,
    currentStreak: 1,
    lastCompletionDate: todayDate,
  };
}

export function checkStreak(state: StreakState, todayDate: string): StreakState {
  if (!state.lastCompletionDate) return state;

  const gap = daysBetween(state.lastCompletionDate, todayDate);

  if (gap <= 1) return state;

  // Missed day(s)
  if (state.shieldsRemaining > 0) {
    return {
      ...state,
      shieldsRemaining: state.shieldsRemaining - 1,
    };
  }

  return {
    ...state,
    currentStreak: 0,
  };
}

export function grantMonthlyShield(state: StreakState, todayDate: string): StreakState {
  const currentMonth = todayDate.slice(0, 7); // "YYYY-MM"

  if (state.lastShieldGrantMonth === currentMonth) {
    return state;
  }

  return {
    ...state,
    shieldsRemaining: state.shieldsRemaining + 1,
    lastShieldGrantMonth: currentMonth,
  };
}

export function getMilestoneStyle(streakDays: number): MilestoneStyle {
  for (const { days, style } of MILESTONE_THRESHOLDS) {
    if (streakDays >= days) {
      return style;
    }
  }
  return 'none';
}
