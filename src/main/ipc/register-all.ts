import type { IpcMain, BrowserWindow } from 'electron';
import { app, safeStorage } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { CrewManager } from '../processes/crew-manager';
import { LinearClient } from '../integrations/linear';
import { SafeTokenStore } from '../security/safe-token-store';
import { ProjectContext } from '../project/project-context';
import { registerCrewOutputHandler, registerCrewStatusHandler } from '../processes/crew-output';
import { registerCrewHandlers } from './crew-handlers';
import { registerProjectHandlers } from './project-handlers';
import { registerMemoryHandlers } from './memory-handlers';
import { registerFeatureHandlers } from './feature-handlers';
import { registerPlanningHandlers } from './planning-handlers';
import { registerGamificationHandlers } from './gamification-handlers';
import { registerOnboardingHandlers } from './onboarding-handlers';
import { registerNerveMapHandlers } from './nerve-map-handlers';
import { registerKnowledgeHandlers } from './knowledge-handlers';
import { registerLinearHandlers } from './linear-handlers';
import { logger } from '../../shared/utils/logger';

export function registerAllHandlers(ipcMain: IpcMain, mainWindow?: BrowserWindow): void {
  const dataDir = app.getPath('userData');
  const gamificationPath = path.join(dataDir, 'gamification.json');
  const onboardingPath = path.join(dataDir, 'onboarding.json');

  const projectContext = new ProjectContext(dataDir);
  const crewManager = new CrewManager();

  const tokenPath = path.join(dataDir, 'linear-token.enc');
  const tokenStore = new SafeTokenStore(tokenPath, safeStorage, fs);

  const linearClient = new LinearClient(fetch, tokenStore);

  const outputHandler = mainWindow
    ? registerCrewOutputHandler(mainWindow.webContents)
    : undefined;
  const statusHandler = mainWindow
    ? registerCrewStatusHandler(mainWindow.webContents)
    : undefined;

  registerCrewHandlers(ipcMain, crewManager, projectContext, outputHandler, statusHandler);
  registerProjectHandlers(ipcMain, projectContext);
  registerMemoryHandlers(ipcMain, projectContext);
  registerFeatureHandlers(ipcMain, projectContext);
  registerPlanningHandlers(ipcMain, projectContext);
  registerGamificationHandlers(ipcMain, gamificationPath);
  registerOnboardingHandlers(ipcMain, onboardingPath, dataDir);
  registerNerveMapHandlers(ipcMain);
  registerKnowledgeHandlers(ipcMain, projectContext);
  registerLinearHandlers(ipcMain, linearClient);

  logger.info('All IPC handlers registered');
}
