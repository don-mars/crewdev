export type TaskGroupStatus = 'queued' | 'in-progress' | 'complete' | 'approved' | 'blocked';

export interface TaskGroup {
  readonly id: string;
  readonly description: string;
  readonly acceptanceCriteria: string[];
  readonly assignedTo: string;
  readonly dependencies: string[];
  status: TaskGroupStatus;
}

export interface Plan {
  readonly taskGroups: TaskGroup[];
  readonly summary: string;
}
