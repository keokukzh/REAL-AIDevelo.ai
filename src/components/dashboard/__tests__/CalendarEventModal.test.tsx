import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarEventModal } from '../CalendarEventModal';
import { CalendarEvent } from '../../../hooks/useCalendarEvents';

// Mock useCalendarEvents hook
const mockCreateEventAsync = vi.fn();
const mockUpdateEventAsync = vi.fn();
const mockDeleteEventAsync = vi.fn();

const mockUseCalendarEvents = vi.fn(() => ({
  createEventAsync: mockCreateEventAsync,
  updateEventAsync: mockUpdateEventAsync,
  deleteEventAsync: mockDeleteEventAsync,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  events: [],
  isLoading: false,
}));

vi.mock('../../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

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

describe('CalendarEventModal', () => {
  const mockOnClose = vi.fn();
  const mockLocationId = 'test-location-id';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateEventAsync.mockResolvedValue({});
    mockUpdateEventAsync.mockResolvedValue({});
    mockDeleteEventAsync.mockResolvedValue({});
    mockConfirm.mockReturnValue(true);
    mockUseCalendarEvents.mockReturnValue({
      createEventAsync: mockCreateEventAsync,
      updateEventAsync: mockUpdateEventAsync,
      deleteEventAsync: mockDeleteEventAsync,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      events: [],
      isLoading: false,
    });
  });

  it('should render create mode when no event is provided', () => {
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Termin erstellen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Titel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ende/i)).toBeInTheDocument();
  });

  it('should render edit mode when event is provided', () => {
    const mockEvent: CalendarEvent = {
      id: 'event-1',
      calendarId: 'calendar-1',
      summary: 'Test Event',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
      description: 'Test description',
      location: 'Test location',
      attendees: [{ email: 'test@example.com' }],
    };

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
          event={mockEvent}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Termin bearbeiten/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test location')).toBeInTheDocument();
  });

  it('should initialize form with initialSlot when provided', () => {
    const initialSlot = {
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    };

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
          initialSlot={initialSlot}
        />
      </TestWrapper>
    );

    // Check that start and end inputs are populated
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);
    
    expect(startInput).toHaveValue('2024-01-15T10:00');
    expect(endInput).toHaveValue('2024-01-15T11:00');
  });

  it('should validate required fields before saving', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Bitte fülle alle Pflichtfelder aus/i)).toBeInTheDocument();
    });

    expect(mockCreateEventAsync).not.toHaveBeenCalled();
  });

  it('should create event when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);

    await user.type(summaryInput, 'New Event');
    await user.type(startInput, '2024-01-15T10:00');
    await user.type(endInput, '2024-01-15T11:00');

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateEventAsync).toHaveBeenCalledWith({
        summary: 'New Event',
        start: expect.stringContaining('2024-01-15'),
        end: expect.stringContaining('2024-01-15'),
        description: undefined,
        attendees: undefined,
        location: undefined,
        timezone: 'Europe/Zurich',
      });
    });
  });

  it('should update event when in edit mode', async () => {
    const user = userEvent.setup();
    const mockEvent: CalendarEvent = {
      id: 'event-1',
      calendarId: 'calendar-1',
      summary: 'Original Event',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    };

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
          event={mockEvent}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    await user.clear(summaryInput);
    await user.type(summaryInput, 'Updated Event');

    const saveButton = screen.getByRole('button', { name: /Termin aktualisieren/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateEventAsync).toHaveBeenCalledWith({
        eventId: 'event-1',
        summary: 'Updated Event',
        start: expect.any(String),
        end: expect.any(String),
        description: undefined,
        attendees: undefined,
        location: undefined,
        timezone: 'Europe/Zurich',
      });
    });
  });

  it('should delete event when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockEvent: CalendarEvent = {
      id: 'event-1',
      calendarId: 'calendar-1',
      summary: 'Event to Delete',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    };

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
          event={mockEvent}
        />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: /Löschen/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteEventAsync).toHaveBeenCalledWith({
        eventId: 'event-1',
        calendarId: 'calendar-1',
      });
    });
  });

  it('should not delete event if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);
    
    const mockEvent: CalendarEvent = {
      id: 'event-1',
      calendarId: 'calendar-1',
      summary: 'Event to Delete',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    };

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
          event={mockEvent}
        />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: /Löschen/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });

    expect(mockDeleteEventAsync).not.toHaveBeenCalled();
  });

  it('should show success message after creating event', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);

    await user.type(summaryInput, 'New Event');
    await user.type(startInput, '2024-01-15T10:00');
    await user.type(endInput, '2024-01-15T11:00');

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Termin erstellt/i)).toBeInTheDocument();
      expect(screen.getByText(/Der Termin wurde erfolgreich erstellt/i)).toBeInTheDocument();
    });
  });

  it('should show error message when save fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Save failed');
    (error as any).userFriendlyMessage = 'User-friendly error';
    mockCreateEventAsync.mockRejectedValue(error);

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);

    await user.type(summaryInput, 'New Event');
    await user.type(startInput, '2024-01-15T10:00');
    await user.type(endInput, '2024-01-15T11:00');

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Fehler/i)).toBeInTheDocument();
      expect(screen.getByText(/User-friendly error/i)).toBeInTheDocument();
    });
  });

  it('should disable save button when required fields are empty', () => {
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    expect(saveButton).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    mockUseCalendarEvents.mockReturnValue({
      createEventAsync: mockCreateEventAsync,
      updateEventAsync: mockUpdateEventAsync,
      deleteEventAsync: mockDeleteEventAsync,
      isCreating: true,
      isUpdating: false,
      isDeleting: false,
      events: [],
      isLoading: false,
    });

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    expect(cancelButton).toBeDisabled();
  });

  it('should allow adding optional fields', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);
    const descriptionInput = screen.getByLabelText(/Beschreibung/i);
    const attendeeInput = screen.getByLabelText(/Teilnehmer E-Mail/i);
    const locationInput = screen.getByLabelText(/Ort/i);

    await user.type(summaryInput, 'Event with Details');
    await user.type(startInput, '2024-01-15T10:00');
    await user.type(endInput, '2024-01-15T11:00');
    await user.type(descriptionInput, 'Event description');
    await user.type(attendeeInput, 'attendee@example.com');
    await user.type(locationInput, 'Office');

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateEventAsync).toHaveBeenCalledWith({
        summary: 'Event with Details',
        start: expect.any(String),
        end: expect.any(String),
        description: 'Event description',
        attendees: [{ email: 'attendee@example.com' }],
        location: 'Office',
        timezone: 'Europe/Zurich',
      });
    });
  });

  it('should close modal after successful save', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    const summaryInput = screen.getByLabelText(/Titel/i);
    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/Ende/i);

    await user.type(summaryInput, 'New Event');
    await user.type(startInput, '2024-01-15T10:00');
    await user.type(endInput, '2024-01-15T11:00');

    const saveButton = screen.getByRole('button', { name: /Termin erstellen/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateEventAsync).toHaveBeenCalled();
    });

    // Fast-forward time to trigger setTimeout
    vi.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should not render delete button in create mode', () => {
    render(
      <TestWrapper>
        <CalendarEventModal
          isOpen={true}
          onClose={mockOnClose}
          locationId={mockLocationId}
        />
      </TestWrapper>
    );

    expect(screen.queryByRole('button', { name: /Löschen/i })).not.toBeInTheDocument();
  });
});
