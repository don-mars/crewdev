// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRegisterCrewHandlers = vi.hoisted(() => vi.fn());
const mockRegisterProjectHandlers = vi.hoisted(() => vi.fn());
const mockRegisterMemoryHandlers = vi.hoisted(() => vi.fn());
const mockRegisterFeatureHandlers = vi.hoisted(() => vi.fn());
const mockRegisterPlanningHandlers = vi.hoisted(() => vi.fn());
const mockRegisterGamificationHandlers = vi.hoisted(() => vi.fn());
const mockRegisterOnboardingHandlers = vi.hoisted(() => vi.fn());
const mockRegisterNerveMapHandlers = vi.hoisted(() => vi.fn());
const mockRegisterKnowledgeHandlers = vi.hoisted(() => vi.fn());
const mockRegisterLinearHandlers = vi.hoisted(() => vi.fn());
const mockRegisterCrewOutputHandler = vi.hoisted(() => vi.fn().mockReturnValue(vi.fn()));

vi.mock('../../../main/ipc/crew-handlers', () => ({
  registerCrewHandlers: mockRegisterCrewHandlers,
}));
vi.mock('../../../main/ipc/project-handlers', () => ({
  registerProjectHandlers: mockRegisterProjectHandlers,
}));
vi.mock('../../../main/ipc/memory-handlers', () => ({
  registerMemoryHandlers: mockRegisterMemoryHandlers,
}));
vi.mock('../../../main/ipc/feature-handlers', () => ({
  registerFeatureHandlers: mockRegisterFeatureHandlers,
}));
vi.mock('../../../main/ipc/planning-handlers', () => ({
  registerPlanningHandlers: mockRegisterPlanningHandlers,
}));
vi.mock('../../../main/ipc/gamification-handlers', () => ({
  registerGamificationHandlers: mockRegisterGamificationHandlers,
}));
vi.mock('../../../main/ipc/onboarding-handlers', () => ({
  registerOnboardingHandlers: mockRegisterOnboardingHandlers,
}));
vi.mock('../../../main/ipc/nerve-map-handlers', () => ({
  registerNerveMapHandlers: mockRegisterNerveMapHandlers,
}));
vi.mock('../../../main/ipc/knowledge-handlers', () => ({
  registerKnowledgeHandlers: mockRegisterKnowledgeHandlers,
}));
vi.mock('../../../main/ipc/linear-handlers', () => ({
  registerLinearHandlers: mockRegisterLinearHandlers,
}));

const mockRegisterCrewStatusHandler = vi.hoisted(() => vi.fn().mockReturnValue(vi.fn()));

vi.mock('../../../main/processes/crew-output', () => ({
  registerCrewOutputHandler: mockRegisterCrewOutputHandler,
  registerCrewStatusHandler: mockRegisterCrewStatusHandler,
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(true),
    encryptString: vi.fn(),
    decryptString: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

vi.mock('../../../main/security/safe-token-store', () => ({
  SafeTokenStore: vi.fn(),
}));

vi.mock('../../../main/processes/crew-manager', () => ({
  CrewManager: vi.fn(),
}));

vi.mock('../../../main/integrations/linear', () => ({
  LinearClient: vi.fn(),
}));

vi.mock('../../../main/project/project-context', () => {
  return {
    ProjectContext: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.setProject = vi.fn();
      this.getProject = vi.fn();
    }),
  };
});

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerAllHandlers } from '../../../main/ipc/register-all';

describe('registerAllHandlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIpcMain = { handle: vi.fn() };
  });

  it('should call all domain handler registrations', () => {
    registerAllHandlers(mockIpcMain as never);

    expect(mockRegisterCrewHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterProjectHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterMemoryHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterFeatureHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterPlanningHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterGamificationHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterOnboardingHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterNerveMapHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterKnowledgeHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterLinearHandlers).toHaveBeenCalledTimes(1);
  });

  it('should pass ipcMain and ProjectContext to domain registrations', () => {
    registerAllHandlers(mockIpcMain as never);

    expect(mockRegisterCrewHandlers).toHaveBeenCalledWith(
      mockIpcMain, expect.anything(), expect.anything(), undefined, undefined,
    );
    expect(mockRegisterProjectHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
    expect(mockRegisterMemoryHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
    expect(mockRegisterFeatureHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
    expect(mockRegisterPlanningHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
    expect(mockRegisterGamificationHandlers).toHaveBeenCalledWith(mockIpcMain, expect.any(String));
    expect(mockRegisterOnboardingHandlers).toHaveBeenCalledWith(mockIpcMain, expect.any(String), expect.any(String));
    expect(mockRegisterNerveMapHandlers).toHaveBeenCalledWith(mockIpcMain);
    expect(mockRegisterKnowledgeHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
    expect(mockRegisterLinearHandlers).toHaveBeenCalledWith(mockIpcMain, expect.anything());
  });

  it('should pass outputHandler when mainWindow is provided', () => {
    const mockMainWindow = {
      webContents: { send: vi.fn() },
    };
    registerAllHandlers(mockIpcMain as never, mockMainWindow as never);

    expect(mockRegisterCrewOutputHandler).toHaveBeenCalledWith(mockMainWindow.webContents);
    expect(mockRegisterCrewHandlers).toHaveBeenCalledWith(
      mockIpcMain, expect.anything(), expect.anything(), expect.any(Function), expect.any(Function),
    );
  });
});
