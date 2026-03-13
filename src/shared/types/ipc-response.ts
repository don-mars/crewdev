import type { CrewDevError } from './errors';

export type IpcResponse<T> =
  | { success: true; data: T }
  | { success: false; error: CrewDevError };

export function createSuccessResponse<T>(data: T): IpcResponse<T> {
  return { success: true, data };
}

export function createErrorResponse<T>(error: CrewDevError): IpcResponse<T> {
  return { success: false, error };
}
