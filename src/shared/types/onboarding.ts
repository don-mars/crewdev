export type OnboardingStep =
  | 'welcome'
  | 'github'
  | 'linear'
  | 'api-key'
  | 'knowledge'
  | 'meet-crew'
  | 'project-setup';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'welcome',
  'github',
  'linear',
  'api-key',
  'knowledge',
  'meet-crew',
  'project-setup',
] as const;

export const SKIPPABLE_STEPS: readonly OnboardingStep[] = ['github', 'linear'] as const;

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  completed: boolean;
}

export function createDefaultProgress(): OnboardingProgress {
  return {
    currentStep: 'welcome',
    completedSteps: [],
    completed: false,
  };
}

export const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  github: 'GitHub Connection',
  linear: 'Linear Connection',
  'api-key': 'API Key',
  knowledge: 'Knowledge Profile',
  'meet-crew': 'Meet Your Crew',
  'project-setup': 'Project Setup',
};
