export type BuildQuality = 'excellent' | 'good' | 'needs-polish';
export type MilestoneStyle = 'none' | 'spark' | 'blaze' | 'inferno' | 'legendary';

export interface StreakState {
  currentStreak: number;
  lastCompletionDate: string | null;
  shieldsRemaining: number;
  lastShieldGrantMonth: string | null;
}

export interface XpState {
  totalXp: number;
  level: number;
  displayPercent: number;
}

export interface GamificationState {
  streak: StreakState;
  xp: XpState;
}

export interface QualityRollResult {
  quality: BuildQuality;
  animation: string;
}

export const BUILD_QUALITY_WEIGHTS: Record<BuildQuality, number> = {
  excellent: 0.1,
  good: 0.75,
  'needs-polish': 0.15,
};

export const MILESTONE_THRESHOLDS: Array<{ days: number; style: MilestoneStyle }> = [
  { days: 90, style: 'legendary' },
  { days: 60, style: 'inferno' },
  { days: 30, style: 'blaze' },
  { days: 7, style: 'spark' },
];

export const XP_PER_TASK = 25;
export const XP_PER_LEVEL = 100;

export function createDefaultGamificationState(): GamificationState {
  return {
    streak: {
      currentStreak: 0,
      lastCompletionDate: null,
      shieldsRemaining: 1,
      lastShieldGrantMonth: null,
    },
    xp: {
      totalXp: 0,
      level: 1,
      displayPercent: 80,
    },
  };
}
