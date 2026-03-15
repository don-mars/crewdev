// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { parseStatusFromLine } from '../../../main/processes/crew-output';

describe('parseStatusFromLine', () => {
  it('should return thinking for assistant type', () => {
    expect(parseStatusFromLine('{"type":"assistant"}')).toBe('thinking');
  });

  it('should return thinking for thinking type', () => {
    expect(parseStatusFromLine('{"type":"thinking"}')).toBe('thinking');
  });

  it('should return working for tool_use type', () => {
    expect(parseStatusFromLine('{"type":"tool_use"}')).toBe('working');
  });

  it('should return working for tool_result type', () => {
    expect(parseStatusFromLine('{"type":"tool_result"}')).toBe('working');
  });

  it('should return finished for result type', () => {
    expect(parseStatusFromLine('{"type":"result"}')).toBe('finished');
  });

  it('should return null for unrecognized types', () => {
    expect(parseStatusFromLine('{"type":"content_block_delta"}')).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    expect(parseStatusFromLine('not json')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseStatusFromLine('')).toBeNull();
  });
});
