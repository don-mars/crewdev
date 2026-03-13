import type { IpcResponse } from '../../shared/types/ipc-response';
import type { LinearTicket, CreateTicketInput } from '../../shared/types/linear';
import { logger } from '../../shared/utils/logger';

const LINEAR_API = 'https://api.linear.app/graphql';
const MAX_RETRIES = 3;

type FetchFn = typeof globalThis.fetch;

export interface TokenStore {
  get(): string | null;
  set(token: string): void;
}

export class LinearClient {
  private fetchFn: FetchFn;
  private tokenStore: TokenStore;

  constructor(fetchFn: FetchFn, tokenStore: TokenStore) {
    this.fetchFn = fetchFn;
    this.tokenStore = tokenStore;
  }

  setToken(token: string): void {
    this.tokenStore.set(token);
  }

  private async graphql(
    query: string,
    variables: Record<string, unknown>,
    retries = 0,
  ): Promise<IpcResponse<Record<string, unknown>>> {
    const token = this.tokenStore.get();
    if (!token) {
      return {
        success: false,
        error: { code: 'AUTH_FAILED', message: 'No authentication token available' },
      };
    }

    const response = await this.fetchFn(LINEAR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 429) {
      if (retries >= MAX_RETRIES) {
        return {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Rate limited after maximum retries' },
        };
      }
      const delay = Math.pow(2, retries) * 100;
      await new Promise((r) => setTimeout(r, delay));
      return this.graphql(query, variables, retries + 1);
    }

    if (response.status === 401) {
      // Try once more with potentially refreshed token
      if (retries === 0) {
        return this.graphql(query, variables, retries + 1);
      }
      return {
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Authentication failed' },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: { code: 'LINEAR_API_ERROR', message: `Linear API error: ${response.status}` },
      };
    }

    const json = (await response.json()) as Record<string, unknown>;

    if (json.errors) {
      const errors = json.errors as Array<{ message: string }>;
      const msg = errors[0]?.message ?? 'Unknown error';
      if (msg.includes('not found') || msg.includes('Entity not found')) {
        return {
          success: false,
          error: { code: 'TICKET_NOT_FOUND', message: msg },
        };
      }
      return {
        success: false,
        error: { code: 'LINEAR_API_ERROR', message: msg },
      };
    }

    return { success: true, data: json.data as Record<string, unknown> };
  }

  async createTicket(input: CreateTicketInput): Promise<IpcResponse<LinearTicket>> {
    const query = `
      mutation CreateIssue($title: String!, $teamId: String!, $description: String) {
        issueCreate(input: { title: $title, teamId: $teamId, description: $description }) {
          issue { id title identifier }
        }
      }
    `;

    const result = await this.graphql(query, {
      title: input.title,
      teamId: input.teamId,
      description: input.description,
    });

    if (!result.success) return result as IpcResponse<LinearTicket>;

    const issue = (result.data as any).issueCreate.issue;
    logger.info('Linear ticket created', { id: issue.id });
    return {
      success: true,
      data: { id: issue.id, title: issue.title, status: 'Backlog' },
    };
  }

  async updateTicketStatus(ticketId: string, stateId: string): Promise<IpcResponse<void>> {
    const query = `
      mutation UpdateIssue($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          issue { id }
        }
      }
    `;

    const result = await this.graphql(query, { id: ticketId, stateId });
    if (!result.success) return result as IpcResponse<void>;

    logger.info('Linear ticket status updated', { ticketId, stateId });
    return { success: true, data: undefined };
  }

  async postComment(ticketId: string, text: string): Promise<IpcResponse<void>> {
    const query = `
      mutation PostComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          comment { id }
        }
      }
    `;

    const result = await this.graphql(query, { issueId: ticketId, body: text });
    if (!result.success) return result as IpcResponse<void>;

    logger.info('Linear comment posted', { ticketId });
    return { success: true, data: undefined };
  }

  async listTickets(teamId: string): Promise<IpcResponse<LinearTicket[]>> {
    const query = `
      query ListIssues($teamId: String!) {
        issues(filter: { team: { id: { eq: $teamId } } }) {
          nodes { id title identifier state { name } }
        }
      }
    `;

    const result = await this.graphql(query, { teamId });
    if (!result.success) return result as IpcResponse<LinearTicket[]>;

    const nodes = (result.data as any).issues.nodes as Array<{
      id: string;
      title: string;
      identifier: string;
      state: { name: string };
    }>;

    const tickets: LinearTicket[] = nodes.map((n) => ({
      id: n.id,
      title: n.title,
      status: n.state.name,
    }));

    return { success: true, data: tickets };
  }
}
