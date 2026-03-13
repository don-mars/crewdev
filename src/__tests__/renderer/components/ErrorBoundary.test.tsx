import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../renderer/components/ErrorBoundary';

// Suppress React error boundary console errors in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

function ThrowingComponent({ message }: { message: string }): never {
  throw new Error(message);
}

function WorkingComponent() {
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  it('should catch rendering errors', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test error" />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });

  it('should display plain English error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Cannot read properties of undefined" />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    // Should NOT show the raw error message
    expect(screen.queryByText('Cannot read properties of undefined')).toBeNull();
  });

  it('should never display error.detail or stack traces', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Error at Object.render (component.tsx:42)" />
      </ErrorBoundary>,
    );

    const html = document.body.innerHTML;
    expect(html).not.toContain('Object.render');
    expect(html).not.toContain('.tsx:');
    expect(html).not.toContain('at ');
  });

  it('should show retry button where applicable', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Network failure" />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('should recover on retry', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('First render fails');
      }
      return <div>Recovered successfully</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeTruthy();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Recovered successfully')).toBeTruthy();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeTruthy();
  });
});
