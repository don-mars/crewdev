export interface CrewDevError {
  readonly code: string;
  readonly message: string;
  readonly detail?: string;
}

export function createCrewDevError(
  code: string,
  message: string,
  detail?: string,
): CrewDevError {
  return { code, message, detail };
}
