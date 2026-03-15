import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock window.crewdev before importing store
const mockGamification = vi.hoisted(() => ({
  getState: vi.fn(),
  recordCompletion: vi.fn(),
  rollBuildQuality: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { gamification: mockGamification },
});

import { useGamificationStore } from '../../../renderer/stores/gamification-store';

describe('useGamificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useGamificationStore.setState({
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
      lastQuality: null,
      loading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useGamificationStore.getState();
    expect(state.streak).toEqual({
      currentStreak: 0,
      lastCompletionDate: null,
      shieldsRemaining: 1,
      lastShieldGrantMonth: null,
    });
    expect(state.xp).toEqual({
      totalXp: 0,
      level: 1,
      displayPercent: 80,
    });
    expect(state.lastQuality).toBeNull();
  });

  it('should load state from IPC via loadState', async () => {
    mockGamification.getState.mockResolvedValue({
      success: true,
      data: {
        streak: {
          currentStreak: 5,
          lastCompletionDate: '2026-03-11',
          shieldsRemaining: 0,
          lastShieldGrantMonth: '2026-03',
        },
        xp: {
          totalXp: 250,
          level: 3,
          displayPercent: 50,
        },
      },
    });

    await act(async () => {
      await useGamificationStore.getState().loadState();
    });

    const state = useGamificationStore.getState();
    expect(mockGamification.getState).toHaveBeenCalled();
    expect(state.streak.currentStreak).toBe(5);
    expect(state.xp.totalXp).toBe(250);
    expect(state.xp.level).toBe(3);
  });

  it('should record completion via IPC and update state', async () => {
    mockGamification.recordCompletion.mockResolvedValue({
      success: true,
      data: {
        streak: {
          currentStreak: 1,
          lastCompletionDate: '2026-03-12',
          shieldsRemaining: 1,
          lastShieldGrantMonth: null,
        },
        xp: {
          totalXp: 25,
          level: 1,
          displayPercent: 5,
        },
      },
    });

    await act(async () => {
      await useGamificationStore.getState().recordCompletion();
    });

    const state = useGamificationStore.getState();
    expect(mockGamification.recordCompletion).toHaveBeenCalled();
    expect(state.streak.currentStreak).toBe(1);
    expect(state.xp.totalXp).toBe(25);
  });

  it('should roll build quality via IPC and set lastQuality', async () => {
    mockGamification.rollBuildQuality.mockResolvedValue({
      success: true,
      data: {
        quality: 'excellent',
        animation: 'sparkle',
      },
    });

    await act(async () => {
      await useGamificationStore.getState().rollBuildQuality();
    });

    const state = useGamificationStore.getState();
    expect(mockGamification.rollBuildQuality).toHaveBeenCalled();
    expect(state.lastQuality).toEqual({
      quality: 'excellent',
      animation: 'sparkle',
    });
  });
});
