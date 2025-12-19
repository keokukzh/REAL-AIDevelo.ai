import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationService } from '../navigationService';
import { ROUTES } from '../../config/navigation';

describe('NavigationService', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;
  let navService: NavigationService;

  beforeEach(() => {
    mockNavigate = vi.fn();
    navService = new NavigationService(mockNavigate);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  describe('goToHome', () => {
    it('should navigate to home route', () => {
      navService.goToHome();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.HOME);
    });

    it('should scroll to top by default', () => {
      navService.goToHome();
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should not scroll to top when scrollToTop is false', () => {
      navService.goToHome(false);
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.HOME);
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('goToWebdesign', () => {
    it('should navigate to webdesign route', () => {
      navService.goToWebdesign();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.WEBDESIGN);
    });
  });

  describe('goToDashboard', () => {
    it('should navigate to dashboard route', () => {
      navService.goToDashboard();
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    });
  });

  describe('goTo', () => {
    it('should navigate to specified path', () => {
      navService.goTo('/custom-path');
      expect(mockNavigate).toHaveBeenCalledWith('/custom-path');
    });

    it('should scroll to top when scrollToTop is true', () => {
      navService.goTo('/custom-path', true);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('goToSection', () => {
    beforeEach(() => {
      // Mock document.querySelector
      global.document.querySelector = vi.fn();
    });

    it('should navigate to home when not on home page', () => {
      const mockSection = {
        getBoundingClientRect: () => ({ top: 100 } as DOMRect),
      };
      vi.spyOn(document, 'querySelector').mockReturnValue(mockSection as Element);

      navService.goToSection('#features', '/webdesign');
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.HOME, { state: { scrollTarget: '#features' } });
    });

    it('should scroll to section when on home page', () => {
      const mockSection = {
        getBoundingClientRect: () => ({ top: 100 } as DOMRect),
      };
      vi.spyOn(document, 'querySelector').mockReturnValue(mockSection as Element);
      Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });

      navService.goToSection('#features', ROUTES.HOME);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('should ignore unsafe hash patterns', () => {
      navService.goToSection('#access_token=abc123', '/');
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('scrollToTop', () => {
    it('should scroll to top of page', () => {
      navService.scrollToTop();
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
