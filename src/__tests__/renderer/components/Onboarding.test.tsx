import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Onboarding } from '../../../renderer/components/Onboarding';
import type { OnboardingProgress } from '../../../shared/types/onboarding';

describe('Onboarding flow', () => {
  let mockOnStepComplete: (step: string) => void;
  let mockOnSkip: (step: string) => void;
  let mockValidateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>;
  let mockOnComplete: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStepComplete = vi.fn() as unknown as typeof mockOnStepComplete;
    mockOnSkip = vi.fn() as unknown as typeof mockOnSkip;
    mockValidateApiKey = vi.fn().mockResolvedValue({ valid: true }) as unknown as typeof mockValidateApiKey;
    mockOnComplete = vi.fn() as unknown as typeof mockOnComplete;
  });

  function renderOnboarding(step: string = 'welcome') {
    const progress: OnboardingProgress = {
      currentStep: step as any,
      completedSteps: [],
      completed: false,
    };
    return render(
      <Onboarding
        progress={progress}
        onStepComplete={mockOnStepComplete}
        onSkip={mockOnSkip}
        validateApiKey={mockValidateApiKey}
        onComplete={mockOnComplete}
      />,
    );
  }

  it('should render Welcome screen as step 1', () => {
    renderOnboarding('welcome');
    expect(screen.getByText(/welcome/i)).toBeTruthy();
  });

  it('should render GitHub connection as step 2', () => {
    renderOnboarding('github');
    expect(screen.getByRole('heading', { name: /github connection/i })).toBeTruthy();
  });

  it('should allow skipping GitHub connection', () => {
    renderOnboarding('github');
    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);
    expect(mockOnSkip).toHaveBeenCalledWith('github');
  });

  it('should render Linear connection as step 3', () => {
    renderOnboarding('linear');
    expect(screen.getByRole('heading', { name: /linear connection/i })).toBeTruthy();
  });

  it('should allow skipping Linear connection', () => {
    renderOnboarding('linear');
    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);
    expect(mockOnSkip).toHaveBeenCalledWith('linear');
  });

  it('should render API key input as step 4', () => {
    renderOnboarding('api-key');
    expect(screen.getByRole('heading', { name: /api key/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/sk-ant/i)).toBeTruthy();
  });

  it('should reject invalid API key with clear message', async () => {
    (mockValidateApiKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: false,
      error: 'Invalid API key',
    });

    renderOnboarding('api-key');

    const input = screen.getByPlaceholderText(/sk-ant/i);
    fireEvent.change(input, { target: { value: 'bad-key' } });
    fireEvent.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeTruthy();
    });
  });

  it('should accept valid API key', async () => {
    renderOnboarding('api-key');

    const input = screen.getByPlaceholderText(/sk-ant/i);
    fireEvent.change(input, { target: { value: 'sk-ant-valid-key' } });
    fireEvent.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(mockOnStepComplete).toHaveBeenCalledWith('api-key');
    });
  });

  it('should render Knowledge Profile as step 5', () => {
    renderOnboarding('knowledge');
    expect(screen.getByText(/knowledge/i)).toBeTruthy();
  });

  it('should render Meet Your Crew as step 6', () => {
    renderOnboarding('meet-crew');
    expect(screen.getByText(/meet your crew/i)).toBeTruthy();
  });

  it('should render project setup as step 7', () => {
    renderOnboarding('project-setup');
    expect(screen.getByRole('heading', { name: /project/i })).toBeTruthy();
  });
});
