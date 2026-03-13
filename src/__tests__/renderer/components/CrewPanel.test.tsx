import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrewPanel } from '../../../renderer/components/CrewPanel';
import type { CrewMemberConfig, CrewStatus } from '../../../shared/types/crew';

const MOCK_CREW: (CrewMemberConfig & { status: CrewStatus })[] = [
  { id: 'c1', name: 'Architect', role: 'System Design', configContent: '', status: 'idle' },
  { id: 'c2', name: 'Coder', role: 'Implementation', configContent: '', status: 'working' },
  { id: 'c3', name: 'Reviewer', role: 'Code Review', configContent: '', status: 'error' },
];

describe('CrewPanel', () => {
  const onActivate = vi.fn();
  const onDeactivate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all crew member cards', () => {
    render(
      <CrewPanel crew={MOCK_CREW} activeIds={[]} onActivate={onActivate} onDeactivate={onDeactivate} />,
    );

    expect(screen.getByText('Architect')).toBeDefined();
    expect(screen.getByText('Coder')).toBeDefined();
    expect(screen.getByText('Reviewer')).toBeDefined();
  });

  it('should display name and role per card', () => {
    render(
      <CrewPanel crew={MOCK_CREW} activeIds={[]} onActivate={onActivate} onDeactivate={onDeactivate} />,
    );

    expect(screen.getByText('System Design')).toBeDefined();
    expect(screen.getByText('Implementation')).toBeDefined();
    expect(screen.getByText('Code Review')).toBeDefined();
  });

  it('should show correct status indicator for idle', () => {
    render(
      <CrewPanel
        crew={[{ id: 'c1', name: 'Arch', role: 'Design', configContent: '', status: 'idle' }]}
        activeIds={[]}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    const indicator = screen.getByTestId('crew-status-c1');
    expect(indicator.className).toContain('bg-gray');
  });

  it('should show correct status indicator for working', () => {
    render(
      <CrewPanel
        crew={[{ id: 'c1', name: 'Arch', role: 'Design', configContent: '', status: 'working' }]}
        activeIds={['c1']}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    const indicator = screen.getByTestId('crew-status-c1');
    expect(indicator.className).toContain('bg-green');
  });

  it('should show correct status indicator for error', () => {
    render(
      <CrewPanel
        crew={[{ id: 'c1', name: 'Arch', role: 'Design', configContent: '', status: 'error' }]}
        activeIds={['c1']}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    const indicator = screen.getByTestId('crew-status-c1');
    expect(indicator.className).toContain('bg-red');
  });

  it('should trigger activate on card click when not active', async () => {
    const user = userEvent.setup();
    render(
      <CrewPanel crew={MOCK_CREW} activeIds={[]} onActivate={onActivate} onDeactivate={onDeactivate} />,
    );

    await user.click(screen.getByTestId('crew-card-c1'));

    expect(onActivate).toHaveBeenCalledWith('c1');
  });

  it('should set draggable attribute on crew cards', () => {
    render(
      <CrewPanel crew={MOCK_CREW} activeIds={[]} onActivate={onActivate} onDeactivate={onDeactivate} />,
    );

    const card = screen.getByTestId('crew-card-c1');
    expect(card.getAttribute('draggable')).toBe('true');
  });

  it('should set crew id in drag data on dragstart', () => {
    render(
      <CrewPanel crew={MOCK_CREW} activeIds={[]} onActivate={onActivate} onDeactivate={onDeactivate} />,
    );

    const card = screen.getByTestId('crew-card-c1');
    const dataTransfer = { setData: vi.fn() };
    fireEvent.dragStart(card, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('crewdev/crew-id', 'c1');
  });

  it('should enforce max 4 simultaneous active crew members', async () => {
    const fullCrew = [
      { id: 'c1', name: 'A', role: 'R', configContent: '', status: 'working' as CrewStatus },
      { id: 'c2', name: 'B', role: 'R', configContent: '', status: 'working' as CrewStatus },
      { id: 'c3', name: 'C', role: 'R', configContent: '', status: 'working' as CrewStatus },
      { id: 'c4', name: 'D', role: 'R', configContent: '', status: 'working' as CrewStatus },
      { id: 'c5', name: 'E', role: 'R', configContent: '', status: 'idle' as CrewStatus },
    ];

    const user = userEvent.setup();
    render(
      <CrewPanel
        crew={fullCrew}
        activeIds={['c1', 'c2', 'c3', 'c4']}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    await user.click(screen.getByTestId('crew-card-c5'));

    expect(onActivate).not.toHaveBeenCalled();
  });

  it('should trigger deactivate on deactivate button click', async () => {
    const user = userEvent.setup();
    render(
      <CrewPanel
        crew={MOCK_CREW}
        activeIds={['c2']}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    await user.click(screen.getByTestId('deactivate-c2'));

    expect(onDeactivate).toHaveBeenCalledWith('c2');
  });

  it('should return crew member to idle after deactivation', () => {
    const { rerender } = render(
      <CrewPanel
        crew={MOCK_CREW}
        activeIds={['c2']}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    // Simulate deactivation by re-rendering with c2 removed from activeIds and status idle
    const updatedCrew = MOCK_CREW.map((c) =>
      c.id === 'c2' ? { ...c, status: 'idle' as CrewStatus } : c,
    );

    rerender(
      <CrewPanel
        crew={updatedCrew}
        activeIds={[]}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />,
    );

    const indicator = screen.getByTestId('crew-status-c2');
    expect(indicator.className).toContain('bg-gray');
  });
});
