import type { IpcMain } from 'electron';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { LinearTicket, CreateTicketInput } from '../../shared/types/linear';
import type { LinearClient } from '../integrations/linear';
import {
  LINEAR_SYNC,
  LINEAR_CREATE_ISSUE,
  LINEAR_LIST_ISSUES,
  LINEAR_UPDATE_STATUS,
  LINEAR_POST_COMMENT,
} from '../../shared/constants/ipc';
import { logger } from '../../shared/utils/logger';

function unknownError<T>(): IpcResponse<T> {
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
  };
}

export function registerLinearHandlers(
  ipcMain: IpcMain,
  linearClient: LinearClient,
): void {
  ipcMain.handle(
    LINEAR_SYNC,
    async (_event: unknown, token: string): Promise<IpcResponse<null>> => {
      try {
        linearClient.setToken(token);
        return { success: true, data: null };
      } catch (err: unknown) {
        logger.error('Unexpected error in linear:sync handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    LINEAR_CREATE_ISSUE,
    async (_event: unknown, input: CreateTicketInput): Promise<IpcResponse<LinearTicket>> => {
      try {
        return await linearClient.createTicket(input);
      } catch (err: unknown) {
        logger.error('Unexpected error in linear:create-issue handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    LINEAR_LIST_ISSUES,
    async (_event: unknown, teamId: string): Promise<IpcResponse<LinearTicket[]>> => {
      try {
        return await linearClient.listTickets(teamId);
      } catch (err: unknown) {
        logger.error('Unexpected error in linear:list-issues handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    LINEAR_UPDATE_STATUS,
    async (_event: unknown, ticketId: string, stateId: string): Promise<IpcResponse<void>> => {
      try {
        return await linearClient.updateTicketStatus(ticketId, stateId);
      } catch (err: unknown) {
        logger.error('Unexpected error in linear:update-status handler', { error: err });
        return unknownError();
      }
    },
  );

  ipcMain.handle(
    LINEAR_POST_COMMENT,
    async (_event: unknown, ticketId: string, text: string): Promise<IpcResponse<void>> => {
      try {
        return await linearClient.postComment(ticketId, text);
      } catch (err: unknown) {
        logger.error('Unexpected error in linear:post-comment handler', { error: err });
        return unknownError();
      }
    },
  );
}
