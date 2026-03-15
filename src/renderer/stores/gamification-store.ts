import { create } from 'zustand';
import type { StreakState, XpState, QualityRollResult, GamificationState } from '../../shared/types/gamification';
import { createDefaultGamificationState } from '../../shared/types/gamification';

interface GamificationStoreState {
  streak: StreakState;
  xp: XpState;
  lastQuality: QualityRollResult | null;
  loading: boolean;
  loadState: () => Promise<void>;
  recordCompletion: () => Promise<void>;
  rollBuildQuality: () => Promise<void>;
}

const defaults = createDefaultGamificationState();

export const useGamificationStore = create<GamificationStoreState>((set) => ({
  streak: defaults.streak,
  xp: defaults.xp,
  lastQuality: null,
  loading: false,

  loadState: async () => {
    set({ loading: true });
    const result = await window.crewdev.gamification.getState();
    const response = result as { success: boolean; data: GamificationState };
    if (response.success) {
      set({
        streak: response.data.streak,
        xp: response.data.xp,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },

  recordCompletion: async () => {
    set({ loading: true });
    const result = await window.crewdev.gamification.recordCompletion();
    const response = result as { success: boolean; data: GamificationState };
    if (response.success) {
      set({
        streak: response.data.streak,
        xp: response.data.xp,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },

  rollBuildQuality: async () => {
    set({ loading: true });
    const result = await window.crewdev.gamification.rollBuildQuality();
    const response = result as { success: boolean; data: QualityRollResult };
    if (response.success) {
      set({
        lastQuality: response.data,
        loading: false,
      });
    } else {
      set({ loading: false });
    }
  },
}));
