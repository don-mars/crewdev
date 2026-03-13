import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KnowledgeSettings } from '../../../renderer/components/KnowledgeSettings';
import type { KnowledgeProfile } from '../../../shared/types/knowledge';

describe('Knowledge Settings', () => {
  let mockProfile: KnowledgeProfile;
  let mockOnUpdate: (profile: KnowledgeProfile) => Promise<void>;
  let mockOnReset: () => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile = {
      component: { level: 2, exposures: 5 },
      API: { level: 0, exposures: 0 },
      middleware: { level: 1, exposures: 2 },
    };
    mockOnUpdate = vi.fn().mockResolvedValue(undefined) as unknown as typeof mockOnUpdate;
    mockOnReset = vi.fn().mockResolvedValue(undefined) as unknown as typeof mockOnReset;
  });

  it('should display all concepts with current levels', () => {
    render(
      <KnowledgeSettings profile={mockProfile} onUpdate={mockOnUpdate} onReset={mockOnReset} />,
    );

    expect(screen.getByText('component')).toBeTruthy();
    expect(screen.getByText('API')).toBeTruthy();
    expect(screen.getByText('middleware')).toBeTruthy();
    expect(screen.getByText('Familiar')).toBeTruthy(); // level 2
    expect(screen.getByText('Unknown')).toBeTruthy(); // level 0
    expect(screen.getByText('Introduced')).toBeTruthy(); // level 1
  });

  it('should allow manual level adjustment', async () => {
    render(
      <KnowledgeSettings profile={mockProfile} onUpdate={mockOnUpdate} onReset={mockOnReset} />,
    );

    // Find the select for API concept and change it
    const selects = screen.getAllByRole('combobox');
    const apiSelect = selects.find((s) => {
      const row = s.closest('[data-concept]');
      return row?.getAttribute('data-concept') === 'API';
    });

    expect(apiSelect).toBeTruthy();
    fireEvent.change(apiSelect!, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      const updatedProfile = (mockOnUpdate as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(updatedProfile.API.level).toBe(2);
    });
  });

  it('should persist manual changes', async () => {
    render(
      <KnowledgeSettings profile={mockProfile} onUpdate={mockOnUpdate} onReset={mockOnReset} />,
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '3' } });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('should reset all concepts to level 0', async () => {
    render(
      <KnowledgeSettings profile={mockProfile} onUpdate={mockOnUpdate} onReset={mockOnReset} />,
    );

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });
});
