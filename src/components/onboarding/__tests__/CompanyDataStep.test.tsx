import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyDataStep } from '../CompanyDataStep';

describe('CompanyDataStep', () => {
  const mockUpdateFormData = vi.fn();
  const defaultProps = {
    formData: {},
    updateFormData: mockUpdateFormData,
    selectedTemplate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<CompanyDataStep {...defaultProps} />);
    
    expect(screen.getByLabelText(/firmenname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stadt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/branche/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument();
  });

  it('should update form data when company name changes', async () => {
    const user = userEvent.setup();
    render(<CompanyDataStep {...defaultProps} />);
    
    const companyNameInput = screen.getByLabelText(/firmenname/i);
    await user.type(companyNameInput, 'Test Company');
    
    expect(mockUpdateFormData).toHaveBeenCalledWith({ companyName: 'Test Company' });
  });

  it('should display selected template industry', () => {
    const props = {
      ...defaultProps,
      selectedTemplate: { industry: 'plumbing' },
    };
    render(<CompanyDataStep {...props} />);
    
    const industrySelect = screen.getByLabelText(/branche/i);
    expect(industrySelect).toHaveValue('plumbing');
  });

  it('should display existing form data', () => {
    const props = {
      ...defaultProps,
      formData: {
        companyName: 'Existing Company',
        email: 'test@example.com',
        city: 'Zürich',
      },
    };
    render(<CompanyDataStep {...props} />);
    
    expect(screen.getByDisplayValue('Existing Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Zürich')).toBeInTheDocument();
  });
});
