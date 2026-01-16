import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LayoutGrid } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { FullCalendarComponent } from '../components/Calendar/FullCalendar.js';
import { Button } from '../components/ui/Button.js';
import { ButtonLoader } from '../components/ui/LoadingSpinner.js';
import { toast } from '../components/ui/Toast.js';
import { apiClient } from '../services/apiClient.js';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post('/calendar/sync');
      if (response.data.success) {
        toast.success('Kalender erfolgreich synchronisiert');
        // The FullCalendar component handles its own refetch if it uses react-query
        // or we might need to trigger a refresh via state if necessary.
        // For now, we'll just reload the page or trigger a component update.
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      const errorMsg = error.userFriendlyMessage || 'Synchronisierung fehlgeschlagen';
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden h-[calc(100vh-64px)] lg:h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Kalender</h1>
            <p className="text-gray-400 mt-1">
              Verwalte deine Termine und sieh dir an, was dein Agent gebucht hat.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/calendar/integrations')}
              className="flex-1 md:flex-none bg-gray-900/50 border-gray-800 hover:bg-gray-800 text-gray-300 gap-2"
            >
              <LayoutGrid size={18} />
              Integrationen
            </Button>
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 md:flex-none bg-gray-900/50 border-gray-800 hover:bg-gray-800 text-gray-300 gap-2"
            >
              {isSyncing ? <ButtonLoader /> : <RefreshCw size={18} />}
              {isSyncing ? 'Synchronisieren...' : 'Synchronisieren'}
            </Button>
          </div>
        </div>

        {/* Calendar Card Wrapper */}
        <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-2 md:p-6 overflow-hidden flex flex-col shadow-2xl">
          <FullCalendarComponent />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
