import { simpleGit } from 'simple-git';
import { logger } from '../../shared/utils/logger';
import { createCrewDevError } from '../../shared/types/errors';
import { createSuccessResponse, createErrorResponse } from '../../shared/types/ipc-response';
import type { IpcResponse } from '../../shared/types/ipc-response';
import type { GitRepoInfo } from '../../shared/types/git';

const MAX_COMMITS = 5;

export async function handleGitConnect(dirPath: string): Promise<IpcResponse<GitRepoInfo>> {
  try {
    const git = simpleGit(dirPath);

    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return createErrorResponse(
        createCrewDevError('NOT_A_REPO', 'This directory is not a git repository'),
      );
    }

    const [branchResult, logResult, statusResult] = await Promise.all([
      git.branch(),
      git.log({ maxCount: MAX_COMMITS }),
      git.status(),
    ]);

    const commits = logResult.all.slice(0, MAX_COMMITS).map((entry) => ({
      message: entry.message,
      timestamp: entry.date,
    }));

    return createSuccessResponse<GitRepoInfo>({
      branch: branchResult.current,
      commits,
      isClean: statusResult.isClean(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Git connect failed', { dirPath, error: message });

    return createErrorResponse(
      createCrewDevError('PATH_NOT_FOUND', 'Could not access the specified directory', message),
    );
  }
}
