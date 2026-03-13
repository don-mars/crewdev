import { describe, it, expect } from 'vitest';
import { createCrewDevError } from '../../../shared/types/errors';
import type { CrewDevError } from '../../../shared/types/errors';

describe('CrewDevError', () => {
  it('should have code, message, and optional detail fields', () => {
    const error: CrewDevError = createCrewDevError(
      'SPAWN_FAILED',
      'Could not start the coding agent',
    );

    expect(error.code).toBe('SPAWN_FAILED');
    expect(error.message).toBe('Could not start the coding agent');
    expect(error.detail).toBeUndefined();
  });

  it('should accept optional detail field', () => {
    const error: CrewDevError = createCrewDevError(
      'SPAWN_FAILED',
      'Could not start the coding agent',
      'ENOENT: claude binary not found',
    );

    expect(error.detail).toBe('ENOENT: claude binary not found');
  });

  it('should enforce SCREAMING_SNAKE_CASE for error codes', () => {
    const SCREAMING_SNAKE_CASE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

    const error = createCrewDevError('INVALID_PATH', 'Bad path');
    expect(error.code).toMatch(SCREAMING_SNAKE_CASE);
  });
});
