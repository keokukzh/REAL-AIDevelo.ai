import { useState, useCallback } from 'react';
import { CallLog } from './useCallLogs.js';
import { CalendarEvent } from './useCalendarEvents.js';

/**
 * Custom hook for managing dashboard modal states
 * Consolidates modal state management from DashboardPage
 */
export const useDashboardModals = () => {
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [isAgentTestOpen, setIsAgentTestOpen] = useState(false);
  const [isPhoneWizardOpen, setIsPhoneWizardOpen] = useState(false);
  const [isWebhookStatusOpen, setIsWebhookStatusOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | undefined>(
    undefined,
  );

  const openCallDetails = useCallback((call: CallLog) => {
    setSelectedCall(call);
    setIsCallDetailsOpen(true);
  }, []);

  const closeCallDetails = useCallback(() => {
    setIsCallDetailsOpen(false);
    setSelectedCall(null);
  }, []);

  const openAgentTest = useCallback(() => {
    setIsAgentTestOpen(true);
  }, []);

  const closeAgentTest = useCallback(() => {
    setIsAgentTestOpen(false);
  }, []);

  const openPhoneWizard = useCallback(() => {
    setIsPhoneWizardOpen(true);
  }, []);

  const closePhoneWizard = useCallback(() => {
    setIsPhoneWizardOpen(false);
  }, []);

  const openWebhookStatus = useCallback(() => {
    setIsWebhookStatusOpen(true);
  }, []);

  const closeWebhookStatus = useCallback(() => {
    setIsWebhookStatusOpen(false);
  }, []);

  const openAvailability = useCallback(() => {
    setIsAvailabilityModalOpen(true);
  }, []);

  const closeAvailability = useCallback(() => {
    setIsAvailabilityModalOpen(false);
  }, []);

  const openCreateAppointment = useCallback(
    (event?: CalendarEvent | null, slot?: { start: string; end: string }) => {
      setSelectedEvent(event || null);
      setSelectedSlot(slot);
      setIsCreateAppointmentModalOpen(true);
    },
    [],
  );

  const closeCreateAppointment = useCallback(() => {
    setIsCreateAppointmentModalOpen(false);
    setSelectedSlot(undefined);
    setSelectedEvent(null);
  }, []);

  const openNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(true);
  }, []);

  const closeNotificationCenter = useCallback(() => {
    setIsNotificationCenterOpen(false);
  }, []);

  return {
    // Modal states
    isCallDetailsOpen,
    isAgentTestOpen,
    isPhoneWizardOpen,
    isWebhookStatusOpen,
    isAvailabilityModalOpen,
    isCreateAppointmentModalOpen,
    isNotificationCenterOpen,
    // Selected items
    selectedCall,
    selectedEvent,
    selectedSlot,
    // Actions
    openCallDetails,
    closeCallDetails,
    openAgentTest,
    closeAgentTest,
    openPhoneWizard,
    closePhoneWizard,
    openWebhookStatus,
    closeWebhookStatus,
    openAvailability,
    closeAvailability,
    openCreateAppointment,
    closeCreateAppointment,
    openNotificationCenter,
    closeNotificationCenter,
    // Setters for direct manipulation when needed
    setSelectedSlot,
    setSelectedEvent,
  };
};
