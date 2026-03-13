export type CrewStatus = 'idle' | 'running' | 'thinking' | 'working' | 'waiting' | 'error' | 'finished';

export interface CrewMemberConfig {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly configContent: string;
}

export interface CrewProcess {
  readonly id: string;
  readonly pid: number;
  status: CrewStatus;
}
