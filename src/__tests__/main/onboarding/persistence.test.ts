// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => ({
  default: {},
  readFile: mockFs.readFile,
  writeFile: mockFs.writeFile,
  mkdir: mockFs.mkdir,
}));

import { saveProgress, loadProgress } from '../../../main/onboarding/persistence';
import type { OnboardingProgress } from '../../../shared/types/onboarding';

describe('Onboarding persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save progress after each completed step', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);

    const progress: OnboardingProgress = {
      currentStep: 'linear',
      completedSteps: ['welcome', 'github'],
      completed: false,
    };

    await saveProgress('/app/onboarding.json', progress);

    expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    const [, content] = mockFs.writeFile.mock.calls[0];
    const parsed = JSON.parse(content);
    expect(parsed.currentStep).toBe('linear');
    expect(parsed.completedSteps).toEqual(['welcome', 'github']);
  });

  it('should resume at correct step on relaunch', async () => {
    const saved: OnboardingProgress = {
      currentStep: 'knowledge',
      completedSteps: ['welcome', 'github', 'linear'],
      completed: false,
    };
    mockFs.readFile.mockResolvedValue(JSON.stringify(saved));

    const result = await loadProgress('/app/onboarding.json');

    expect(result.currentStep).toBe('knowledge');
    expect(result.completedSteps).toEqual(['welcome', 'github', 'linear']);
  });

  it('should not show onboarding after completion', async () => {
    const saved: OnboardingProgress = {
      currentStep: 'project-setup',
      completedSteps: ['welcome', 'github', 'linear', 'knowledge', 'meet-crew', 'project-setup'],
      completed: true,
    };
    mockFs.readFile.mockResolvedValue(JSON.stringify(saved));

    const result = await loadProgress('/app/onboarding.json');

    expect(result.completed).toBe(true);
  });

  it('should handle corrupted progress file gracefully', async () => {
    mockFs.readFile.mockResolvedValue('not json!!!');

    const result = await loadProgress('/app/onboarding.json');

    expect(result.currentStep).toBe('welcome');
    expect(result.completed).toBe(false);
  });

  it('should handle missing progress file with defaults', async () => {
    mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

    const result = await loadProgress('/app/onboarding.json');

    expect(result.currentStep).toBe('welcome');
    expect(result.completed).toBe(false);
  });
});
