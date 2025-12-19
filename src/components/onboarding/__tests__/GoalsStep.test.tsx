import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsStep } from '../GoalsStep';

describe('GoalsStep', () => {
  const mockUpdateFormData = vi.fn();
  const defaultProps = {
    formData: {},
    updateFormData: mockUpdateFormData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all goal options', () => {
    render(<GoalsStep {...defaultProps} />);
    
    expect(screen.getByText(/terminbuchung/i)).toBeInTheDocument();
    expect(screen.getByText(/lead-qualifizierung/i)).toBeInTheDocument();
    expect(screen.getByText(/support/i)).toBeInTheDocument();
    expect(screen.getByText(/bestellannahme/i)).toBeInTheDocument();
  });

  it('should toggle goal selection', async () => {
    const user = userEvent.setup();
    render(<GoalsStep {...defaultProps} />);
    
    const goalOption = screen.getByText(/terminbuchung/i).closest('div');
    if (goalOption) {
      // First click - add goal
      await user.click(goalOption);
      expect(mockUpdateFormData).toHaveBeenCalledWith({
        goals: ['Terminbuchung & Kalender'],
      });

      // Second click - remove goal
      await user.click(goalOption);
      expect(mockUpdateFormData).toHaveBeenLastCalledWith({
        goals: [],
      });
    }
  });

  it('should render recording consent checkbox', () => {
    render(<GoalsStep {...defaultProps} />);
    
    expect(screen.getByLabelText(/anrufe aufzeichnen/i)).toBeInTheDocument();
  });

  it('should update recording consent', async () => {
    const user = userEvent.setup();
    render(<GoalsStep {...defaultProps} />);
    
    const checkbox = screen.getByLabelText(/anrufe aufzeichnen/i);
    await user.click(checkbox);
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({ recordingConsent: true });
  });
});
