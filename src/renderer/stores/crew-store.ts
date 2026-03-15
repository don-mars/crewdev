import { create } from 'zustand';
import type { CrewMemberConfig, CrewStatus, CrewProcess } from '../../shared/types/crew';

export interface CrewMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly configContent: string;
  status: CrewStatus;
}

interface CrewState {
  members: CrewMember[];
  activeIds: string[];
  spawn: (config: CrewMemberConfig) => Promise<void>;
  kill: (id: string) => Promise<void>;
  killAll: () => Promise<void>;
  updateStatus: (id: string, status: CrewStatus) => void;
}

const DEFAULT_CREW: CrewMember[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Project lead — plans, delegates, and tracks progress',
    configContent: '',
    status: 'idle',
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Implements features, writes clean functional code',
    configContent: '',
    status: 'idle',
  },
  {
    id: 'stylist',
    name: 'Stylist',
    role: 'UI/UX, React components, styling, accessibility',
    configContent: '',
    status: 'idle',
  },
  {
    id: 'engineer',
    name: 'Engineer',
    role: 'Architecture, APIs, data models, system design',
    configContent: '',
    status: 'idle',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    role: 'Reviews code, catches bugs, enforces standards',
    configContent: '',
    status: 'idle',
  },
  {
    id: 'fixer',
    name: 'Fixer',
    role: 'Diagnoses and fixes bugs, resolves test failures',
    configContent: '',
    status: 'idle',
  },
];

export const useCrewStore = create<CrewState>((set) => ({
  members: DEFAULT_CREW,
  activeIds: [],

  spawn: async (config) => {
    const result = await window.crewdev.crew.spawn(config);
    const response = result as { success: boolean; data: CrewProcess };
    if (response.success) {
      const member: CrewMember = {
        id: config.id,
        name: config.name,
        role: config.role,
        configContent: config.configContent,
        status: response.data.status,
      };
      set((state) => ({
        members: [...state.members, member],
        activeIds: [...state.activeIds, config.id],
      }));
    }
  },

  kill: async (id) => {
    const result = await window.crewdev.crew.kill(id);
    const response = result as { success: boolean };
    if (response.success) {
      set((state) => ({
        activeIds: state.activeIds.filter((aid) => aid !== id),
        members: state.members.map((m) =>
          m.id === id ? { ...m, status: 'idle' as CrewStatus } : m,
        ),
      }));
    }
  },

  killAll: async () => {
    const result = await window.crewdev.crew.killAll();
    const response = result as { success: boolean };
    if (response.success) {
      set((state) => ({
        activeIds: [],
        members: state.members.map((m) => ({ ...m, status: 'idle' as CrewStatus })),
      }));
    }
  },

  updateStatus: (id, status) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, status } : m,
      ),
    }));
  },
}));
