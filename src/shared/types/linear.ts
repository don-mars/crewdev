export interface LinearTicket {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly description?: string;
}

export interface CreateTicketInput {
  readonly title: string;
  readonly description?: string;
  readonly teamId: string;
}
