import { describe, it, expect } from 'vitest';
import { ERROR_CODES, getUserMessage } from '../../../shared/types/error-codes';

const SCREAMING_SNAKE_CASE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

describe('Error codes', () => {
  const codes = Object.keys(ERROR_CODES);

  it('should all follow SCREAMING_SNAKE_CASE convention', () => {
    for (const code of codes) {
      expect(code, `"${code}" is not SCREAMING_SNAKE_CASE`).toMatch(SCREAMING_SNAKE_CASE);
    }
  });

  it('should have no duplicate error codes', () => {
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('should each have a plain English message', () => {
    for (const [code, message] of Object.entries(ERROR_CODES)) {
      expect(message, `${code} has empty message`).toBeTruthy();
      expect(typeof message).toBe('string');
      // Should not contain technical jargon like stack traces
      expect(message).not.toMatch(/at \w+\.\w+/);
      expect(message).not.toContain('.ts:');
      expect(message).not.toContain('.js:');
    }
  });

  it('should return user message for known code', () => {
    expect(getUserMessage('AUTH_FAILED')).toBe('Authentication failed — please check your credentials');
  });

  it('should return fallback for unknown code', () => {
    expect(getUserMessage('UNKNOWN_CODE')).toBe('An unexpected error occurred');
  });
});
