import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoilItDown } from '../../../renderer/components/BoilItDown';

describe('Boil It Down', () => {
  let mockCleanup: (text: string) => Promise<{ success: boolean; data?: string; error?: string }>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCleanup = vi.fn() as unknown as typeof mockCleanup;
  });

  it('should send transcription to AI for cleanup', async () => {
    (mockCleanup as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: 'cleaned text',
    });

    const mockOnCleaned = vi.fn();
    render(
      <BoilItDown text="um so like hello world uh" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /boil it down/i }));

    await waitFor(() => {
      expect(mockCleanup).toHaveBeenCalledWith('um so like hello world uh');
    });
  });

  it('should replace text with cleaned version on success', async () => {
    (mockCleanup as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: 'hello world',
    });

    const mockOnCleaned = vi.fn();
    render(
      <BoilItDown text="um so like hello world uh" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /boil it down/i }));

    await waitFor(() => {
      expect(mockOnCleaned).toHaveBeenCalledWith('hello world');
    });
  });

  it('should keep original text on API error', async () => {
    (mockCleanup as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'API unavailable',
    });

    const mockOnCleaned = vi.fn();
    render(
      <BoilItDown text="original text" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /boil it down/i }));

    await waitFor(() => {
      expect(mockOnCleaned).not.toHaveBeenCalled();
    });
  });

  it('should show fallback message on API error', async () => {
    (mockCleanup as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'API unavailable',
    });

    const mockOnCleaned = vi.fn();
    render(
      <BoilItDown text="original text" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /boil it down/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not clean up/i)).toBeTruthy();
    });
  });

  it('should be disabled while processing', async () => {
    let resolveCleanup!: (value: any) => void;
    (mockCleanup as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((r) => {
        resolveCleanup = r;
      }),
    );

    const mockOnCleaned = vi.fn();
    render(
      <BoilItDown text="some text" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /boil it down/i }));

    expect(screen.getByRole('button', { name: /boil it down/i })).toBeDisabled();

    resolveCleanup({ success: true, data: 'cleaned' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /boil it down/i })).not.toBeDisabled();
    });
  });

  it('should be disabled when text is empty', () => {
    const mockOnCleaned = vi.fn();
    render(<BoilItDown text="" onCleaned={mockOnCleaned} cleanupFn={mockCleanup} />);

    expect(screen.getByRole('button', { name: /boil it down/i })).toBeDisabled();
  });
});
