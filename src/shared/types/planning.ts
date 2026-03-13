export interface PlanningDoc {
  readonly name: string;
  readonly fileName: string;
  readonly lastModified: string;
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.md', '.txt'] as const;
