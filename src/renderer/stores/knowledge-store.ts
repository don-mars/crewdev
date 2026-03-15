import { create } from 'zustand';
import type { KnowledgeProfile } from '../../shared/types/knowledge';

interface KnowledgeState {
  profile: KnowledgeProfile;
  loading: boolean;
  loadProfile: () => Promise<void>;
  updateLevel: (concept: string, level: number) => Promise<void>;
  adaptText: (text: string) => Promise<string | null>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  profile: {},
  loading: false,

  loadProfile: async () => {
    set({ loading: true });
    const result = await window.crewdev.knowledge.getProfile();
    const response = result as { success: boolean; data: KnowledgeProfile };
    if (response.success) {
      set({ profile: response.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  updateLevel: async (concept: string, level: number) => {
    const result = await window.crewdev.knowledge.updateLevel(concept, level);
    const response = result as { success: boolean };
    if (response.success) {
      await get().loadProfile();
    }
  },

  adaptText: async (text: string) => {
    const result = await window.crewdev.knowledge.adaptText(text);
    const response = result as { success: boolean; data: string };
    if (response.success) {
      return response.data;
    }
    return null;
  },
}));
