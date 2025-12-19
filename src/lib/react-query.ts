import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized React Query configuration
 * Implements stale-while-revalidate pattern for better performance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Stale time: how long data is considered fresh (no refetch)
      staleTime: 30 * 1000, // 30 seconds default
      // Cache time: how long unused data stays in cache
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
      // Refetch on window focus (can be disabled for better performance)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Query-specific configurations
 * Use these in useQuery hooks for optimal caching per data type
 */
export const queryConfigs = {
  // Dashboard data (changes frequently, short stale time)
  dashboard: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  
  // Analytics data (changes less frequently)
  analytics: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Static/reference data (rarely changes)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Calendar events (changes frequently)
  calendar: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Call logs (changes frequently)
  calls: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Knowledge base (changes infrequently)
  knowledgeBase: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
};

