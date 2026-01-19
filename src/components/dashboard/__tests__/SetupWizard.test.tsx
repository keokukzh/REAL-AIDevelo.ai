import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupWizard } from '../SetupWizard';

// Mock hooks
const mockMutateAsync = vi.fn();
const mockUseUpdateAgentConfig = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
  isError: false,
  error: null,
}));

const mockUseDashboardOverview = vi.fn(() => ({
  data: {
    agent_config: {
      id: 'test-config-id',
      setup_state: 'needs_persona',
      persona_gender: null,
      persona_age_range: null,
      business_type: null,
      company_name: '',
      goals_json: [],
      services_json: [],
    },
  },
}));

vi.mock('../../hooks/useUpdateAgentConfig', () => ({
  useUpdateAgentConfig: () => mockUseUpdateAgentConfig(),
}));

vi.mock('../../hooks/useDashboardOverview', () => ({
  useDashboardOverview: () => mockUseDashboardOverview(),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Test wrapper with QueryClient
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('SetupWizard', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockUseUpdateAgentConfig.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_persona',
          persona_gender: null,
          persona_age_range: null,
          business_type: null,
          company_name: '',
          goals_json: [],
          services_json: [],
        },
      },
    });
  });

  it('should render persona step by default', () => {
    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(screen.getByText(/Schritt 1: Persona/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Geschlecht/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Altersbereich/i)).toBeInTheDocument();
  });

  it('should allow selecting persona gender', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const genderSelect = screen.getByLabelText(/Geschlecht/i);
    await user.selectOptions(genderSelect, 'male');

    expect(genderSelect).toHaveValue('male');
  });

  it('should allow selecting persona age range', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const ageSelect = screen.getByLabelText(/Altersbereich/i);
    await user.selectOptions(ageSelect, '35-45');

    expect(ageSelect).toHaveValue('35-45');
  });

  it('should navigate to business step when clicking Weiter on persona step', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const nextButton = screen.getByRole('button', { name: /Weiter/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        persona_gender: 'female',
        persona_age_range: '25-35',
        setup_state: 'needs_business',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Schritt 2: Business/i)).toBeInTheDocument();
    });
  });

  it('should navigate to services step when clicking Weiter on business step', async () => {
    const user = userEvent.setup();
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_business',
          persona_gender: 'female',
          persona_age_range: '25-35',
          business_type: null,
          company_name: '',
          goals_json: [],
          services_json: [],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should start on business step
    expect(screen.getByText(/Schritt 2: Business/i)).toBeInTheDocument();

    const companyInput = screen.getByPlaceholderText(/Mein Unternehmen/i);
    await user.type(companyInput, 'Test Company');

    const nextButton = screen.getByRole('button', { name: /Weiter/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        business_type: 'general',
        company_name: 'Test Company',
        setup_state: 'needs_phone',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Schritt 3: Services/i)).toBeInTheDocument();
    });
  });

  it('should allow adding and removing services', async () => {
    const user = userEvent.setup();
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_phone',
          persona_gender: 'female',
          persona_age_range: '25-35',
          business_type: 'general',
          company_name: 'Test Company',
          goals_json: [],
          services_json: [],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should start on services step
    expect(screen.getByText(/Schritt 3: Services/i)).toBeInTheDocument();

    const serviceNameInput = screen.getByPlaceholderText(/Service Name/i);
    const durationInput = screen.getByPlaceholderText(/Dauer/i);
    const addButton = screen.getByRole('button', { name: /Hinzufügen/i });

    await user.type(serviceNameInput, 'Haircut');
    await user.clear(durationInput);
    await user.type(durationInput, '45');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Haircut \(45 Min\)/i)).toBeInTheDocument();
    });

    // Remove service
    const removeButtons = screen.getAllByRole('button', { name: /Entfernen/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Haircut/i)).not.toBeInTheDocument();
    });
  });

  it('should allow adding and removing goals', async () => {
    const user = userEvent.setup();
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_calendar',
          persona_gender: 'female',
          persona_age_range: '25-35',
          business_type: 'general',
          company_name: 'Test Company',
          goals_json: [],
          services_json: [{ name: 'Service 1', durationMin: 30 }],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should start on goals step (services already set)
    expect(screen.getByText(/Schritt 4: Ziele/i)).toBeInTheDocument();

    const goalInput = screen.getByPlaceholderText(/Ziel hinzufügen/i);
    const addButton = screen.getByRole('button', { name: /Hinzufügen/i });

    await user.type(goalInput, 'Termine buchen');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Termine buchen/i)).toBeInTheDocument();
    });

    // Remove goal
    const removeButtons = screen.getAllByRole('button', { name: /Entfernen/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Termine buchen/i)).not.toBeInTheDocument();
    });
  });

  it('should call onComplete when finishing confirm step', async () => {
    const user = userEvent.setup();
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_calendar',
          persona_gender: 'female',
          persona_age_range: '25-35',
          business_type: 'general',
          company_name: 'Test Company',
          goals_json: ['Goal 1'],
          services_json: [{ name: 'Service 1', durationMin: 30 }],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Navigate to confirm step
    const nextButton = screen.getByRole('button', { name: /Weiter/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Schritt 5: Bestätigung/i)).toBeInTheDocument();
    });

    // Complete wizard
    const finishButton = screen.getByRole('button', { name: /Abschließen/i });
    await user.click(finishButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        setup_state: 'ready',
      });
    });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('should handle back navigation correctly', async () => {
    const user = userEvent.setup();
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_business',
          persona_gender: 'female',
          persona_age_range: '25-35',
          business_type: null,
          company_name: '',
          goals_json: [],
          services_json: [],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should start on business step
    expect(screen.getByText(/Schritt 2: Business/i)).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /Zurück/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Schritt 1: Persona/i)).toBeInTheDocument();
    });
  });

  it('should disable back button on first step', () => {
    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const backButton = screen.getByRole('button', { name: /Zurück/i });
    expect(backButton).toBeDisabled();
  });

  it('should show loading state when mutation is pending', () => {
    mockUseUpdateAgentConfig.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should show loading spinner
    expect(screen.queryByText(/Schritt 1: Persona/i)).not.toBeInTheDocument();
  });

  it('should display error message when mutation fails', async () => {
    mockUseUpdateAgentConfig.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: true,
      error: { message: 'Test error', userFriendlyMessage: 'User-friendly error' },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Speichern/i)).toBeInTheDocument();
      expect(screen.getByText(/User-friendly error/i)).toBeInTheDocument();
    });
  });

  it('should not advance step when mutation fails', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Save failed'));

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    const nextButton = screen.getByRole('button', { name: /Weiter/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    // Should still be on persona step
    expect(screen.getByText(/Schritt 1: Persona/i)).toBeInTheDocument();
  });

  it('should sync form data from overview when it loads', () => {
    mockUseDashboardOverview.mockReturnValue({
      data: {
        agent_config: {
          id: 'test-config-id',
          setup_state: 'needs_business',
          persona_gender: 'male',
          persona_age_range: '35-45',
          business_type: 'salon',
          company_name: 'Existing Company',
          goals_json: ['Existing Goal'],
          services_json: [{ name: 'Existing Service', durationMin: 60 }],
        },
      },
    });

    render(
      <TestWrapper>
        <SetupWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Should show business step with existing data
    expect(screen.getByText(/Schritt 2: Business/i)).toBeInTheDocument();
    const companyInput = screen.getByPlaceholderText(/Mein Unternehmen/i);
    expect(companyInput).toHaveValue('Existing Company');
  });
});
