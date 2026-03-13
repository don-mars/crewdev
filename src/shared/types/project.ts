export interface ProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly dirPath: string;
  readonly createdAt: string;
}

export interface SharedMemory {
  readonly projectId: string;
  readonly decisionLog: DecisionEntry[];
  readonly knowledgeProfile: Record<string, number>;
}

export interface DecisionEntry {
  readonly timestamp: string;
  readonly decision: string;
  readonly reason: string;
}

export function createDefaultMemory(projectId: string): SharedMemory {
  return {
    projectId,
    decisionLog: [],
    knowledgeProfile: {},
  };
}
