import type { ReactNode } from 'react';
import type { GitRepoInfo } from '../../shared/types/git';

interface GitPanelProps {
  repoInfo: GitRepoInfo;
  onRefresh: () => void;
}

export function GitPanel({ repoInfo, onRefresh }: GitPanelProps): ReactNode {
  return (
    <div className="rounded bg-gray-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Git</h3>
        <button
          onClick={onRefresh}
          className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs text-gray-400">Branch:</span>
        <span className="text-sm font-medium text-white">{repoInfo.branch}</span>
      </div>

      <div className="mb-2">
        <span className="text-xs text-gray-400">Status: </span>
        {repoInfo.isClean ? (
          <span className="text-xs text-green-400">Clean</span>
        ) : (
          <span className="text-xs text-yellow-400">Uncommitted changes</span>
        )}
      </div>

      {repoInfo.commits.length > 0 && (
        <div>
          <span className="text-xs text-gray-400">Recent commits:</span>
          <ul className="mt-1 space-y-1">
            {repoInfo.commits.map((commit, i) => (
              <li key={i} className="text-xs text-gray-300 truncate">
                {commit.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
