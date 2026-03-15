import { create } from 'zustand';
import type { FeatureTree, FeatureNode } from '../../shared/types/feature';

interface FeatureState {
  tree: FeatureTree;
  selectedId: string | null;
  selectedFeature: FeatureNode | null;
  loading: boolean;
  loadTree: () => Promise<void>;
  selectFeature: (id: string) => Promise<void>;
  createFeature: (input: unknown) => Promise<void>;
  updateFeature: (id: string, updates: unknown) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  tree: [],
  selectedId: null,
  selectedFeature: null,
  loading: false,

  loadTree: async () => {
    set({ loading: true });
    const result = await window.crewdev.feature.loadTree();
    const response = result as { success: boolean; data: FeatureTree };
    if (response.success) {
      set({ tree: response.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  selectFeature: async (id: string) => {
    set({ selectedId: id, loading: true });
    const result = await window.crewdev.feature.read(id);
    const response = result as { success: boolean; data: FeatureNode };
    if (response.success) {
      set({ selectedFeature: response.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  createFeature: async (input: unknown) => {
    set({ loading: true });
    const result = await window.crewdev.feature.create(input);
    const response = result as { success: boolean; data: unknown };
    if (response.success) {
      await get().loadTree();
    } else {
      set({ loading: false });
    }
  },

  updateFeature: async (id: string, updates: unknown) => {
    set({ loading: true });
    const result = await window.crewdev.feature.update(id, updates);
    const response = result as { success: boolean; data: unknown };
    if (response.success) {
      await get().loadTree();
    } else {
      set({ loading: false });
    }
  },

  deleteFeature: async (id: string) => {
    set({ loading: true });
    const result = await window.crewdev.feature.delete(id);
    const response = result as { success: boolean; data: unknown };
    if (response.success) {
      set({ selectedId: null, selectedFeature: null });
      await get().loadTree();
    } else {
      set({ loading: false });
    }
  },
}));
