import type { KnowledgeProfile, ConceptLevel } from '../../shared/types/knowledge';
import { createDefaultProfile } from '../../shared/types/knowledge';

const ADVANCE_THRESHOLD_1_TO_2 = 4; // Total exposures needed to go from 1→2

interface OnboardingAnswers {
  experience: string;
  knownConcepts: string[];
}

export function createProfileFromOnboarding(answers: OnboardingAnswers): KnowledgeProfile {
  const profile = createDefaultProfile();

  for (const concept of answers.knownConcepts) {
    if (profile[concept]) {
      profile[concept] = { level: 1, exposures: 1 };
    } else {
      profile[concept] = { level: 1, exposures: 1 };
    }
  }

  return profile;
}

export function recordMention(profile: KnowledgeProfile, concept: string): KnowledgeProfile {
  const updated = { ...profile };
  const entry = updated[concept] ?? { level: 0 as ConceptLevel, exposures: 0 };
  const newExposures = entry.exposures + 1;

  let newLevel = entry.level;
  if (entry.level === 0) {
    newLevel = 1;
  } else if (entry.level === 1 && newExposures >= ADVANCE_THRESHOLD_1_TO_2) {
    newLevel = 2;
  }

  updated[concept] = {
    level: newLevel as ConceptLevel,
    exposures: newExposures,
  };

  return updated;
}

export function recordCorrectUsage(profile: KnowledgeProfile, concept: string): KnowledgeProfile {
  const updated = { ...profile };
  const entry = updated[concept];
  if (!entry) return updated;

  if (entry.level === 2) {
    updated[concept] = { ...entry, level: 3 };
  }

  return updated;
}
