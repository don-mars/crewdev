import { describe, it, expect } from 'vitest';
import { createSuccessResponse, createErrorResponse } from '../../../shared/types/ipc-response';
import type { IpcResponse } from '../../../shared/types/ipc-response';

describe('IpcResponse', () => {
  it('should return { success: true, data } for success', () => {
    const response: IpcResponse<{ name: string }> = createSuccessResponse({ name: 'test' });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data).toEqual({ name: 'test' });
    }
  });

  it('should return { success: false, error } for failure', () => {
    const response: IpcResponse<unknown> = createErrorResponse({
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });

    expect(response.success).toBe(false);
    if (!response.success) {
      expect(response.error.code).toBe('NOT_FOUND');
      expect(response.error.message).toBe('Resource not found');
    }
  });

  it('should type-narrow correctly based on success field', () => {
    const response: IpcResponse<string> = createSuccessResponse('hello');

    if (response.success) {
      expect(response.data).toBe('hello');
    } else {
      expect.unreachable('Should be a success response');
    }
  });

  it('should preserve error detail field for logging', () => {
    const response: IpcResponse<unknown> = createErrorResponse({
      code: 'INTERNAL',
      message: 'Something went wrong',
      detail: 'Stack trace here',
    });

    if (!response.success) {
      expect(response.error.code).toBe('INTERNAL');
      expect(response.error.message).toBe('Something went wrong');
      expect(response.error.detail).toBe('Stack trace here');
    }
  });
});
