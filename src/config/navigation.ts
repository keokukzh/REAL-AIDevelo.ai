/**
 * Centralized navigation configuration
 * Single source of truth for all routes and navigation items
 */

export const ROUTES = {
  HOME: '/',
  WEBDESIGN: '/webdesign',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  CHECKOUT: '/checkout',
  PAYMENT_SUCCESS: '/payment-success',
  ENTERPRISE: '/enterprise',
  VOICE_EDIT: '/voice-edit',
  CALLS: '/calls',
  ANALYTICS: '/analytics',
  KNOWLEDGE_BASE: '/knowledge-base',
  CALENDAR: '/dashboard/calendar',
  SETTINGS: '/dashboard/settings',
  AGENT_DETAILS: (id: string) => `/dashboard/agents/${id}`,
  AGENT_EDIT: (id: string) => `/dashboard/agents/${id}/edit`,
  CALENDAR_CALLBACK: (provider: string) => `/calendar/${provider}/callback`,
  AUTH_CALLBACK: '/auth/callback',
  IMPRESSUM: '/impressum',
  DATENSCHUTZ: '/datenschutz',
  AGB: '/agb',
} as const;

/**
 * Main navigation items for cross-section navigation
 * Used in Navbar, Dashboard header, and SideNav
 */
export const NAVIGATION_ITEMS = {
  VOICE_AGENTS: {
    label: 'Voice Agents',
    path: ROUTES.HOME,
    icon: null,
    ariaLabel: 'Zur Voice Agents Hauptseite navigieren',
  },
  WEBDESIGN: {
    label: 'Webdesign',
    path: ROUTES.WEBDESIGN,
    icon: null,
    ariaLabel: 'Zur Webdesign Seite navigieren',
  },
  DASHBOARD: {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'studio',
    ariaLabel: 'Zum Dashboard navigieren',
    requiresAuth: true,
  },
} as const;

/**
 * Section links for Voice Agents landing page
 * Used in Navbar dropdown
 */
export const SECTION_LINKS = [
  { name: 'Funktionen', href: '#features' },
  { name: 'Branchen', href: '#industries' },
  { name: 'Demo', href: '#demo' },
  { name: 'Ablauf', href: '#how-it-works' },
  { name: 'Preise', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
] as const;

/**
 * Type for navigation item
 */
export type NavigationItem = typeof NAVIGATION_ITEMS[keyof typeof NAVIGATION_ITEMS];

/**
 * Type for route paths
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Route metadata for breadcrumbs, titles, and navigation context
 */
export interface RouteMeta {
  title: string;
  breadcrumb: string;
  group: 'public' | 'dashboard' | 'legal' | 'auth' | 'callback';
  parent?: string | null;
  requiresAuth?: boolean;
}

/**
 * Route metadata configuration
 * Defines hierarchy and context for all routes
 */
export const ROUTE_META: Record<string, RouteMeta> = {
  [ROUTES.HOME]: {
    title: 'Voice Agents',
    breadcrumb: 'Voice Agents',
    group: 'public',
    parent: null,
  },
  [ROUTES.WEBDESIGN]: {
    title: 'Webdesign',
    breadcrumb: 'Webdesign',
    group: 'public',
    parent: null,
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    breadcrumb: 'Dashboard',
    group: 'dashboard',
    parent: null,
    requiresAuth: true,
  },
  [ROUTES.LOGIN]: {
    title: 'Login',
    breadcrumb: 'Login',
    group: 'auth',
    parent: null,
  },
  [ROUTES.ONBOARDING]: {
    title: 'Onboarding',
    breadcrumb: 'Onboarding',
    group: 'public',
    parent: null,
  },
  [ROUTES.CHECKOUT]: {
    title: 'Checkout',
    breadcrumb: 'Checkout',
    group: 'public',
    parent: null,
  },
  [ROUTES.PAYMENT_SUCCESS]: {
    title: 'Zahlung erfolgreich',
    breadcrumb: 'Zahlung erfolgreich',
    group: 'public',
    parent: null,
  },
  [ROUTES.ENTERPRISE]: {
    title: 'Enterprise Kontakt',
    breadcrumb: 'Enterprise',
    group: 'public',
    parent: null,
  },
  [ROUTES.VOICE_EDIT]: {
    title: 'Voice bearbeiten',
    breadcrumb: 'Voice bearbeiten',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.CALLS]: {
    title: 'Anrufprotokoll',
    breadcrumb: 'Anrufprotokoll',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.ANALYTICS]: {
    title: 'Analytics',
    breadcrumb: 'Analytics',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.KNOWLEDGE_BASE]: {
    title: 'Knowledge Base',
    breadcrumb: 'Knowledge Base',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.CALENDAR]: {
    title: 'Kalender',
    breadcrumb: 'Kalender',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.SETTINGS]: {
    title: 'Einstellungen',
    breadcrumb: 'Einstellungen',
    group: 'dashboard',
    parent: ROUTES.DASHBOARD,
    requiresAuth: true,
  },
  [ROUTES.AUTH_CALLBACK]: {
    title: 'Authentifizierung',
    breadcrumb: 'Authentifizierung',
    group: 'callback',
    parent: null,
  },
  [ROUTES.IMPRESSUM]: {
    title: 'Impressum',
    breadcrumb: 'Impressum',
    group: 'legal',
    parent: null,
  },
  [ROUTES.DATENSCHUTZ]: {
    title: 'Datenschutz',
    breadcrumb: 'Datenschutz',
    group: 'legal',
    parent: null,
  },
  [ROUTES.AGB]: {
    title: 'AGB',
    breadcrumb: 'AGB',
    group: 'legal',
    parent: null,
  },
};

/**
 * Get route metadata for a given path
 * @param path Route path
 * @returns Route metadata or null if not found
 */
export const getRouteMeta = (path: string): RouteMeta | null => {
  // Handle dynamic routes (e.g., /dashboard/agents/:id)
  if (path.startsWith('/dashboard/agents/')) {
    const parts = path.split('/');
    if (parts.length === 4 && parts[3] !== 'edit') {
      return {
        title: 'Agent Details',
        breadcrumb: 'Agent Details',
        group: 'dashboard',
        parent: ROUTES.DASHBOARD,
        requiresAuth: true,
      };
    } else if (parts.length === 5 && parts[4] === 'edit') {
      return {
        title: 'Agent bearbeiten',
        breadcrumb: 'Agent bearbeiten',
        group: 'dashboard',
        parent: ROUTES.AGENT_DETAILS(parts[3]),
        requiresAuth: true,
      };
    }
  }
  
  // Handle calendar callback routes
  if (path.startsWith('/calendar/') && path.includes('/callback')) {
    return {
      title: 'Kalender Verbindung',
      breadcrumb: 'Kalender Verbindung',
      group: 'callback',
      parent: ROUTES.CALENDAR,
      requiresAuth: true,
    };
  }
  
  return ROUTE_META[path] || null;
};
