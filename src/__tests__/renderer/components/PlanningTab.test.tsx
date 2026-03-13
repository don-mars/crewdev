import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanningTab } from '../../../renderer/components/PlanningTab';
import type { PlanningDoc } from '../../../shared/types/planning';

const MOCK_DOCS: PlanningDoc[] = [
  { name: 'Architecture', fileName: 'Architecture.md', lastModified: '2026-03-13T00:00:00Z' },
  { name: 'Requirements', fileName: 'Requirements.pdf', lastModified: '2026-03-12T00:00:00Z' },
];

describe('PlanningTab', () => {
  const onUpload = vi.fn();
  const onCreate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render document list', () => {
    render(
      <PlanningTab docs={MOCK_DOCS} onUpload={onUpload} onCreate={onCreate} onDelete={onDelete} />,
    );

    expect(screen.getByText('Architecture')).toBeDefined();
    expect(screen.getByText('Requirements')).toBeDefined();
  });

  it('should show upload button', () => {
    render(
      <PlanningTab docs={MOCK_DOCS} onUpload={onUpload} onCreate={onCreate} onDelete={onDelete} />,
    );

    expect(screen.getByRole('button', { name: /upload/i })).toBeDefined();
  });

  it('should show create new button', () => {
    render(
      <PlanningTab docs={MOCK_DOCS} onUpload={onUpload} onCreate={onCreate} onDelete={onDelete} />,
    );

    expect(screen.getByRole('button', { name: /create/i })).toBeDefined();
  });

  it('should show delete button per document', () => {
    render(
      <PlanningTab docs={MOCK_DOCS} onUpload={onUpload} onCreate={onCreate} onDelete={onDelete} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('should call onDelete with filename when delete clicked', async () => {
    const user = userEvent.setup();
    render(
      <PlanningTab docs={MOCK_DOCS} onUpload={onUpload} onCreate={onCreate} onDelete={onDelete} />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('Architecture.md');
  });
});
