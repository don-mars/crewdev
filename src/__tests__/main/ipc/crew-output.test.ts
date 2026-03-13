import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CREW_OUTPUT } from '../../../shared/constants/ipc';
import { registerCrewOutputHandler } from '../../../main/ipc/crew-output';

describe('Crew output IPC', () => {
  let mockWebContents: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockWebContents = { send: vi.fn() };
  });

  it('should send stdout line to renderer via correct channel', () => {
    const handler = registerCrewOutputHandler(mockWebContents as unknown as Electron.WebContents);

    handler('crew-1', 'Hello from Claude');

    expect(mockWebContents.send).toHaveBeenCalledWith(
      `${CREW_OUTPUT}:crew-1`,
      'Hello from Claude',
    );
  });

  it('should send lines in arrival order', () => {
    const handler = registerCrewOutputHandler(mockWebContents as unknown as Electron.WebContents);

    handler('crew-1', 'Line 1');
    handler('crew-1', 'Line 2');
    handler('crew-1', 'Line 3');

    expect(mockWebContents.send).toHaveBeenNthCalledWith(1, `${CREW_OUTPUT}:crew-1`, 'Line 1');
    expect(mockWebContents.send).toHaveBeenNthCalledWith(2, `${CREW_OUTPUT}:crew-1`, 'Line 2');
    expect(mockWebContents.send).toHaveBeenNthCalledWith(3, `${CREW_OUTPUT}:crew-1`, 'Line 3');
  });

  it('should use crew-specific channel name from constants', () => {
    const handler = registerCrewOutputHandler(mockWebContents as unknown as Electron.WebContents);

    handler('builder-1', 'output');
    handler('reviewer-1', 'review');

    expect(mockWebContents.send).toHaveBeenCalledWith(`${CREW_OUTPUT}:builder-1`, 'output');
    expect(mockWebContents.send).toHaveBeenCalledWith(`${CREW_OUTPUT}:reviewer-1`, 'review');
  });
});
