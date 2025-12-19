import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityStep } from '../AvailabilityStep';

describe('AvailabilityStep', () => {
  const mockUpdateFormData = vi.fn();
  const defaultProps = {
    formData: {},
    updateFormData: mockUpdateFormData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render availability options', () => {
    render(<AvailabilityStep {...defaultProps} />);
    
    expect(screen.getByText(/24\/7/i)).toBeInTheDocument();
    expect(screen.getByText(/nur ausserhalb/i)).toBeInTheDocument();
  });

  it('should update form data when option is selected', async () => {
    const user = userEvent.setup();
    render(<AvailabilityStep {...defaultProps} />);
    
    const option24_7 = screen.getByText(/24\/7/i).closest('div');
    if (option24_7) {
      await user.click(option24_7);
      expect(mockUpdateFormData).toHaveBeenCalledWith({ openingHours: '24/7' });
    }
  });

  it('should highlight selected option', () => {
    const props = {
      ...defaultProps,
      formData: { openingHours: '24/7' },
    };
    render(<AvailabilityStep {...props} />);
    
    const selectedOption = screen.getByText(/24\/7/i).closest('div');
    expect(selectedOption).toHaveClass('border-accent/50', 'bg-accent/10');
  });
});
