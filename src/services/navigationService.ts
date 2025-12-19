import { NavigateFunction } from 'react-router-dom';
import { ROUTES } from '../config/navigation';

/**
 * Navigation service for centralized navigation logic
 * Provides consistent navigation behavior including scroll management
 */
export class NavigationService {
  constructor(private readonly navigate: NavigateFunction) {}

  /**
   * Navigate to home page (Voice Agents landing page)
   * @param scrollToTop Whether to scroll to top after navigation
   */
  goToHome(scrollToTop = true): void {
    this.navigate(ROUTES.HOME);
    if (scrollToTop) {
      this.scrollToTop();
    }
  }

  /**
   * Navigate to Webdesign page
   */
  goToWebdesign(): void {
    this.navigate(ROUTES.WEBDESIGN);
  }

  /**
   * Navigate to Dashboard
   */
  goToDashboard(): void {
    this.navigate(ROUTES.DASHBOARD);
  }

  /**
   * Navigate to Login page
   */
  goToLogin(): void {
    this.navigate(ROUTES.LOGIN);
  }

  /**
   * Navigate to Onboarding page
   */
  goToOnboarding(): void {
    this.navigate(ROUTES.ONBOARDING);
  }

  /**
   * Navigate to a specific route
   * @param path Route path to navigate to
   * @param scrollToTop Whether to scroll to top after navigation
   */
  goTo(path: string, scrollToTop = false): void {
    this.navigate(path);
    if (scrollToTop) {
      this.scrollToTop();
    }
  }

  /**
   * Navigate to a section on the current page or home page
   * @param href Anchor hash (e.g., '#features')
   * @param currentPath Current pathname
   */
  goToSection(href: string, currentPath: string): void {
    // Safe anchor validation: only allow safe anchor IDs (not Supabase tokens)
    const SAFE_ANCHOR_REGEX = /^#[A-Za-z][A-Za-z0-9_-]*$/;
    if (href !== '#' && !SAFE_ANCHOR_REGEX.test(href)) {
      // Ignore unsafe hashes (e.g., #access_token=..., #code=...)
      return;
    }

    // If we are not on the landing page, navigate there with the hash
    if (currentPath !== ROUTES.HOME) {
      this.navigate(ROUTES.HOME, { state: { scrollTarget: href } });
      return;
    }

    // Scroll to section on current page
    const section = document.querySelector(href);
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else if (href === '#') {
      this.scrollToTop();
    }
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigate forward in history
   */
  goForward(): void {
    window.history.forward();
  }
}
