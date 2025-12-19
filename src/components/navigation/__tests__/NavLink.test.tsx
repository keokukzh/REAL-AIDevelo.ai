import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavLink } from '../NavLink';
import { vi } from 'vitest';

// Mock useNavigation hook
vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    goTo: vi.fn(),
  }),
}));

describe('NavLink', () => {
  it('renders as a link by default', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" label="Test Link" />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Test Link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders as a button when variant is button', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" label="Test Button" variant="button" />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /Test Button/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick handler when provided', () => {
    const handleClick = vi.fn();
    render(
      <MemoryRouter>
        <NavLink to="/test" label="Test" onClick={handleClick} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: /Test/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('uses aria-label when provided', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" label="Test" ariaLabel="Custom aria label" />
      </MemoryRouter>
    );

    const link = screen.getByLabelText('Custom aria label');
    expect(link).toBeInTheDocument();
  });
});
