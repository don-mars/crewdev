// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ONBOARDING_GET_PROGRESS,
  ONBOARDING_STEP_COMPLETE,
  ONBOARDING_SKIP,
  ONBOARDING_DETECT_FIRST_RUN,
} from '../../../shared/constants/ipc';

const mockLoadProgress = vi.hoisted(() => vi.fn());
const mockSaveProgress = vi.hoisted(() => vi.fn());
const mockDetectFirstRun = vi.hoisted(() => vi.fn());

vi.mock('../../../main/onboarding/persistence', () => ({
  loadProgress: mockLoadProgress,
  saveProgress: mockSaveProgress,
}));

vi.mock('../../../main/onboarding/detect-first-run', () => ({
  detectFirstRun: mockDetectFirstRun,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerOnboardingHandlers } from '../../../main/ipc/onboarding-handlers';
import type { OnboardingProgress } from '../../../shared/types/onboarding';

describe('Onboarding IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  const onboardingPath = '/data/onboarding.json';
  const dataDir = '/data';

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    registerOnboardingHandlers(mockIpcMain as never, onboardingPath, dataDir);
  });

  it('should register handlers for all onboarding channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(ONBOARDING_GET_PROGRESS, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(ONBOARDING_STEP_COMPLETE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(ONBOARDING_SKIP, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(ONBOARDING_DETECT_FIRST_RUN, expect.any(Function));
  });

  describe('onboarding:get-progress', () => {
    it('should return current onboarding progress', async () => {
      const progress: OnboardingProgress = {
        currentStep: 'github',
        completedSteps: ['welcome'],
        completed: false,
      };
      mockLoadProgress.mockResolvedValue(progress);

      const handler = handlers.get(ONBOARDING_GET_PROGRESS)!;
      const result = await handler({});

      expect(mockLoadProgress).toHaveBeenCalledWith(onboardingPath);
      expect(result).toEqual({ success: true, data: progress });
    });
  });

  describe('onboarding:step-complete', () => {
    it('should advance to next step and save progress', async () => {
      const progress: OnboardingProgress = {
        currentStep: 'welcome',
        completedSteps: [],
        completed: false,
      };
      mockLoadProgress.mockResolvedValue(progress);
      mockSaveProgress.mockResolvedValue(undefined);

      const handler = handlers.get(ONBOARDING_STEP_COMPLETE)!;
      const result = await handler({}, 'welcome') as { success: boolean; data: OnboardingProgress };

      expect(mockSaveProgress).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data.completedSteps).toContain('welcome');
      expect(result.data.currentStep).toBe('github');
    });

    it('should mark completed when last step is done', async () => {
      const progress: OnboardingProgress = {
        currentStep: 'project-setup',
        completedSteps: ['welcome', 'github', 'linear', 'knowledge', 'meet-crew'],
        completed: false,
      };
      mockLoadProgress.mockResolvedValue(progress);
      mockSaveProgress.mockResolvedValue(undefined);

      const handler = handlers.get(ONBOARDING_STEP_COMPLETE)!;
      const result = await handler({}, 'project-setup') as { success: boolean; data: OnboardingProgress };

      expect(result.success).toBe(true);
      expect(result.data.completed).toBe(true);
    });
  });

  describe('onboarding:skip', () => {
    it('should skip a step and advance to next', async () => {
      const progress: OnboardingProgress = {
        currentStep: 'github',
        completedSteps: ['welcome'],
        completed: false,
      };
      mockLoadProgress.mockResolvedValue(progress);
      mockSaveProgress.mockResolvedValue(undefined);

      const handler = handlers.get(ONBOARDING_SKIP)!;
      const result = await handler({}, 'github') as { success: boolean; data: OnboardingProgress };

      expect(result.success).toBe(true);
      expect(result.data.currentStep).toBe('linear');
    });
  });

  describe('onboarding:detect-first-run', () => {
    it('should return true for first run', async () => {
      mockDetectFirstRun.mockResolvedValue(true);

      const handler = handlers.get(ONBOARDING_DETECT_FIRST_RUN)!;
      const result = await handler({});

      expect(mockDetectFirstRun).toHaveBeenCalledWith(dataDir);
      expect(result).toEqual({ success: true, data: true });
    });

    it('should return false for returning user', async () => {
      mockDetectFirstRun.mockResolvedValue(false);

      const handler = handlers.get(ONBOARDING_DETECT_FIRST_RUN)!;
      const result = await handler({});

      expect(result).toEqual({ success: true, data: false });
    });
  });
});
