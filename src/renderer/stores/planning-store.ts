import { create } from 'zustand';

interface PlanningDoc {
  readonly name: string;
  readonly fileName: string;
  readonly lastModified: string;
}

interface PlanningState {
  docs: PlanningDoc[];
  loading: boolean;
  loadDocs: () => Promise<void>;
  createDoc: (name: string) => Promise<void>;
  deleteDoc: (fileName: string) => Promise<void>;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  docs: [],
  loading: false,

  loadDocs: async () => {
    set({ loading: true });
    const result = await window.crewdev.planning.list();
    const response = result as { success: boolean; data: PlanningDoc[] };
    if (response.success) {
      set({ docs: response.data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  createDoc: async (name: string) => {
    const result = await window.crewdev.planning.create(name);
    const response = result as { success: boolean; data: PlanningDoc };
    if (response.success) {
      await get().loadDocs();
    }
  },

  deleteDoc: async (fileName: string) => {
    const result = await window.crewdev.planning.delete(fileName);
    const response = result as { success: boolean };
    if (response.success) {
      await get().loadDocs();
    }
  },
}));
