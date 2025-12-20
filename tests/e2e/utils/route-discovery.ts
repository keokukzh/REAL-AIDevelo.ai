import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Route information for audit testing
 */
export interface RouteInfo {
  path: string;
  requiresAuth: boolean;
  group: 'public' | 'dashboard' | 'legal' | 'auth' | 'callback';
  isDynamic?: boolean;
}

/**
 * Discover all routes from navigation config and sitemap
 */
export function discoverRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Static public routes
  const publicRoutes: RouteInfo[] = [
    { path: '/', requiresAuth: false, group: 'public' },
    { path: '/webdesign', requiresAuth: false, group: 'public' },
    { path: '/enterprise', requiresAuth: false, group: 'public' },
    { path: '/impressum', requiresAuth: false, group: 'legal' },
    { path: '/datenschutz', requiresAuth: false, group: 'legal' },
    { path: '/agb', requiresAuth: false, group: 'legal' },
    { path: '/login', requiresAuth: false, group: 'auth' },
    { path: '/onboarding', requiresAuth: false, group: 'public' },
    { path: '/checkout', requiresAuth: false, group: 'public' },
    { path: '/payment-success', requiresAuth: false, group: 'public' },
  ];

  // Dashboard routes (require auth)
  const dashboardRoutes: RouteInfo[] = [
    { path: '/dashboard', requiresAuth: true, group: 'dashboard' },
    { path: '/calls', requiresAuth: true, group: 'dashboard' },
    { path: '/analytics', requiresAuth: true, group: 'dashboard' },
    { path: '/knowledge-base', requiresAuth: true, group: 'dashboard' },
    { path: '/dashboard/calendar', requiresAuth: true, group: 'dashboard' },
    { path: '/dashboard/settings', requiresAuth: true, group: 'dashboard' },
    { path: '/voice-edit', requiresAuth: true, group: 'dashboard' },
  ];

  // Dynamic routes (will be skipped or use seed data)
  const dynamicRoutes: RouteInfo[] = [
    { path: '/dashboard/agents/:id', requiresAuth: true, group: 'dashboard', isDynamic: true },
    { path: '/dashboard/agents/:id/edit', requiresAuth: true, group: 'dashboard', isDynamic: true },
    { path: '/calendar/:provider/callback', requiresAuth: true, group: 'callback', isDynamic: true },
    { path: '/auth/callback', requiresAuth: false, group: 'callback' },
  ];

  // Combine all routes
  routes.push(...publicRoutes, ...dashboardRoutes, ...dynamicRoutes);

  // Try to read sitemap.xml for additional routes
  try {
    const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
    const sitemapContent = readFileSync(sitemapPath, 'utf-8');
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
    
    if (urlMatches) {
      urlMatches.forEach(match => {
        const url = match.replace(/<\/?loc>/g, '').trim();
        // Extract path from full URL
        try {
          const urlObj = new URL(url);
          const path = urlObj.pathname;
          
          // Only add if not already in routes
          if (!routes.some(r => r.path === path)) {
            routes.push({
              path,
              requiresAuth: false,
              group: 'public',
            });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      });
    }
  } catch (e) {
    // Sitemap not found or unreadable, continue with static routes
  }

  return routes;
}

/**
 * Get routes that require authentication
 */
export function getAuthRequiredRoutes(): RouteInfo[] {
  return discoverRoutes().filter(r => r.requiresAuth && !r.isDynamic);
}

/**
 * Get public routes (no auth required)
 */
export function getPublicRoutes(): RouteInfo[] {
  return discoverRoutes().filter(r => !r.requiresAuth && !r.isDynamic);
}
