// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GAMIFICATION_GET_STATE,
  GAMIFICATION_RECORD_COMPLETION,
  GAMIFICATION_ROLL_BUILD_QUALITY,
} from '../../../shared/constants/ipc';

const mockLoadGamificationState = vi.hoisted(() => vi.fn());
const mockSaveGamificationState = vi.hoisted(() => vi.fn());
const mockRecordCompletion = vi.hoisted(() => vi.fn());
const mockAddXp = vi.hoisted(() => vi.fn());
const mockRollBuildQuality = vi.hoisted(() => vi.fn());

vi.mock('../../../main/gamification/persistence', () => ({
  loadGamificationState: mockLoadGamificationState,
  saveGamificationState: mockSaveGamificationState,
}));

vi.mock('../../../main/gamification/streak', () => ({
  recordCompletion: mockRecordCompletion,
}));

vi.mock('../../../main/gamification/xp', () => ({
  addXp: mockAddXp,
}));

vi.mock('../../../main/gamification/build-quality', () => ({
  rollBuildQuality: mockRollBuildQuality,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerGamificationHandlers } from '../../../main/ipc/gamification-handlers';
import { createDefaultGamificationState } from '../../../shared/types/gamification';

describe('Gamification IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  const gamificationPath = '/data/gamification.json';

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    registerGamificationHandlers(mockIpcMain as never, gamificationPath);
  });

  it('should register handlers for all gamification channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(GAMIFICATION_GET_STATE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(GAMIFICATION_RECORD_COMPLETION, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(GAMIFICATION_ROLL_BUILD_QUALITY, expect.any(Function));
  });

  describe('gamification:get-state', () => {
    it('should return current gamification state', async () => {
      const state = createDefaultGamificationState();
      mockLoadGamificationState.mockResolvedValue({ success: true, data: state });

      const handler = handlers.get(GAMIFICATION_GET_STATE)!;
      const result = await handler({});

      expect(result).toEqual({ success: true, data: state });
    });

    it('should return error on unexpected failure', async () => {
      mockLoadGamificationState.mockRejectedValue(new Error('read failed'));

      const handler = handlers.get(GAMIFICATION_GET_STATE)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('gamification:record-completion', () => {
    it('should update streak and xp then save', async () => {
      const state = createDefaultGamificationState();
      mockLoadGamificationState.mockResolvedValue({ success: true, data: state });
      mockRecordCompletion.mockReturnValue({ ...state.streak, currentStreak: 1, lastCompletionDate: '2026-03-12' });
      mockAddXp.mockReturnValue({ totalXp: 25, level: 1, displayPercent: 84 });
      mockSaveGamificationState.mockResolvedValue(undefined);

      const handler = handlers.get(GAMIFICATION_RECORD_COMPLETION)!;
      const result = await handler({});

      expect(mockRecordCompletion).toHaveBeenCalled();
      expect(mockAddXp).toHaveBeenCalled();
      expect(mockSaveGamificationState).toHaveBeenCalled();
      expect((result as { success: boolean }).success).toBe(true);
    });
  });

  describe('gamification:roll-build-quality', () => {
    it('should return build quality roll result', async () => {
      const rollResult = { quality: 'good', animation: 'thumbs-up' };
      mockRollBuildQuality.mockReturnValue(rollResult);

      const handler = handlers.get(GAMIFICATION_ROLL_BUILD_QUALITY)!;
      const result = await handler({});

      expect(result).toEqual({ success: true, data: rollResult });
    });
  });
});
