import type { XpState } from '../../shared/types/gamification';
import { XP_PER_LEVEL } from '../../shared/types/gamification';

export function getDisplayPercent(progressXp: number, levelXp: number): number {
  const ratio = Math.min(progressXp / levelXp, 0.99);
  // Map 0-0.99 to 80-99
  return Math.floor(80 + ratio * 19);
}

export function addXp(state: XpState, amount: number): XpState {
  const newTotal = state.totalXp + amount;
  const newLevel = Math.floor(newTotal / XP_PER_LEVEL) + 1;
  const progressXp = newTotal % XP_PER_LEVEL;
  const displayPercent = getDisplayPercent(progressXp, XP_PER_LEVEL);

  return {
    totalXp: newTotal,
    level: newLevel,
    displayPercent,
  };
}
