export const ERROR_CODES = {
  // Project
  PATH_NOT_FOUND: 'The specified path could not be found',
  DUPLICATE_PROJECT: 'A project already exists at this location',
  CREATE_FAILED: 'Failed to create the project',
  PROJECT_NOT_FOUND: 'No project found at the specified location',
  INVALID_PROJECT: 'The project data is invalid or corrupted',

  // Features
  FEATURE_NOT_FOUND: 'The requested feature could not be found',
  INVALID_FEATURE: 'The feature data is invalid',
  INVALID_STATUS: 'The status value is not valid',
  LOAD_FAILED: 'Failed to load the requested data',

  // Crew
  CONFIG_NOT_FOUND: 'The crew configuration file was not found',
  EMPTY_CONFIG: 'The configuration content cannot be empty',
  COPY_FAILED: 'Failed to copy configuration files',
  SAVE_FAILED: 'Failed to save the data',
  SPAWN_FAILED: 'Could not start the coding agent',

  // Planning
  UNSUPPORTED_TYPE: 'This file type is not supported',
  INVALID_NAME: 'The name provided is not valid',
  DUPLICATE_NAME: 'An item with this name already exists',
  DOC_NOT_FOUND: 'The document could not be found',

  // Memory
  MEMORY_NOT_FOUND: 'The memory file was not found',
  MEMORY_CORRUPT: 'The memory file is corrupted',
  WRITE_FAILED: 'Failed to write data to disk',

  // Linear / Integrations
  AUTH_FAILED: 'Authentication failed — please check your credentials',
  RATE_LIMITED: 'Too many requests — please try again shortly',
  LINEAR_API_ERROR: 'Linear API returned an error',
  TICKET_NOT_FOUND: 'The requested ticket could not be found',

  // Git
  NOT_A_REPO: 'The directory is not a Git repository',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function getUserMessage(code: string): string {
  return (ERROR_CODES as Record<string, string>)[code] ?? 'An unexpected error occurred';
}
