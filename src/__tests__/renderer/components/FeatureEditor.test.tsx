import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FeatureEditor } from '../../../renderer/components/FeatureEditor';
import type { FeatureNode } from '../../../shared/types/feature';

const FEATURE_A: FeatureNode = {
  id: 'feat-a',
  title: 'Auth System',
  status: 'planned',
  parent: null,
  body: 'Initial content for Auth.',
};

const FEATURE_B: FeatureNode = {
  id: 'feat-b',
  title: 'Dashboard',
  status: 'in-progress',
  parent: null,
  body: 'Dashboard content.',
};

function changeTextarea(value: string): void {
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value } });
}

describe('FeatureEditor', () => {
  let onSave: ReturnType<typeof vi.fn<(featureId: string, body: string) => Promise<{ success: boolean }>>>;

  beforeEach(() => {
    vi.useFakeTimers();
    onSave = vi.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load document content from selected feature', () => {
    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Initial content for Auth.');
  });

  it('should show unsaved changes indicator on edit', () => {
    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('edited content');

    expect(screen.getByText(/unsaved/i)).toBeDefined();
  });

  it('should auto-save after 800ms debounce', async () => {
    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('new text');
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should not save on every keystroke', async () => {
    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('a');

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    changeTextarea('ab');

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    changeTextarea('abc');

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should show saving indicator during save', async () => {
    let resolveSave!: () => void;
    onSave.mockReturnValue(
      new Promise<{ success: boolean }>((resolve) => {
        resolveSave = () => resolve({ success: true });
      }),
    );

    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('edited');

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText(/saving/i)).toBeDefined();

    await act(async () => {
      resolveSave();
    });
  });

  it('should show saved indicator after successful save', async () => {
    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('edited');

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    // Wait for the save promise to resolve
    await act(async () => {});

    expect(screen.getByText(/saved/i)).toBeDefined();
  });

  it('should auto-save before switching features', async () => {
    const { rerender } = render(
      <FeatureEditor feature={FEATURE_A} onSave={onSave} />,
    );

    changeTextarea('edited content');

    // Switch feature before debounce fires
    await act(async () => {
      rerender(<FeatureEditor feature={FEATURE_B} onSave={onSave} />);
    });

    // Should have saved the previous feature's content
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('feat-a', 'edited content');
  });

  it('should load new feature content after switch', () => {
    const { rerender } = render(
      <FeatureEditor feature={FEATURE_A} onSave={onSave} />,
    );

    rerender(<FeatureEditor feature={FEATURE_B} onSave={onSave} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Dashboard content.');
  });

  it('should handle save errors gracefully', async () => {
    onSave.mockResolvedValue({ success: false } as { success: boolean });

    render(<FeatureEditor feature={FEATURE_A} onSave={onSave} />);

    changeTextarea('edited');

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    await act(async () => {});

    expect(screen.getByText(/error/i)).toBeDefined();
  });
});
