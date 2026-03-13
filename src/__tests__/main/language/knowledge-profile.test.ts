// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  createProfileFromOnboarding,
  recordMention,
  recordCorrectUsage,
} from '../../../main/language/knowledge-profile';
import { createDefaultProfile } from '../../../shared/types/knowledge';
import type { KnowledgeProfile } from '../../../shared/types/knowledge';

describe('KnowledgeProfile', () => {
  it('should create valid profile from onboarding conversation', () => {
    const answers = { experience: 'beginner', knownConcepts: ['component', 'props'] };
    const profile = createProfileFromOnboarding(answers);

    expect(profile['component']).toBeDefined();
    expect(profile['props']).toBeDefined();
    expect(profile['component'].level).toBe(1);
    expect(profile['props'].level).toBe(1);
  });

  it('should initialize all concepts at level 0', () => {
    const profile = createDefaultProfile();

    for (const entry of Object.values(profile)) {
      expect(entry.level).toBe(0);
      expect(entry.exposures).toBe(0);
    }
  });

  it('should advance concept from 0 to 1 on first mention', () => {
    const profile = createDefaultProfile();
    const updated = recordMention(profile, 'component');

    expect(updated['component'].level).toBe(1);
    expect(updated['component'].exposures).toBe(1);
  });

  it('should advance concept from 1 to 2 after 3-5 exposures', () => {
    let profile: KnowledgeProfile = createDefaultProfile();
    profile['component'] = { level: 1, exposures: 1 };

    // Add exposures to reach threshold
    for (let i = 0; i < 3; i++) {
      profile = recordMention(profile, 'component');
    }

    expect(profile['component'].level).toBe(2);
    expect(profile['component'].exposures).toBeGreaterThanOrEqual(4);
  });

  it('should advance concept from 2 to 3 on correct user usage', () => {
    const profile: KnowledgeProfile = createDefaultProfile();
    profile['component'] = { level: 2, exposures: 5 };

    const updated = recordCorrectUsage(profile, 'component');

    expect(updated['component'].level).toBe(3);
  });

  it('should not advance beyond level 3', () => {
    const profile: KnowledgeProfile = createDefaultProfile();
    profile['component'] = { level: 3, exposures: 10 };

    const updated = recordCorrectUsage(profile, 'component');

    expect(updated['component'].level).toBe(3);
  });

  it('should handle unknown concepts by adding them', () => {
    const profile = createDefaultProfile();
    const updated = recordMention(profile, 'new-concept');

    expect(updated['new-concept']).toBeDefined();
    expect(updated['new-concept'].level).toBe(1);
  });
});
