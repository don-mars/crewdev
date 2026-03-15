// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  KNOWLEDGE_GET_PROFILE,
  KNOWLEDGE_UPDATE_LEVEL,
  KNOWLEDGE_ADAPT_TEXT,
} from '../../../shared/constants/ipc';

const mockAdaptText = vi.hoisted(() => vi.fn());
const mockLoadKnowledgeProfile = vi.hoisted(() => vi.fn());
const mockSaveKnowledgeProfile = vi.hoisted(() => vi.fn());

vi.mock('../../../main/language/language-adapter', () => ({
  adaptText: mockAdaptText,
}));

vi.mock('../../../main/language/knowledge-persistence', () => ({
  loadKnowledgeProfile: mockLoadKnowledgeProfile,
  saveKnowledgeProfile: mockSaveKnowledgeProfile,
}));

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerKnowledgeHandlers } from '../../../main/ipc/knowledge-handlers';
import type { KnowledgeProfile } from '../../../shared/types/knowledge';
import type { ProjectContext } from '../../../main/project/project-context';

function createMockProjectContext(dirPath: string | null): ProjectContext {
  const knowledgePath = dirPath ? `${dirPath}/.crewdev/knowledge.json` : '';
  return {
    getProject: vi.fn().mockReturnValue(dirPath ? { dirPath } : null),
    get knowledgePath() { return knowledgePath; },
  } as unknown as ProjectContext;
}

describe('Knowledge IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  let storedProfile: KnowledgeProfile;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    storedProfile = {
      component: { level: 2, exposures: 5 },
      state: { level: 1, exposures: 2 },
    };

    mockLoadKnowledgeProfile.mockResolvedValue(storedProfile);
    mockSaveKnowledgeProfile.mockResolvedValue(undefined);

    const ctx = createMockProjectContext('/project');
    registerKnowledgeHandlers(mockIpcMain as never, ctx);
  });

  it('should register handlers for all knowledge channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(KNOWLEDGE_GET_PROFILE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(KNOWLEDGE_UPDATE_LEVEL, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(KNOWLEDGE_ADAPT_TEXT, expect.any(Function));
  });

  describe('knowledge:get-profile', () => {
    it('should load and return the current knowledge profile from disk', async () => {
      const handler = handlers.get(KNOWLEDGE_GET_PROFILE)!;
      const result = await handler({});

      expect(mockLoadKnowledgeProfile).toHaveBeenCalledWith('/project/.crewdev/knowledge.json');
      expect(result).toEqual({ success: true, data: storedProfile });
    });

    it('should return NO_ACTIVE_PROJECT when no project set', async () => {
      const noProjectCtx = createMockProjectContext(null);
      const localHandlers = new Map<string, (...args: unknown[]) => unknown>();
      const localIpc = {
        handle: vi.fn((ch: string, h: (...args: unknown[]) => unknown) => {
          localHandlers.set(ch, h);
        }),
      };
      registerKnowledgeHandlers(localIpc as never, noProjectCtx);

      const handler = localHandlers.get(KNOWLEDGE_GET_PROFILE)!;
      const result = await handler({});

      expect(result).toEqual({
        success: false,
        error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
      });
    });
  });

  describe('knowledge:update-level', () => {
    it('should update a concept level, save to disk, and return updated profile', async () => {
      const handler = handlers.get(KNOWLEDGE_UPDATE_LEVEL)!;
      const result = await handler({}, 'component', 3) as { success: boolean; data: KnowledgeProfile };

      expect(result.success).toBe(true);
      expect(result.data.component.level).toBe(3);
      expect(mockSaveKnowledgeProfile).toHaveBeenCalledWith(
        '/project/.crewdev/knowledge.json',
        expect.objectContaining({ component: { level: 3, exposures: 5 } }),
      );
    });

    it('should add a new concept if not present', async () => {
      const handler = handlers.get(KNOWLEDGE_UPDATE_LEVEL)!;
      const result = await handler({}, 'middleware', 1) as { success: boolean; data: KnowledgeProfile };

      expect(result.success).toBe(true);
      expect(result.data.middleware.level).toBe(1);
    });
  });

  describe('knowledge:adapt-text', () => {
    it('should load profile from disk and return adapted text', async () => {
      mockAdaptText.mockReturnValue('simplified text');

      const handler = handlers.get(KNOWLEDGE_ADAPT_TEXT)!;
      const result = await handler({}, 'complex technical text');

      expect(mockLoadKnowledgeProfile).toHaveBeenCalledWith('/project/.crewdev/knowledge.json');
      expect(mockAdaptText).toHaveBeenCalledWith('complex technical text', storedProfile);
      expect(result).toEqual({ success: true, data: 'simplified text' });
    });
  });
});
