// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { adaptText, buildCrewContext } from '../../../main/language/language-adapter';
import type { KnowledgeProfile } from '../../../shared/types/knowledge';

function makeProfile(overrides: Record<string, { level: number; exposures: number }>): KnowledgeProfile {
  const profile: KnowledgeProfile = {};
  for (const [key, value] of Object.entries(overrides)) {
    profile[key] = { level: value.level as 0 | 1 | 2 | 3, exposures: value.exposures };
  }
  return profile;
}

describe('Language adapter', () => {
  it('should replace jargon for level-0 concepts', () => {
    const profile = makeProfile({ middleware: { level: 0, exposures: 0 } });
    const text = 'We need to add middleware to handle auth.';

    const adapted = adaptText(text, profile);

    expect(adapted).not.toContain('middleware');
    expect(adapted.toLowerCase()).toContain('processing step');
  });

  it('should use simple explanation for level-1 concepts', () => {
    const profile = makeProfile({ middleware: { level: 1, exposures: 1 } });
    const text = 'We need to add middleware to handle auth.';

    const adapted = adaptText(text, profile);

    // Should keep the term but add brief explanation
    expect(adapted).toContain('middleware');
    expect(adapted).toContain('(');
  });

  it('should use term normally for level-3 concepts', () => {
    const profile = makeProfile({ middleware: { level: 3, exposures: 10 } });
    const text = 'We need to add middleware to handle auth.';

    const adapted = adaptText(text, profile);

    expect(adapted).toBe('We need to add middleware to handle auth.');
  });

  it('should include profile in crew context package', () => {
    const profile = makeProfile({
      component: { level: 2, exposures: 5 },
      API: { level: 1, exposures: 2 },
    });

    const context = buildCrewContext(profile);

    expect(context.knowledgeProfile).toEqual(profile);
    expect(context.languageGuidelines).toBeDefined();
    expect(context.languageGuidelines.length).toBeGreaterThan(0);
  });
});
