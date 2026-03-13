import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrewEmote } from '../../../renderer/components/CrewEmote';
import type { CrewStatus } from '../../../shared/types/crew';

describe('CrewEmote', () => {
  it('should render correct emote for idle status', () => {
    render(<CrewEmote status="idle" />);
    expect(screen.getByTestId('emote').textContent).toBe('😴');
  });

  it('should render correct emote for thinking status', () => {
    render(<CrewEmote status="thinking" />);
    expect(screen.getByTestId('emote').textContent).toBe('🤔');
  });

  it('should render correct emote for working status', () => {
    render(<CrewEmote status="working" />);
    expect(screen.getByTestId('emote').textContent).toBe('⚡');
  });

  it('should render correct emote for waiting status', () => {
    render(<CrewEmote status="waiting" />);
    expect(screen.getByTestId('emote').textContent).toBe('⏳');
  });

  it('should render correct emote for error status', () => {
    render(<CrewEmote status="error" />);
    expect(screen.getByTestId('emote').textContent).toBe('❌');
  });

  it('should render correct emote for finished status', () => {
    render(<CrewEmote status="finished" />);
    expect(screen.getByTestId('emote').textContent).toBe('✅');
  });

  it('should update emote immediately on status change', () => {
    const { rerender } = render(<CrewEmote status="idle" />);
    expect(screen.getByTestId('emote').textContent).toBe('😴');

    rerender(<CrewEmote status="working" />);
    expect(screen.getByTestId('emote').textContent).toBe('⚡');
  });
});
