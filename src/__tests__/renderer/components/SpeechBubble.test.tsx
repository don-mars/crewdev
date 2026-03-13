import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeechBubble } from '../../../renderer/components/SpeechBubble';

describe('SpeechBubble', () => {
  it('should display last output line truncated to 80 chars', () => {
    const longText = 'A'.repeat(100);
    render(<SpeechBubble lastOutput={longText} filesChanged={[]} isActive />);

    const bubble = screen.getByTestId('bubble-text');
    expect(bubble.textContent!.length).toBeLessThanOrEqual(83); // 80 + "..."
  });

  it('should be visible when crew has recent output', () => {
    render(<SpeechBubble lastOutput="Working on auth module" filesChanged={[]} isActive />);

    expect(screen.getByTestId('speech-bubble')).toBeDefined();
    expect(screen.getByText(/Working on auth module/)).toBeDefined();
  });

  it('should be hidden when crew is idle with no recent output', () => {
    render(<SpeechBubble lastOutput={null} filesChanged={[]} isActive={false} />);

    expect(screen.queryByTestId('speech-bubble')).toBeNull();
  });

  it('should expand to detail view on click', async () => {
    const user = userEvent.setup();
    render(
      <SpeechBubble
        lastOutput="Fixing bug"
        filesChanged={['src/main.ts', 'src/utils.ts']}
        isActive
      />,
    );

    await user.click(screen.getByTestId('speech-bubble'));

    expect(screen.getByTestId('detail-view')).toBeDefined();
  });

  it('should show files changed in detail view', async () => {
    const user = userEvent.setup();
    render(
      <SpeechBubble
        lastOutput="Fixing bug"
        filesChanged={['src/main.ts', 'src/utils.ts']}
        isActive
      />,
    );

    await user.click(screen.getByTestId('speech-bubble'));

    expect(screen.getByText('src/main.ts')).toBeDefined();
    expect(screen.getByText('src/utils.ts')).toBeDefined();
  });

  it('should close detail view and return to bubble', async () => {
    const user = userEvent.setup();
    render(
      <SpeechBubble
        lastOutput="Fixing bug"
        filesChanged={['src/main.ts']}
        isActive
      />,
    );

    await user.click(screen.getByTestId('speech-bubble'));
    expect(screen.getByTestId('detail-view')).toBeDefined();

    await user.click(screen.getByTestId('close-detail'));
    expect(screen.queryByTestId('detail-view')).toBeNull();
    expect(screen.getByTestId('speech-bubble')).toBeDefined();
  });
});
