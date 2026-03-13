import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitPanel } from '../../../renderer/components/GitPanel';
import type { GitRepoInfo } from '../../../shared/types/git';

const MOCK_REPO: GitRepoInfo = {
  branch: 'main',
  commits: [
    { message: 'feat: add feature', timestamp: '2026-03-13T10:00:00Z' },
    { message: 'fix: bug fix', timestamp: '2026-03-12T09:00:00Z' },
  ],
  isClean: true,
};

describe('GitPanel', () => {
  it('should display current branch name', () => {
    render(<GitPanel repoInfo={MOCK_REPO} onRefresh={vi.fn()} />);

    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should display commit list', () => {
    render(<GitPanel repoInfo={MOCK_REPO} onRefresh={vi.fn()} />);

    expect(screen.getByText('feat: add feature')).toBeInTheDocument();
    expect(screen.getByText('fix: bug fix')).toBeInTheDocument();
  });

  it('should display clean/dirty status', () => {
    render(<GitPanel repoInfo={MOCK_REPO} onRefresh={vi.fn()} />);

    expect(screen.getByText(/clean/i)).toBeInTheDocument();
  });

  it('should display dirty status when not clean', () => {
    const dirty = { ...MOCK_REPO, isClean: false };
    render(<GitPanel repoInfo={dirty} onRefresh={vi.fn()} />);

    expect(screen.getByText(/uncommitted/i)).toBeInTheDocument();
  });

  it('should refresh on button click', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<GitPanel repoInfo={MOCK_REPO} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
