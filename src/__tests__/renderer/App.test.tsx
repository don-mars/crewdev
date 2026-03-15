import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock all child components to isolate layout testing
vi.mock('../../renderer/components/FeatureTree', () => ({
  FeatureTree: () => <div data-testid="feature-tree">FeatureTree</div>,
}));

vi.mock('../../renderer/components/FeatureEditor', () => ({
  FeatureEditor: () => <div data-testid="feature-editor">FeatureEditor</div>,
}));

vi.mock('../../renderer/components/CrewPanel', () => ({
  CrewPanel: () => <div data-testid="crew-panel">CrewPanel</div>,
}));

vi.mock('../../renderer/components/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input">ChatInput</div>,
}));

vi.mock('../../renderer/components/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">ActivityFeed</div>,
}));

vi.mock('../../renderer/components/Onboarding', () => ({
  Onboarding: () => <div data-testid="onboarding">Onboarding</div>,
}));

import { useOnboardingStore } from '../../renderer/stores/onboarding-store';
import { useFeatureStore } from '../../renderer/stores/feature-store';
import { useCrewStore } from '../../renderer/stores/crew-store';
import { useActivityStore } from '../../renderer/stores/activity-store';
import { App } from '../../App';

// Stub window.crewdev for stores
const mockOnboarding = vi.hoisted(() => ({
  getProgress: vi.fn(),
  stepComplete: vi.fn(),
  skip: vi.fn(),
  detectFirstRun: vi.fn(),
}));

vi.stubGlobal('window', {
  ...globalThis.window,
  crewdev: {
    onboarding: mockOnboarding,
    feature: {
      loadTree: vi.fn().mockResolvedValue({ success: true, data: [] }),
      read: vi.fn().mockResolvedValue({ success: true, data: null }),
      create: vi.fn().mockResolvedValue({ success: true, data: {} }),
      update: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
    },
    crew: {
      spawn: vi.fn().mockResolvedValue({ success: true, data: { id: '', pid: 0, status: 'idle' } }),
      kill: vi.fn().mockResolvedValue({ success: true }),
      killAll: vi.fn().mockResolvedValue({ success: true }),
      sendInput: vi.fn().mockResolvedValue({ success: true }),
    },
  },
});

describe('App layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.setState({
      currentStep: 'welcome',
      completedSteps: [],
      completed: true,
      isFirstRun: false,
      loading: false,
    });
    useFeatureStore.setState({
      tree: [],
      selectedId: null,
      selectedFeature: null,
      loading: false,
    });
    useCrewStore.setState({
      members: [],
      activeIds: [],
    });
    useActivityStore.setState({
      entries: [],
    });
  });

  it('should render without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('should render workspace layout with four panels when onboarding is complete', () => {
    render(<App />);

    expect(screen.getByTestId('feature-tree')).toBeTruthy();
    expect(screen.getByTestId('feature-editor')).toBeTruthy();
    expect(screen.getByTestId('crew-panel')).toBeTruthy();
    expect(screen.getByTestId('chat-input')).toBeTruthy();
    expect(screen.getByTestId('activity-feed')).toBeTruthy();
    expect(screen.queryByTestId('onboarding')).toBeNull();
  });

  it('should render onboarding instead of workspace on first run', () => {
    useOnboardingStore.setState({
      completed: false,
      isFirstRun: true,
    });

    render(<App />);

    expect(screen.getByTestId('onboarding')).toBeTruthy();
    expect(screen.queryByTestId('feature-tree')).toBeNull();
    expect(screen.queryByTestId('crew-panel')).toBeNull();
  });

  it('should have a grid/flex layout structure', () => {
    const { container } = render(<App />);
    const root = container.firstElementChild;
    expect(root).toBeTruthy();
    expect(root?.children.length).toBeGreaterThanOrEqual(2);
  });
});
