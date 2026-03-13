// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinearClient, type TokenStore } from '../../../main/integrations/linear';
import type { CreateTicketInput } from '../../../shared/types/linear';

vi.mock('../../../shared/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Linear Integration', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTokenStore: any;
  let client: LinearClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    mockTokenStore = {
      get: vi.fn().mockReturnValue('valid-token'),
      set: vi.fn(),
    };
    client = new LinearClient(mockFetch as unknown as typeof globalThis.fetch, mockTokenStore);
  });

  describe('OAuth', () => {
    it('should store token via tokenStore, never plaintext', () => {
      client.setToken('new-token');
      expect(mockTokenStore.set).toHaveBeenCalledWith('new-token');
    });

    it('should refresh expired token automatically', async () => {
      // First call returns 401, second returns success after refresh
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ data: { issueCreate: { issue: { id: 't-1', title: 'Test', identifier: 'T-1' } } } }),
        });
      mockTokenStore.get
        .mockReturnValueOnce('expired-token')
        .mockReturnValueOnce('refreshed-token');

      const input: CreateTicketInput = { title: 'Test', teamId: 'team-1' };
      const result = await client.createTicket(input);

      // Should have called fetch twice (retry after 401)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return AUTH_FAILED for invalid credentials', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
      mockTokenStore.get.mockReturnValue(null);

      const result = await client.createTicket({ title: 'Test', teamId: 'team-1' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_FAILED');
      }
    });
  });

  describe('createTicket()', () => {
    it('should return ticket with ID on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: { issueCreate: { issue: { id: 'issue-1', title: 'New Ticket', identifier: 'T-1' } } },
        }),
      });

      const result = await client.createTicket({ title: 'New Ticket', teamId: 'team-1' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('issue-1');
        expect(result.data.title).toBe('New Ticket');
      }
    });

    it('should return CrewDevError on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ errors: [{ message: 'Internal error' }] }),
      });

      const result = await client.createTicket({ title: 'Test', teamId: 'team-1' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('LINEAR_API_ERROR');
      }
    });
  });

  describe('updateTicketStatus()', () => {
    it('should send correct status value', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { issueUpdate: { issue: { id: 't-1' } } } }),
      });

      const result = await client.updateTicketStatus('t-1', 'done-state-id');

      expect(result.success).toBe(true);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.stateId).toBe('done-state-id');
    });

    it('should return TICKET_NOT_FOUND for invalid ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ errors: [{ message: 'Entity not found' }] }),
      });

      const result = await client.updateTicketStatus('bad-id', 'state-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TICKET_NOT_FOUND');
      }
    });
  });

  describe('postComment()', () => {
    it('should post comment text to correct ticket', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { commentCreate: { comment: { id: 'c-1' } } } }),
      });

      const result = await client.postComment('t-1', 'Build complete');

      expect(result.success).toBe(true);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.issueId).toBe('t-1');
      expect(body.variables.body).toBe('Build complete');
    });
  });

  describe('listTickets()', () => {
    it('should return filtered ticket list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            issues: {
              nodes: [
                { id: 't-1', title: 'Ticket 1', identifier: 'T-1', state: { name: 'Todo' } },
                { id: 't-2', title: 'Ticket 2', identifier: 'T-2', state: { name: 'In Progress' } },
              ],
            },
          },
        }),
      });

      const result = await client.listTickets('team-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { issues: { nodes: [] } } }),
      });

      const result = await client.listTickets('team-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('Rate limiting', () => {
    it('should retry with exponential backoff on rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: { issueCreate: { issue: { id: 't-1', title: 'Test', identifier: 'T-1' } } },
          }),
        });

      const result = await client.createTicket({ title: 'Test', teamId: 'team-1' });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });

      const result = await client.createTicket({ title: 'Test', teamId: 'team-1' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RATE_LIMITED');
      }
    });
  });
});
