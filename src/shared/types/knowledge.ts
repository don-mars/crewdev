export type ConceptLevel = 0 | 1 | 2 | 3;

export interface ConceptEntry {
  level: ConceptLevel;
  exposures: number;
}

export type KnowledgeProfile = Record<string, ConceptEntry>;

export const LEVEL_NAMES: Record<ConceptLevel, string> = {
  0: 'Unknown',
  1: 'Introduced',
  2: 'Familiar',
  3: 'Understood',
};

export const DEFAULT_CONCEPTS = [
  'component',
  'state',
  'props',
  'hook',
  'API',
  'endpoint',
  'middleware',
  'schema',
  'migration',
  'OAuth',
  'token',
  'CI/CD',
  'pipeline',
  'linting',
  'type-safety',
] as const;

export function createDefaultProfile(): KnowledgeProfile {
  const profile: KnowledgeProfile = {};
  for (const concept of DEFAULT_CONCEPTS) {
    profile[concept] = { level: 0, exposures: 0 };
  }
  return profile;
}
