import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../Navbar';

describe('Navbar', () => {
  it('renders nav links and CTA', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Funktionen/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Branchen/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Demo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Preise/i })).toBeInTheDocument();

    // Open mobile menu to reveal CTA
    const ctas = screen.getAllByLabelText(/Onboarding starten/i);
    expect(ctas.length).toBeGreaterThan(0);
  });

  it('triggers onboarding callback from CTA', () => {
    const onStartOnboarding = vi.fn();
    render(
      <MemoryRouter>
        <Navbar onStartOnboarding={onStartOnboarding} />
      </MemoryRouter>
    );

    const ctas = screen.getAllByLabelText(/Onboarding starten/i);
    fireEvent.click(ctas[0]);
    expect(onStartOnboarding).toHaveBeenCalledTimes(1);
  });

  it('smooth scrolls when clicking a nav link on landing', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo');
    const section = document.createElement('div');
    section.id = 'features';
    section.getBoundingClientRect = () =>
      ({ top: 200, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(section);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: /Funktionen/i }));
    expect(scrollSpy).toHaveBeenCalled();
    document.body.removeChild(section);
  });
});

