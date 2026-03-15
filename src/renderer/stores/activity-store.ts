import { create } from 'zustand';
import type { ActivityEntry } from '../../shared/types/activity';

interface ActivityState {
  entries: ActivityEntry[];
  addEntry: (entry: ActivityEntry) => void;
  clear: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  entries: [],

  addEntry: (entry) => {
    set((state) => ({ entries: [...state.entries, entry] }));
  },

  clear: () => {
    set({ entries: [] });
  },
}));
