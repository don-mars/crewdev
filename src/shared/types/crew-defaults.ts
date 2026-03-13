export const CREW_MEMBER_IDS = [
  'builder',
  'stylist',
  'engineer',
  'reviewer',
  'fixer',
  'orchestrator',
] as const;

export type CrewMemberId = typeof CREW_MEMBER_IDS[number];
