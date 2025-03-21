import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import logger from '@/utils/logger';

interface FetchOptions {
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
}

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
}

interface UseFetchResult<T> extends FetchState<T> {
  mutate: (data?: T | null) => void;
  revalidate: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for data fetching with caching using SWR pattern
 */
export function useFetch<T = any>(
  url: string | null,
  options: FetchOptions = {},
  initialData: T | null = null,
  skipFetch: boolean = false
): UseFetchResult<T> {
  const { refreshSession } = useAuth();
  const [state, setState] = useState<FetchState<T>>({
    data: initialData,
    error: null,
    isLoading: !skipFetch && !!url,
    isValidating: !skipFetch && !!url,
  });
  
  const optionsRef = useRef(options);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unmountedRef = useRef(false);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Clear loading state on unmount
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);
  
  // Fetch function
  const fetchData = useCallback(async (skipCache = false): Promise<void> => {
    if (!url || skipFetch) return;
    
    // Set validating state
    if (!unmountedRef.current) {
      setState(prev => ({ ...prev, isValidating: true }));
    }
    
    // Check cache first
    const cacheKey = `${url}:${JSON.stringify(optionsRef.current)}`;
    const cachedData = cache.get(cacheKey);
    
    if (!skipCache && cachedData && (Date.now() - cachedData.timestamp) < CACHE_TIME) {
      // Use cached data
      if (!unmountedRef.current) {
        setState({
          data: cachedData.data,
          error: null,
          isLoading: false,
          isValidating: false
        });
      }
      return;
    }
    
    try {
      // Set loading state if not already set
      if (!unmountedRef.current) {
        setState(prev => ({ ...prev, isLoading: true }));
      }
      
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: optionsRef.current.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...optionsRef.current.headers
        },
        credentials: optionsRef.current.credentials || 'same-origin',
        cache: optionsRef.current.cache || 'default',
      };
      
      // Add body for non-GET requests
      if (fetchOptions.method !== 'GET' && optionsRef.current.body) {
        fetchOptions.body = JSON.stringify(optionsRef.current.body);
      }
      
      // Add next.js specific options
      if (optionsRef.current.next) {
        (fetchOptions as any).next = optionsRef.current.next;
      }
      
      // Execute fetch
      const response = await fetch(url, fetchOptions);
      
      // Handle HTTP errors
      if (!response.ok) {
        // Try to handle 401 errors with token refresh
        if (response.status === 401) {
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Retry the request after refresh
            return fetchData(true);
          }
        }
        
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // Parse response
      const data = await response.json();
      
      // Update cache
      cache.set(cacheKey, { 
        data, 
        timestamp: Date.now() 
      });
      
      // Update state if component still mounted
      if (!unmountedRef.current) {
        setState({
          data,
          error: null,
          isLoading: false,
          isValidating: false
        });
      }
    } catch (error) {
      logger.error(`Error fetching data from ${url}`, error);
      
      // Update state with error if component still mounted
      if (!unmountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error as Error,
          isLoading: false,
          isValidating: false
        }));
      }
    }
  }, [url, skipFetch, refreshSession]);
  
  // Initial fetch
  useEffect(() => {
    if (url && !skipFetch) {
      fetchData();
    }
  }, [url, skipFetch, fetchData]);
  
  // Mutate function to update data manually
  const mutate = useCallback((newData?: T | null) => {
    if (unmountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      data: newData !== undefined ? newData : prev.data
    }));
    
    // Update cache if we have a URL
    if (url) {
      const cacheKey = `${url}:${JSON.stringify(optionsRef.current)}`;
      if (newData !== undefined && newData !== null) {
        cache.set(cacheKey, { 
          data: newData, 
          timestamp: Date.now() 
        });
      } else {
        cache.delete(cacheKey);
      }
    }
  }, [url]);
  
  // Revalidate function to refetch data
  const revalidate = useCallback(async () => {
    return fetchData(true);
  }, [fetchData]);
  
  return {
    ...state,
    mutate,
    revalidate
  };
} 