import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustryTabs } from '../IndustryTabs';

describe('IndustryTabs', () => {
  it('shows the default industry and switches tabs', async () => {
    render(<IndustryTabs />);

    expect(screen.getByRole('button', { name: /^Barber & Beauty$/i })).toBeInTheDocument();
    expect(screen.getByText(/Der Stuhl ist voll/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Immobilien/i }));
    expect(await screen.findByText(/Besichtigung statt Telefonat/i)).toBeInTheDocument();
  });

  it('passes the active industry to onboarding CTA', () => {
    const onStartOnboarding = vi.fn();
    render(<IndustryTabs onStartOnboarding={onStartOnboarding} />);

    fireEvent.click(screen.getByRole('button', { name: /Agent für Barber & Beauty jetzt testen/i }));
    expect(onStartOnboarding).toHaveBeenCalledWith('barber');
  });
});

