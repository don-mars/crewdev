// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LINEAR_SYNC,
  LINEAR_CREATE_ISSUE,
  LINEAR_LIST_ISSUES,
  LINEAR_UPDATE_STATUS,
  LINEAR_POST_COMMENT,
} from '../../../shared/constants/ipc';

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { registerLinearHandlers } from '../../../main/ipc/linear-handlers';

describe('Linear IPC handlers', () => {
  let mockIpcMain: { handle: ReturnType<typeof vi.fn> };
  let handlers: Map<string, (...args: unknown[]) => unknown>;
  let mockLinearClient: {
    createTicket: ReturnType<typeof vi.fn>;
    listTickets: ReturnType<typeof vi.fn>;
    updateTicketStatus: ReturnType<typeof vi.fn>;
    postComment: ReturnType<typeof vi.fn>;
    setToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = new Map();
    mockIpcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
    };

    mockLinearClient = {
      createTicket: vi.fn(),
      listTickets: vi.fn(),
      updateTicketStatus: vi.fn(),
      postComment: vi.fn(),
      setToken: vi.fn(),
    };

    registerLinearHandlers(mockIpcMain as never, mockLinearClient as never);
  });

  it('should register handlers for all linear channels', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith(LINEAR_SYNC, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(LINEAR_CREATE_ISSUE, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(LINEAR_LIST_ISSUES, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(LINEAR_UPDATE_STATUS, expect.any(Function));
    expect(mockIpcMain.handle).toHaveBeenCalledWith(LINEAR_POST_COMMENT, expect.any(Function));
  });

  describe('linear:sync', () => {
    it('should set token and return success', async () => {
      const handler = handlers.get(LINEAR_SYNC)!;
      const result = await handler({}, 'lin_api_token_abc');

      expect(mockLinearClient.setToken).toHaveBeenCalledWith('lin_api_token_abc');
      expect(result).toEqual({ success: true, data: null });
    });
  });

  describe('linear:create-issue', () => {
    it('should delegate to LinearClient.createTicket and return its response', async () => {
      const response = {
        success: true as const,
        data: { id: 'issue-1', title: 'Bug fix', status: 'Backlog' },
      };
      mockLinearClient.createTicket.mockResolvedValue(response);

      const input = { title: 'Bug fix', teamId: 'team-1', description: 'Fix the thing' };
      const handler = handlers.get(LINEAR_CREATE_ISSUE)!;
      const result = await handler({}, input);

      expect(mockLinearClient.createTicket).toHaveBeenCalledWith(input);
      expect(result).toEqual(response);
    });

    it('should return error response on unexpected failure', async () => {
      mockLinearClient.createTicket.mockRejectedValue(new Error('network error'));

      const handler = handlers.get(LINEAR_CREATE_ISSUE)!;
      const result = await handler({}, { title: 'X', teamId: 't' });

      expect(result).toEqual({
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('linear:list-issues', () => {
    it('should delegate to LinearClient.listTickets and return its response', async () => {
      const response = {
        success: true as const,
        data: [{ id: 'issue-1', title: 'Test', status: 'Todo' }],
      };
      mockLinearClient.listTickets.mockResolvedValue(response);

      const handler = handlers.get(LINEAR_LIST_ISSUES)!;
      const result = await handler({}, 'team-1');

      expect(mockLinearClient.listTickets).toHaveBeenCalledWith('team-1');
      expect(result).toEqual(response);
    });
  });

  describe('linear:update-status', () => {
    it('should delegate to LinearClient.updateTicketStatus', async () => {
      const response = { success: true as const, data: undefined };
      mockLinearClient.updateTicketStatus.mockResolvedValue(response);

      const handler = handlers.get(LINEAR_UPDATE_STATUS)!;
      const result = await handler({}, 'issue-1', 'state-done');

      expect(mockLinearClient.updateTicketStatus).toHaveBeenCalledWith('issue-1', 'state-done');
      expect(result).toEqual(response);
    });
  });

  describe('linear:post-comment', () => {
    it('should delegate to LinearClient.postComment', async () => {
      const response = { success: true as const, data: undefined };
      mockLinearClient.postComment.mockResolvedValue(response);

      const handler = handlers.get(LINEAR_POST_COMMENT)!;
      const result = await handler({}, 'issue-1', 'Work completed');

      expect(mockLinearClient.postComment).toHaveBeenCalledWith('issue-1', 'Work completed');
      expect(result).toEqual(response);
    });
  });
});
