import { supabaseAdmin } from './supabaseDb';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { NotFoundError, BadRequestError } from '../utils/errors';

/**
 * Organization Service
 * Manages multi-tenant organization and location operations
 */
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  business_type: string | null;
  timezone: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  supabase_user_id: string;
  email: string | null;
  created_at: string;
}

export class OrganizationService {
  /**
   * Get organization by ID (with caching)
   */
  static async getOrganization(orgId: string): Promise<Organization> {
    const cacheKey = CacheKeys.org(orgId);
    
    // Try cache first
    const cached = await cacheService.get<Organization>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Organization');
    }

    // Cache the result
    await cacheService.set(cacheKey, data, CacheTTL.org);

    return data;
  }

  /**
   * Get user by Supabase auth user ID (with caching)
   */
  static async getUserByAuthId(authUserId: string): Promise<User> {
    const cacheKey = CacheKeys.user(authUserId);
    
    // Try cache first
    const cached = await cacheService.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabase_user_id', authUserId)
      .single();

    if (error || !data) {
      throw new NotFoundError('User');
    }

    // Cache the result
    await cacheService.set(cacheKey, data, CacheTTL.user);

    return data;
  }

  /**
   * Get user's organization (with caching)
   */
  static async getUserOrganization(authUserId: string): Promise<Organization> {
    const user = await this.getUserByAuthId(authUserId);
    return this.getOrganization(user.org_id);
  }

  /**
   * Get location by ID (with caching)
   */
  static async getLocation(locationId: string): Promise<Location> {
    const cacheKey = CacheKeys.location(locationId);
    
    // Try cache first
    const cached = await cacheService.get<Location>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Location');
    }

    // Cache the result
    await cacheService.set(cacheKey, data, CacheTTL.location);

    return data;
  }

  /**
   * Get all locations for an organization
   */
  static async getOrganizationLocations(orgId: string): Promise<Location[]> {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestError(`Failed to fetch locations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new location
   */
  static async createLocation(
    orgId: string,
    name: string,
    timezone: string = 'Europe/Zurich',
    businessType?: string
  ): Promise<Location> {
    // Verify organization exists
    await this.getOrganization(orgId);

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert({
        org_id: orgId,
        name,
        timezone,
        business_type: businessType || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestError(`Failed to create location: ${error?.message || 'Unknown error'}`);
    }

    // Cache the new location
    await cacheService.set(CacheKeys.location(data.id), data, CacheTTL.location);

    // Invalidate org locations cache
    await cacheService.invalidate(CacheKeys.locationByOrg(orgId));

    return data;
  }

  /**
   * Update location
   */
  static async updateLocation(
    locationId: string,
    updates: Partial<Pick<Location, 'name' | 'business_type' | 'timezone'>>
  ): Promise<Location> {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestError(`Failed to update location: ${error?.message || 'Unknown error'}`);
    }

    // Update cache
    await cacheService.set(CacheKeys.location(locationId), data, CacheTTL.location);

    // Invalidate org locations cache
    if (data.org_id) {
      await cacheService.invalidate(CacheKeys.locationByOrg(data.org_id));
    }

    return data;
  }

  /**
   * Verify user has access to organization
   */
  static async verifyUserAccess(authUserId: string, orgId: string): Promise<boolean> {
    try {
      const user = await this.getUserByAuthId(authUserId);
      return user.org_id === orgId;
    } catch {
      return false;
    }
  }

  /**
   * Verify user has access to location
   */
  static async verifyLocationAccess(authUserId: string, locationId: string): Promise<boolean> {
    try {
      const user = await this.getUserByAuthId(authUserId);
      const location = await this.getLocation(locationId);
      return location.org_id === user.org_id;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate cache for organization and related entities
   */
  static async invalidateCache(orgId: string): Promise<void> {
    await cacheService.invalidate(CacheKeys.org(orgId));
    await cacheService.invalidate(CacheKeys.locationByOrg(orgId));
    await cacheService.invalidate(CacheKeys.agentConfigByOrg(orgId));
  }

  /**
   * Invalidate cache for user
   */
  static async invalidateUserCache(authUserId: string): Promise<void> {
    await cacheService.invalidate(CacheKeys.user(authUserId));
  }
}
