import { cacheService, CacheKeys } from '../services/cacheService';

/**
 * Invalidate dashboard overview cache for a specific user
 * Call this when dashboard data changes (agent config, phone, calendar, calls)
 */
export async function invalidateDashboardCache(userId: string): Promise<void> {
  const cacheKey = CacheKeys.dashboardOverview(userId);
  await cacheService.delete(cacheKey);
}

/**
 * Invalidate dashboard overview cache for all users
 * Use sparingly - prefer user-specific invalidation
 */
export async function invalidateAllDashboardCaches(): Promise<void> {
  await cacheService.invalidate(CacheKeys.dashboardOverviewAll());
}
