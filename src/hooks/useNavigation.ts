import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { NavigationService } from '../services/navigationService';

/**
 * Hook to provide NavigationService instance
 * Creates a new service instance when navigate function changes
 */
export const useNavigation = (): NavigationService => {
  const navigate = useNavigate();

  const navigationService = useMemo(() => {
    return new NavigationService(navigate);
  }, [navigate]);

  return navigationService;
};

/**
 * Hook that provides both navigation service and current location
 * Useful when you need both navigation and location info
 */
export const useNavigationWithLocation = (): {
  nav: NavigationService;
  location: ReturnType<typeof useLocation>;
} => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationService = useMemo(() => {
    return new NavigationService(navigate);
  }, [navigate]);

  return {
    nav: navigationService,
    location,
  };
};
