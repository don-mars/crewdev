import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock window.crewdev before importing store
const mockOnboarding = vi.hoisted(() => ({
  getProgress: vi.fn(),
  stepComplete: vi.fn(),
  skip: vi.fn(),
  detectFirstRun: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: { onboarding: mockOnboarding },
});

import { useOnboardingStore } from '../../../renderer/stores/onboarding-store';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useOnboardingStore.setState({
      currentStep: 'welcome',
      completedSteps: [],
      completed: false,
      isFirstRun: true,
      loading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe('welcome');
    expect(state.completedSteps).toEqual([]);
    expect(state.completed).toBe(false);
    expect(state.isFirstRun).toBe(true);
  });

  it('should load progress from IPC', async () => {
    mockOnboarding.getProgress.mockResolvedValue({
      success: true,
      data: { currentStep: 'github', completedSteps: ['welcome'], completed: false },
    });

    await act(async () => {
      await useOnboardingStore.getState().loadProgress();
    });

    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe('github');
    expect(state.completedSteps).toEqual(['welcome']);
  });

  it('should complete a step via IPC', async () => {
    mockOnboarding.stepComplete.mockResolvedValue({
      success: true,
      data: { currentStep: 'github', completedSteps: ['welcome'], completed: false },
    });

    await act(async () => {
      await useOnboardingStore.getState().completeStep('welcome');
    });

    expect(mockOnboarding.stepComplete).toHaveBeenCalledWith('welcome');
    expect(useOnboardingStore.getState().currentStep).toBe('github');
  });

  it('should skip a step via IPC', async () => {
    mockOnboarding.skip.mockResolvedValue({
      success: true,
      data: { currentStep: 'linear', completedSteps: ['welcome'], completed: false },
    });

    await act(async () => {
      await useOnboardingStore.getState().skipStep('github');
    });

    expect(mockOnboarding.skip).toHaveBeenCalledWith('github');
    expect(useOnboardingStore.getState().currentStep).toBe('linear');
  });

  it('should detect first run via IPC', async () => {
    mockOnboarding.detectFirstRun.mockResolvedValue({
      success: true,
      data: false,
    });

    await act(async () => {
      await useOnboardingStore.getState().checkFirstRun();
    });

    expect(useOnboardingStore.getState().isFirstRun).toBe(false);
  });
});
