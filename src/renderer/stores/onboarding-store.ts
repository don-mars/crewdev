import { create } from 'zustand';
import type { OnboardingStep } from '../../shared/types/onboarding';

interface IpcResult {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

interface OnboardingData {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  completed: boolean;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  completed: boolean;
  isFirstRun: boolean;
  loading: boolean;
  loadProgress: () => Promise<void>;
  completeStep: (step: string) => Promise<void>;
  skipStep: (step: string) => Promise<void>;
  checkFirstRun: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 'welcome',
  completedSteps: [],
  completed: false,
  isFirstRun: true,
  loading: false,

  loadProgress: async () => {
    set({ loading: true });
    try {
      const result = (await window.crewdev.onboarding.getProgress()) as IpcResult;
      if (result.success) {
        const data = result.data as OnboardingData;
        set({
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          completed: data.completed,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (err: unknown) {
      console.error('Onboarding IPC failed', err);
      set({ loading: false });
    }
  },

  completeStep: async (step: string) => {
    try {
      const result = (await window.crewdev.onboarding.stepComplete(step)) as IpcResult;
      if (result.success) {
        const data = result.data as OnboardingData;
        set({
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          completed: data.completed,
        });
      }
    } catch (err: unknown) {
      console.error('Onboarding IPC failed', err);
    }
  },

  skipStep: async (step: string) => {
    try {
      const result = (await window.crewdev.onboarding.skip(step)) as IpcResult;
      if (result.success) {
        const data = result.data as OnboardingData;
        set({
          currentStep: data.currentStep,
          completedSteps: data.completedSteps,
          completed: data.completed,
        });
      }
    } catch (err: unknown) {
      console.error('Onboarding IPC failed', err);
    }
  },

  checkFirstRun: async () => {
    try {
      const result = (await window.crewdev.onboarding.detectFirstRun()) as IpcResult;
      if (result.success) {
        set({ isFirstRun: result.data as boolean });
      }
    } catch (err: unknown) {
      console.error('Onboarding IPC failed', err);
    }
  },
}));
