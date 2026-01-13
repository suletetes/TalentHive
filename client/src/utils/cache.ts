/**
 * Client-side caching utilities for API responses and performance optimization
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Default 5 minutes
  maxSize?: number; // Default 100 entries
  prefix?: string;
}

/**
 * In-memory cache with TTL support
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTtl: number;
  private prefix: string;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTtl = options.ttl || 5 * 60 * 1000; // 5 minutes
    this.prefix = options.prefix || 'cache';
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const fullKey = `${this.prefix}:${key}`;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const fullKey = `${this.prefix}:${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      key: fullKey,
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(fullKey, entry);
  }

  /**
   * Remove item from cache
   */
  delete(key: string): boolean {
    const fullKey = `${this.prefix}:${key}`;
    return this.cache.delete(fullKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: string[];
  } {
    const entries = Array.from(this.cache.keys());
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate rate
      entries,
    };
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * LocalStorage-based persistent cache
 */
export class PersistentCache {
  private prefix: string;
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'persistent_cache';
    this.defaultTtl = options.ttl || 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get item from persistent cache
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const item = localStorage.getItem(fullKey);

      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);

      // Check if expired
      if (Date.now() > entry.timestamp + entry.ttl) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('[PERSISTENT CACHE] Get error:', error);
      return null;
    }
  }

  /**
   * Set item in persistent cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTtl,
        key: fullKey,
      };

      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (error) {
      console.error('[PERSISTENT CACHE] Set error:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        this.cleanup();
        // Try again after cleanup
        try {
          localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTtl,
            key: `${this.prefix}:${key}`,
          }));
        } catch (retryError) {
          console.error('[PERSISTENT CACHE] Retry set error:', retryError);
        }
      }
    }
  }

  /**
   * Remove item from persistent cache
   */
  delete(key: string): void {
    const fullKey = `${this.prefix}:${key}`;
    localStorage.removeItem(fullKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry: CacheEntry = JSON.parse(item);
            if (now > entry.timestamp + entry.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleaned++;
    });

    return cleaned;
  }
}

// Global cache instances
export const memoryCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  prefix: 'api_cache',
});

export const persistentCache = new PersistentCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  prefix: 'api_persistent',
});

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user_profile:${id}`,
  project: (id: string) => `project:${id}`,
  projects: (filters?: any) => `projects:${JSON.stringify(filters || {})}`,
  proposal: (id: string) => `proposal:${id}`,
  proposals: (filters?: any) => `proposals:${JSON.stringify(filters || {})}`,
  contract: (id: string) => `contract:${id}`,
  contracts: (filters?: any) => `contracts:${JSON.stringify(filters || {})}`,
  notifications: (userId: string) => `notifications:${userId}`,
  unreadCount: (userId: string) => `unread_count:${userId}`,
  conversations: (userId: string) => `conversations:${userId}`,
};

/**
 * Cached API request wrapper
 */
export async function cachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    cache?: MemoryCache | PersistentCache;
    ttl?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const cache = options.cache || memoryCache;
  const { ttl, forceRefresh = false } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      console.log(`[CACHE] Hit: ${key}`);
      return cached;
    }
  }

  console.log(`[CACHE] Miss: ${key}`);

  // Make request and cache result
  try {
    const result = await requestFn();
    cache.set(key, result, ttl);
    return result;
  } catch (error) {
    console.error(`[CACHE] Request failed for key: ${key}`, error);
    throw error;
  }
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string, cache: MemoryCache | PersistentCache = memoryCache): number {
  let invalidated = 0;

  if (cache instanceof MemoryCache) {
    const stats = cache.getStats();
    stats.entries.forEach(key => {
      if (key.includes(pattern)) {
        const shortKey = key.replace(`${(cache as any).prefix}:`, '');
        cache.delete(shortKey);
        invalidated++;
      }
    });
  } else if (cache instanceof PersistentCache) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        keys.push(key);
      }
    }
    keys.forEach(key => {
      localStorage.removeItem(key);
      invalidated++;
    });
  }

  console.log(`[CACHE] Invalidated ${invalidated} entries matching pattern: ${pattern}`);
  return invalidated;
}

/**
 * Setup automatic cache cleanup
 */
export function setupCacheCleanup(): void {
  // Clean up expired entries every 10 minutes
  setInterval(() => {
    const memoryCleanup = memoryCache.cleanup();
    const persistentCleanup = persistentCache.cleanup();
    
    if (memoryCleanup > 0 || persistentCleanup > 0) {
      console.log(`[CACHE] Cleanup: ${memoryCleanup} memory, ${persistentCleanup} persistent entries removed`);
    }
  }, 10 * 60 * 1000);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    memoryCache.cleanup();
    persistentCache.cleanup();
  });
}

/**
 * Cache warming utilities
 */
export const CacheWarming = {
  /**
   * Warm up user-related caches
   */
  async warmUserCache(userId: string, apiCalls: {
    getUser?: () => Promise<any>;
    getProfile?: () => Promise<any>;
    getNotifications?: () => Promise<any>;
  }): Promise<void> {
    const promises = [];

    if (apiCalls.getUser) {
      promises.push(
        cachedRequest(CacheKeys.user(userId), apiCalls.getUser, { ttl: 15 * 60 * 1000 })
      );
    }

    if (apiCalls.getProfile) {
      promises.push(
        cachedRequest(CacheKeys.userProfile(userId), apiCalls.getProfile, { ttl: 10 * 60 * 1000 })
      );
    }

    if (apiCalls.getNotifications) {
      promises.push(
        cachedRequest(CacheKeys.notifications(userId), apiCalls.getNotifications, { ttl: 2 * 60 * 1000 })
      );
    }

    await Promise.allSettled(promises);
    console.log(`[CACHE] Warmed user cache for: ${userId}`);
  },

  /**
   * Warm up frequently accessed data
   */
  async warmFrequentData(apiCalls: {
    getProjects?: () => Promise<any>;
    getPopularSkills?: () => Promise<any>;
  }): Promise<void> {
    const promises = [];

    if (apiCalls.getProjects) {
      promises.push(
        cachedRequest(CacheKeys.projects(), apiCalls.getProjects, { ttl: 5 * 60 * 1000 })
      );
    }

    if (apiCalls.getPopularSkills) {
      promises.push(
        cachedRequest('popular_skills', apiCalls.getPopularSkills, { ttl: 60 * 60 * 1000 })
      );
    }

    await Promise.allSettled(promises);
    console.log('[CACHE] Warmed frequent data cache');
  },
};