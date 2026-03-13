import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../../../renderer/components/ChatInput';

let mockSendInput: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockSendInput = vi.fn().mockResolvedValue(undefined);

  window.crewdev = {
    crew: {
      spawn: vi.fn(),
      kill: vi.fn(),
      killAll: vi.fn(),
      sendInput: mockSendInput,
      onOutput: vi.fn(() => vi.fn()),
      onStatus: vi.fn(),
    },
    project: {
      create: vi.fn(),
      list: vi.fn(),
      select: vi.fn(),
      gitConnect: vi.fn(),
    },
    memory: {
      read: vi.fn(),
      write: vi.fn(),
    },
  } as unknown as typeof window.crewdev;
});

describe('ChatInput', () => {
  it('should render text input and send button', () => {
    render(<ChatInput activeCrewId="crew-1" onMessageSent={vi.fn()} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should send message on Enter key press', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    render(<ChatInput activeCrewId="crew-1" onMessageSent={onMessageSent} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello Claude{Enter}');

    expect(mockSendInput).toHaveBeenCalledWith('crew-1', 'Hello Claude');
  });

  it('should send message on Send button click', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    render(<ChatInput activeCrewId="crew-1" onMessageSent={onMessageSent} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello Claude');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockSendInput).toHaveBeenCalledWith('crew-1', 'Hello Claude');
  });

  it('should clear input after successful send', async () => {
    const user = userEvent.setup();
    render(<ChatInput activeCrewId="crew-1" onMessageSent={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello Claude{Enter}');

    expect(input).toHaveValue('');
  });

  it('should be disabled when no active crew member', () => {
    render(<ChatInput activeCrewId={null} onMessageSent={vi.fn()} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should be disabled when input is empty', () => {
    render(<ChatInput activeCrewId="crew-1" onMessageSent={vi.fn()} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('should send message to correct crew member via IPC', async () => {
    const user = userEvent.setup();
    render(<ChatInput activeCrewId="builder-1" onMessageSent={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Build the feature{Enter}');

    expect(mockSendInput).toHaveBeenCalledWith('builder-1', 'Build the feature');
  });

  it('should call onMessageSent callback after send', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    render(<ChatInput activeCrewId="crew-1" onMessageSent={onMessageSent} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello{Enter}');

    expect(onMessageSent).toHaveBeenCalledWith('Hello');
  });
});
