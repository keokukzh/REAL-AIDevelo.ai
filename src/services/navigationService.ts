import { NavigateFunction } from 'react-router-dom';
import { ROUTES, getRouteMeta, ROUTE_META, type RouteMeta } from '../config/navigation';

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
    globalThis.window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    globalThis.history.back();
  }

  /**
   * Navigate forward in history
   */
  goForward(): void {
    globalThis.history.forward();
  }

  /**
   * Get breadcrumbs for a given path
   * @param path Current route path
   * @returns Array of breadcrumb items
   */
  getBreadcrumbs(path: string): Array<{ label: string; path: string }> {
    const breadcrumbs: Array<{ label: string; path: string }> = [];
    const meta = getRouteMeta(path);
    
    if (!meta) {
      return breadcrumbs;
    }

    // Build breadcrumb chain by following parent links
    let currentMeta: RouteMeta | null = meta;
    const visited = new Set<string>();
    
    while (currentMeta && !visited.has(currentMeta.breadcrumb)) {
      visited.add(currentMeta.breadcrumb);
      
      // Find the path for this meta
      const currentPath = this.findPathForMeta(currentMeta);
      if (currentPath) {
        breadcrumbs.unshift({
          label: currentMeta.breadcrumb,
          path: currentPath,
        });
      }
      
      // Move to parent
      if (currentMeta.parent) {
        currentMeta = getRouteMeta(currentMeta.parent);
      } else {
        currentMeta = null;
      }
    }
    
    return breadcrumbs;
  }

  /**
   * Find the path for a given route meta
   * @param meta Route metadata
   * @returns Route path or null
   */
  private findPathForMeta(meta: RouteMeta): string | null {
    for (const [path, routeMeta] of Object.entries(ROUTE_META)) {
      if (
        routeMeta.breadcrumb === meta.breadcrumb &&
        routeMeta.group === meta.group &&
        routeMeta.title === meta.title
      ) {
        return path;
      }
    }
    return null;
  }

  /**
   * Get previous route based on breadcrumb hierarchy
   * @param currentPath Current route path
   * @returns Previous route path or null
   */
  getPreviousRoute(currentPath: string): string | null {
    const meta = getRouteMeta(currentPath);
    if (meta?.parent) {
      return meta.parent;
    }
    
    // Fallback: try to determine parent from path structure
    if (currentPath.startsWith('/dashboard/')) {
      return ROUTES.DASHBOARD;
    }
    
    return null;
  }

  /**
   * Check if a URL is an external link
   * @param url URL to check
   * @returns True if external, false otherwise
   */
  isExternalLink(url: string): boolean {
    if (!url) return false;
    
    // Check for protocol (http://, https://, mailto:, tel:, etc.)
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) {
      return true;
    }
    
    // Check for absolute path starting with //
    if (url.startsWith('//')) {
      return true;
    }
    
    return false;
  }
}
