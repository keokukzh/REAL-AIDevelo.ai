import { useAuthContext } from '../contexts/AuthContext';
import { useDashboardOverview } from './useDashboardOverview';

export const useAuth = () => useAuthContext();

export const useLocationId = (): string | null => {
  const { data: overview } = useDashboardOverview();
  return overview?.location?.id || null;
};

