import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding } from '../../../renderer/components/Onboarding';
import type { OnboardingProgress } from '../../../shared/types/onboarding';

const mockProjectCreate = vi.fn().mockResolvedValue({ success: true, data: { id: 'p1', name: 'my-app', dirPath: '/projects/my-app', createdAt: '2026-03-13' } });
const mockProjectSelect = vi.fn().mockResolvedValue({ success: true, data: { id: 'p1', name: 'my-app', dirPath: '/projects/my-app', createdAt: '2026-03-13' } });

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: {
    linear: { sync: vi.fn().mockResolvedValue({ success: true }) },
    project: { create: mockProjectCreate, select: mockProjectSelect },
  },
});

describe('Onboarding flow', () => {
  let mockOnStepComplete: (step: string) => void;
  let mockOnSkip: (step: string) => void;
  let mockOnComplete: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnStepComplete = vi.fn() as unknown as typeof mockOnStepComplete;
    mockOnSkip = vi.fn() as unknown as typeof mockOnSkip;
    mockOnComplete = vi.fn() as unknown as typeof mockOnComplete;
  });

  function renderOnboarding(step: string = 'welcome') {
    const progress: OnboardingProgress = {
      currentStep: step as OnboardingProgress['currentStep'],
      completedSteps: [],
      completed: false,
    };
    return render(
      <Onboarding
        progress={progress}
        onStepComplete={mockOnStepComplete}
        onSkip={mockOnSkip}
        onComplete={mockOnComplete}
      />,
    );
  }

  it('should render Welcome screen as step 1', () => {
    renderOnboarding('welcome');
    expect(screen.getByText(/welcome to crewdev/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /get started/i })).toBeTruthy();
  });

  it('should render GitHub connection as step 2', () => {
    renderOnboarding('github');
    expect(screen.getByRole('heading', { name: /connect github/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/ghp_/i)).toBeTruthy();
  });

  it('should allow skipping GitHub connection', () => {
    renderOnboarding('github');
    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);
    expect(mockOnSkip).toHaveBeenCalledWith('github');
  });

  it('should render Linear connection as step 3', () => {
    renderOnboarding('linear');
    expect(screen.getByRole('heading', { name: /connect linear/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/lin_api_/i)).toBeTruthy();
  });

  it('should allow skipping Linear connection', () => {
    renderOnboarding('linear');
    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);
    expect(mockOnSkip).toHaveBeenCalledWith('linear');
  });

  it('should render Knowledge Profile as step 4', () => {
    renderOnboarding('knowledge');
    expect(screen.getByText(/your experience level/i)).toBeTruthy();
    expect(screen.getByText('Beginner')).toBeTruthy();
    expect(screen.getByText('Intermediate')).toBeTruthy();
    expect(screen.getByText('Senior')).toBeTruthy();
  });

  it('should render Meet Your Crew as step 5', () => {
    renderOnboarding('meet-crew');
    expect(screen.getByRole('heading', { name: /meet your crew/i })).toBeTruthy();
    expect(screen.getByText(/orchestrator/i)).toBeTruthy();
    expect(screen.getByText(/builder/i)).toBeTruthy();
  });

  it('should render project setup as step 6', () => {
    renderOnboarding('project-setup');
    expect(screen.getByRole('heading', { name: /open a project/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/projects/i)).toBeTruthy();
  });

  it('should call project.create when Open Project is clicked with a path', async () => {
    renderOnboarding('project-setup');
    const input = screen.getByPlaceholderText(/projects/i);
    fireEvent.change(input, { target: { value: '/projects/my-app' } });

    const button = screen.getByRole('button', { name: /open project/i });
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(mockProjectCreate).toHaveBeenCalledWith('my-app', '/projects/my-app');
    });
  });

  it('should call onComplete when skipping project setup', async () => {
    renderOnboarding('project-setup');
    const button = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
