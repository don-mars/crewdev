import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureTree } from '../../../renderer/components/FeatureTree';
import type { FeatureTreeNode } from '../../../shared/types/feature';

function makeNode(
  id: string,
  title: string,
  status: 'planned' | 'in-progress' | 'complete' | 'blocked',
  children: FeatureTreeNode[] = [],
): FeatureTreeNode {
  return { id, title, status, parent: null, body: '', children };
}

const MOCK_TREE: FeatureTreeNode[] = [
  makeNode('f1', 'Auth System', 'planned', [
    makeNode('f2', 'Login Page', 'in-progress'),
    makeNode('f3', 'OAuth Flow', 'complete'),
  ]),
  makeNode('f4', 'Dashboard', 'blocked'),
];

describe('FeatureTree', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all feature nodes', () => {
    render(<FeatureTree tree={MOCK_TREE} activeId={null} onSelect={onSelect} />);

    expect(screen.getByText('Auth System')).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('should display correct status color for planned', () => {
    render(<FeatureTree tree={[makeNode('p', 'Planned', 'planned')]} activeId={null} onSelect={onSelect} />);

    const indicator = screen.getByTestId('status-p');
    expect(indicator.className).toContain('bg-gray');
  });

  it('should display correct status color for in-progress', () => {
    render(<FeatureTree tree={[makeNode('ip', 'InProg', 'in-progress')]} activeId={null} onSelect={onSelect} />);

    const indicator = screen.getByTestId('status-ip');
    expect(indicator.className).toContain('bg-blue');
  });

  it('should display correct status color for complete', () => {
    render(<FeatureTree tree={[makeNode('c', 'Done', 'complete')]} activeId={null} onSelect={onSelect} />);

    const indicator = screen.getByTestId('status-c');
    expect(indicator.className).toContain('bg-green');
  });

  it('should display correct status color for blocked', () => {
    render(<FeatureTree tree={[makeNode('b', 'Blocked', 'blocked')]} activeId={null} onSelect={onSelect} />);

    const indicator = screen.getByTestId('status-b');
    expect(indicator.className).toContain('bg-red');
  });

  it('should fire onSelect with feature ID on node click', async () => {
    const user = userEvent.setup();
    render(<FeatureTree tree={MOCK_TREE} activeId={null} onSelect={onSelect} />);

    await user.click(screen.getByText('Dashboard'));

    expect(onSelect).toHaveBeenCalledWith('f4');
  });

  it('should toggle children visibility on expand/collapse', async () => {
    const user = userEvent.setup();
    render(<FeatureTree tree={MOCK_TREE} activeId={null} onSelect={onSelect} />);

    // Children should be visible by default
    expect(screen.getByText('Login Page')).toBeDefined();

    // Click the toggle button to collapse
    const toggle = screen.getByTestId('toggle-f1');
    await user.click(toggle);

    expect(screen.queryByText('Login Page')).toBeNull();

    // Click again to expand
    await user.click(toggle);

    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('should highlight active node', () => {
    render(<FeatureTree tree={MOCK_TREE} activeId="f4" onSelect={onSelect} />);

    const node = screen.getByTestId('node-f4');
    expect(node.className).toContain('bg-blue');
  });

  it('should render empty state when no features exist', () => {
    render(<FeatureTree tree={[]} activeId={null} onSelect={onSelect} />);

    expect(screen.getByText(/no features/i)).toBeDefined();
  });

  it('should update when feature data changes', () => {
    const { rerender } = render(
      <FeatureTree tree={MOCK_TREE} activeId={null} onSelect={onSelect} />,
    );

    expect(screen.getByText('Auth System')).toBeDefined();

    const updatedTree = [makeNode('new', 'New Feature', 'planned')];
    rerender(<FeatureTree tree={updatedTree} activeId={null} onSelect={onSelect} />);

    expect(screen.queryByText('Auth System')).toBeNull();
    expect(screen.getByText('New Feature')).toBeDefined();
  });
});
