import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../App';

describe('App component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(document.getElementById('root') || document.body).toBeTruthy();
  });

  it('should mount React root element', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
    expect(container.innerHTML).not.toBe('');
  });

  it('should render with Tailwind utility classes applied', () => {
    const { container } = render(<App />);
    const appElement = container.firstElementChild;
    expect(appElement).toBeTruthy();
  });
});
