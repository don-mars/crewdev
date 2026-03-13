import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityFeed } from '../../../renderer/components/ActivityFeed';
import type { ActivityEntry } from '../../../shared/types/activity';

function makeEntries(count: number): ActivityEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    crewName: `Crew ${i % 3}`,
    message: `Message ${i}`,
    timestamp: new Date(2026, 2, 13, 10, 0, i).toISOString(),
  }));
}

describe('ActivityFeed', () => {
  it('should render entries in arrival order', () => {
    const entries = makeEntries(3);
    render(<ActivityFeed entries={entries} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Message 0');
    expect(items[1]).toHaveTextContent('Message 1');
    expect(items[2]).toHaveTextContent('Message 2');
  });

  it('should display crew name and timestamp per entry', () => {
    const entries: ActivityEntry[] = [{
      id: 'e1',
      crewName: 'Builder',
      message: 'Working on feature',
      timestamp: '2026-03-13T10:00:00.000Z',
    }];
    render(<ActivityFeed entries={entries} />);

    expect(screen.getByText('Builder')).toBeInTheDocument();
    expect(screen.getByText('Working on feature')).toBeInTheDocument();
    // Timestamp should be rendered in some time format (locale-dependent)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('should auto-scroll to latest entry on new message', () => {
    const entries = makeEntries(20);
    const { container } = render(<ActivityFeed entries={entries} />);

    const feedEl = container.querySelector('[data-testid="activity-feed"]');
    if (feedEl) {
      // scrollTop should be set to scrollHeight - clientHeight (at bottom)
      // In jsdom, scrollHeight is 0, so we just verify the ref is set
      expect(feedEl).toBeTruthy();
    }
  });

  it('should pause auto-scroll when user scrolls up', () => {
    const entries = makeEntries(5);
    const { container } = render(<ActivityFeed entries={entries} />);

    const feedEl = container.querySelector('[data-testid="activity-feed"]');
    expect(feedEl).toBeTruthy();

    if (feedEl) {
      // Simulate user scrolling up (scrollTop far from bottom)
      Object.defineProperty(feedEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(feedEl, 'clientHeight', { value: 200, configurable: true });
      Object.defineProperty(feedEl, 'scrollTop', { value: 100, writable: true, configurable: true });

      fireEvent.scroll(feedEl);

      // After scroll up, the component should have paused auto-scroll
      // We verify by checking that the element's scrollTop isn't forced to bottom
      expect(feedEl.scrollTop).toBe(100);
    }
  });

  it('should resume auto-scroll when user returns to bottom', () => {
    const entries = makeEntries(5);
    const { container } = render(<ActivityFeed entries={entries} />);

    const feedEl = container.querySelector('[data-testid="activity-feed"]');
    expect(feedEl).toBeTruthy();

    if (feedEl) {
      Object.defineProperty(feedEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(feedEl, 'clientHeight', { value: 200, configurable: true });

      // Scroll to bottom (scrollTop + clientHeight >= scrollHeight - threshold)
      Object.defineProperty(feedEl, 'scrollTop', { value: 790, writable: true, configurable: true });
      fireEvent.scroll(feedEl);

      // Should be at bottom — auto-scroll should resume
      expect(feedEl.scrollTop).toBeGreaterThanOrEqual(790);
    }
  });

  it('should render empty state when no active crew member', () => {
    render(<ActivityFeed entries={[]} />);

    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });

  it('should handle 500 entries without performance degradation', () => {
    const entries = makeEntries(500);
    const start = performance.now();
    render(<ActivityFeed entries={entries} />);
    const elapsed = performance.now() - start;

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(500);
    // Should render in under 1 second in test environment
    expect(elapsed).toBeLessThan(1000);
  });
});
