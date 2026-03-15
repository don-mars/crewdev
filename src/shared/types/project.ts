export interface ProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly dirPath: string;
  readonly createdAt: string;
}

export interface ProjectState {
  readonly phase: string;
  readonly techStack: string[];
  readonly completedFeatures: string[];
  readonly activeConventions: string[];
}

export interface DecisionEntry {
  readonly date: string;
  readonly decision: string;
  readonly rationale: string;
}

export interface ErrorHistoryEntry {
  readonly date: string;
  readonly error: string;
  readonly resolution: string;
}

export interface UserPreferences {
  readonly communicationStyle: string;
  readonly knowledgeLevel: string;
}

export interface SharedMemory {
  readonly projectId: string;
  readonly projectState: ProjectState;
  readonly decisionLog: DecisionEntry[];
  readonly errorHistory: ErrorHistoryEntry[];
  readonly userPreferences: UserPreferences;
}

export function createDefaultMemory(projectId: string): SharedMemory {
  return {
    projectId,
    projectState: {
      phase: 'foundation',
      techStack: [],
      completedFeatures: [],
      activeConventions: [],
    },
    decisionLog: [],
    errorHistory: [],
    userPreferences: {
      communicationStyle: 'concise',
      knowledgeLevel: 'intermediate',
    },
  };
}
