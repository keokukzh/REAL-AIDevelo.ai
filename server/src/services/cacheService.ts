import { config } from '../config/env';

// Optional Redis import - graceful degradation if not installed
let Redis: any = null;
try {
  Redis = require('ioredis');
} catch (e) {
  // Redis not installed - will use in-memory cache fallback
}

/**
 * Cache Service
 * Provides caching layer with Redis (if available) or in-memory fallback
 */
export class CacheService {
  private redis: any = null;
  private memoryCache: Map<string, { value: unknown; expiry: number }> = new Map();
  private isRedisAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize cache (Redis if available, otherwise in-memory)
   */
  private initialize(): void {
    if (Redis && config.redisUrl) {
      try {
        this.redis = new Redis(config.redisUrl, {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        this.redis.on('error', (err: Error) => {
          console.warn('[CacheService] Redis error:', err.message);
          this.isRedisAvailable = false;
        });

        this.redis.on('connect', () => {
          console.log('[CacheService] ✅ Redis connected');
          this.isRedisAvailable = true;
        });

        this.redis.on('ready', () => {
          console.log('[CacheService] ✅ Redis ready');
          this.isRedisAvailable = true;
        });

        // Try to connect (non-blocking)
        this.redis.connect().catch((err: Error) => {
          console.warn('[CacheService] ⚠️  Redis connection failed, using in-memory cache:', err.message);
          this.isRedisAvailable = false;
        });
      } catch (err) {
        console.warn('[CacheService] ⚠️  Redis initialization failed, using in-memory cache:', (err as Error).message);
        this.isRedisAvailable = false;
      }
    } else {
      console.log('[CacheService] ℹ️  Redis not configured, using in-memory cache');
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } catch (err) {
        console.warn('[CacheService] Redis get error:', (err as Error).message);
        // Fallback to memory cache
        return this.getFromMemory<T>(key);
      }
    }

    return this.getFromMemory<T>(key);
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redis) {
      try {
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        return;
      } catch (err) {
        console.warn('[CacheService] Redis set error:', (err as Error).message);
        // Fallback to memory cache
        this.setInMemory(key, value, ttlSeconds);
        return;
      }
    }

    this.setInMemory(key, value, ttlSeconds);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
      } catch (err) {
        console.warn('[CacheService] Redis delete error:', (err as Error).message);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Invalidate cache by pattern (supports wildcards)
   */
  async invalidate(pattern: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err) {
        console.warn('[CacheService] Redis invalidate error:', (err as Error).message);
      }
    }

    // In-memory pattern matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (err) {
        console.warn('[CacheService] Redis clear error:', (err as Error).message);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Get value from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiry
    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in memory cache
   */
  private setInMemory(key: string, value: unknown, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
    this.memoryCache.set(key, { value, expiry });

    // Clean up expired entries periodically (every 1000 operations)
    if (this.memoryCache.size % 1000 === 0) {
      this.cleanupMemoryCache();
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry > 0 && now > entry.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (err) {
        console.warn('[CacheService] Redis close error:', (err as Error).message);
      }
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
  agentConfig: (locationId: string) => `agent:config:${locationId}`,
  user: (userId: string) => `user:${userId}`,
  org: (orgId: string) => `org:${orgId}`,
  location: (locationId: string) => `location:${locationId}`,
  calendarAvailability: (locationId: string, date: string) => 
    `calendar:availability:${locationId}:${date}`,
  elevenLabsVoices: (locale?: string) => 
    locale ? `elevenlabs:voices:${locale}` : 'elevenlabs:voices:all',
  
  // Tag-based invalidation patterns
  agentConfigByOrg: (orgId: string) => `agent:config:org:${orgId}:*`,
  locationByOrg: (orgId: string) => `location:org:${orgId}:*`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  agentConfig: 5 * 60,        // 5 minutes
  user: 10 * 60,              // 10 minutes
  org: 10 * 60,               // 10 minutes
  location: 10 * 60,          // 10 minutes
  calendarAvailability: 60,  // 1 minute
  elevenLabsVoices: 60 * 60,  // 1 hour
};
