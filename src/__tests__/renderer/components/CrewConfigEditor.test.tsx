import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrewConfigEditor } from '../../../renderer/components/CrewConfigEditor';

describe('CrewConfigEditor', () => {
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display current config content in textarea', () => {
    render(<CrewConfigEditor content="# Builder Config" onSave={onSave} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('# Builder Config');
  });

  it('should save changes on save button click', async () => {
    const user = userEvent.setup();
    render(<CrewConfigEditor content="# Builder Config" onSave={onSave} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Updated' } });
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith('# Updated');
  });

  it('should show save confirmation after save', async () => {
    onSave.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CrewConfigEditor content="# Config" onSave={onSave} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '# Changed' } });
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/saved/i)).toBeDefined();
  });
});
