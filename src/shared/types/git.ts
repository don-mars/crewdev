export interface GitCommitInfo {
  readonly message: string;
  readonly timestamp: string;
}

export interface GitRepoInfo {
  readonly branch: string;
  readonly commits: GitCommitInfo[];
  readonly isClean: boolean;
}
