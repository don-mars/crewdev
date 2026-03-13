export type FeatureStatus = 'planned' | 'in-progress' | 'complete' | 'blocked';

export const FEATURE_STATUSES: readonly FeatureStatus[] = [
  'planned',
  'in-progress',
  'complete',
  'blocked',
] as const;

export interface FeatureNode {
  readonly id: string;
  readonly title: string;
  readonly status: FeatureStatus;
  readonly parent: string | null;
  readonly body: string;
}

export interface FeatureTreeNode extends FeatureNode {
  readonly children: FeatureTreeNode[];
}

export type FeatureTree = FeatureTreeNode[];
