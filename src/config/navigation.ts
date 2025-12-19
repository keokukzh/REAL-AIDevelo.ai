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
