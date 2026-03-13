import type { QualityRollResult, BuildQuality } from '../../shared/types/gamification';

const ANIMATION_MAP: Record<BuildQuality, string> = {
  excellent: 'sparkle-burst',
  good: 'thumbs-up',
  'needs-polish': 'polish-swirl',
};

// Excellent: 0-0.1, Good: 0.1-0.85, Needs Polish: 0.85-1.0
export function rollBuildQuality(randomValue?: number): QualityRollResult {
  const roll = randomValue ?? Math.random();

  let quality: BuildQuality;
  if (roll < 0.1) {
    quality = 'excellent';
  } else if (roll < 0.85) {
    quality = 'good';
  } else {
    quality = 'needs-polish';
  }

  return {
    quality,
    animation: ANIMATION_MAP[quality],
  };
}
