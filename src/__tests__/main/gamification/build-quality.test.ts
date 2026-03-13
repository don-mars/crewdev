// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { rollBuildQuality } from '../../../main/gamification/build-quality';

describe('Build Quality Roll', () => {
  it('should return Excellent roughly 10% of the time', () => {
    const rolls = 10_000;
    let excellentCount = 0;
    for (let i = 0; i < rolls; i++) {
      if (rollBuildQuality().quality === 'excellent') excellentCount++;
    }
    const ratio = excellentCount / rolls;
    expect(ratio).toBeGreaterThan(0.05);
    expect(ratio).toBeLessThan(0.18);
  });

  it('should return Good roughly 75% of the time', () => {
    const rolls = 10_000;
    let goodCount = 0;
    for (let i = 0; i < rolls; i++) {
      if (rollBuildQuality().quality === 'good') goodCount++;
    }
    const ratio = goodCount / rolls;
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.85);
  });

  it('should return Needs Polish roughly 15% of the time', () => {
    const rolls = 10_000;
    let polishCount = 0;
    for (let i = 0; i < rolls; i++) {
      if (rollBuildQuality().quality === 'needs-polish') polishCount++;
    }
    const ratio = polishCount / rolls;
    expect(ratio).toBeGreaterThan(0.08);
    expect(ratio).toBeLessThan(0.25);
  });

  it('should fire correct animation event for Excellent', () => {
    const result = rollBuildQuality(0.05); // force excellent range
    expect(result.quality).toBe('excellent');
    expect(result.animation).toBe('sparkle-burst');
  });

  it('should fire correct animation event for Good', () => {
    const result = rollBuildQuality(0.5); // force good range
    expect(result.quality).toBe('good');
    expect(result.animation).toBe('thumbs-up');
  });

  it('should fire correct animation event for Needs Polish', () => {
    const result = rollBuildQuality(0.9); // force needs-polish range
    expect(result.quality).toBe('needs-polish');
    expect(result.animation).toBe('polish-swirl');
  });
});
