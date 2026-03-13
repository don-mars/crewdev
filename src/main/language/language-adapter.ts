import type { KnowledgeProfile } from '../../shared/types/knowledge';
import { LEVEL_NAMES } from '../../shared/types/knowledge';

const JARGON_REPLACEMENTS: Record<string, string> = {
  middleware: 'processing step',
  endpoint: 'URL path',
  schema: 'data structure definition',
  migration: 'database change script',
  OAuth: 'login service',
  token: 'access key',
  'CI/CD': 'automated build and deploy process',
  pipeline: 'automated workflow',
  linting: 'code style checking',
  'type-safety': 'error prevention through types',
  hook: 'reusable function',
  props: 'input values',
  component: 'UI building block',
  state: 'stored data that changes',
  API: 'programming interface',
};

const BRIEF_EXPLANATIONS: Record<string, string> = {
  middleware: 'a processing step between request and response',
  endpoint: 'a specific URL that accepts requests',
  schema: 'a definition of data structure',
  migration: 'a script that modifies the database',
  OAuth: 'an authentication protocol',
  token: 'a credential for API access',
  'CI/CD': 'continuous integration and deployment',
  pipeline: 'an automated sequence of steps',
  linting: 'automated code style checking',
  'type-safety': 'compile-time type checking',
  hook: 'a React function for shared logic',
  props: 'properties passed to a component',
  component: 'a reusable UI element',
  state: 'data that drives re-renders',
  API: 'application programming interface',
};

export function adaptText(text: string, profile: KnowledgeProfile): string {
  let result = text;

  for (const [concept, entry] of Object.entries(profile)) {
    if (!result.includes(concept)) continue;

    if (entry.level === 0) {
      // Replace jargon with plain language
      const replacement = JARGON_REPLACEMENTS[concept] ?? concept;
      result = result.replace(new RegExp(`\\b${escapeRegex(concept)}\\b`, 'g'), replacement);
    } else if (entry.level === 1) {
      // Keep term, add brief parenthetical
      const explanation = BRIEF_EXPLANATIONS[concept] ?? '';
      if (explanation) {
        result = result.replace(
          new RegExp(`\\b${escapeRegex(concept)}\\b`),
          `${concept} (${explanation})`,
        );
      }
    }
    // Level 2 and 3: use term as-is
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface CrewContext {
  knowledgeProfile: KnowledgeProfile;
  languageGuidelines: string[];
}

export function buildCrewContext(profile: KnowledgeProfile): CrewContext {
  const guidelines: string[] = [];

  for (const [concept, entry] of Object.entries(profile)) {
    const levelName = LEVEL_NAMES[entry.level];
    if (entry.level === 0) {
      guidelines.push(`Avoid jargon "${concept}" (${levelName}) — use plain language instead`);
    } else if (entry.level === 1) {
      guidelines.push(`Briefly explain "${concept}" (${levelName}) when first used`);
    } else if (entry.level === 2) {
      guidelines.push(`"${concept}" (${levelName}) — can use with light context`);
    } else {
      guidelines.push(`"${concept}" (${levelName}) — use freely`);
    }
  }

  return {
    knowledgeProfile: profile,
    languageGuidelines: guidelines,
  };
}
