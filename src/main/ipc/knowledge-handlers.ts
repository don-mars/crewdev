import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { KnowledgeProfile, ConceptLevel } from '../../shared/types/knowledge';
import type { ProjectContext } from '../project/project-context';
import {
  KNOWLEDGE_GET_PROFILE,
  KNOWLEDGE_UPDATE_LEVEL,
  KNOWLEDGE_ADAPT_TEXT,
} from '../../shared/constants/ipc';
import { adaptText } from '../language/language-adapter';
import { loadKnowledgeProfile, saveKnowledgeProfile } from '../language/knowledge-persistence';
import { logger } from '../../shared/utils/logger';

function noProjectError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'NO_ACTIVE_PROJECT', message: 'No active project selected' },
  };
}

export function registerKnowledgeHandlers(
  ipcMain: IpcMain,
  projectContext: ProjectContext,
): void {
  ipcMain.handle(
    KNOWLEDGE_GET_PROFILE,
    async (_event: unknown): Promise<IpcResponse<KnowledgeProfile>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        const profile = await loadKnowledgeProfile(projectContext.knowledgePath);
        return { success: true, data: profile };
      } catch (err: unknown) {
        logger.error('Unexpected error in knowledge:get-profile handler', { error: err });
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
        };
      }
    },
  );

  ipcMain.handle(
    KNOWLEDGE_UPDATE_LEVEL,
    async (_event: unknown, concept: string, level: ConceptLevel): Promise<IpcResponse<KnowledgeProfile>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        const knowledgePath = projectContext.knowledgePath;
        const currentProfile = await loadKnowledgeProfile(knowledgePath);
        const existing = currentProfile[concept] ?? { level: 0, exposures: 0 };
        const updated: KnowledgeProfile = {
          ...currentProfile,
          [concept]: { ...existing, level },
        };
        await saveKnowledgeProfile(knowledgePath, updated);
        return { success: true, data: updated };
      } catch (err: unknown) {
        logger.error('Unexpected error in knowledge:update-level handler', { error: err });
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
        };
      }
    },
  );

  ipcMain.handle(
    KNOWLEDGE_ADAPT_TEXT,
    async (_event: unknown, text: string): Promise<IpcResponse<string>> => {
      try {
        if (!projectContext.getProject()) return noProjectError();
        const profile = await loadKnowledgeProfile(projectContext.knowledgePath);
        const adapted = adaptText(text, profile);
        return { success: true, data: adapted };
      } catch (err: unknown) {
        logger.error('Unexpected error in knowledge:adapt-text handler', { error: err });
        return {
          success: false,
          error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
        };
      }
    },
  );
}
