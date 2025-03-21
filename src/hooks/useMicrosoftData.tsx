'use client';

import { useState, useEffect, useMemo } from 'react';
import type { DashboardData } from '@/components/connect-data-modal';

// Local storage key for caching Microsoft data
const STORAGE_KEY = 'microsoft_dashboard_data';

export function useMicrosoftData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format the timestamp nicely
  const formattedTimestamp = useMemo(() => {
    if (!data?.timestamp) return 'Never';
    
    const date = new Date(data.timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  }, [data?.timestamp]);

  // Check if we're connected (have data)
  const isConnected = !!data;

  useEffect(() => {
    // Try to load cached data on mount
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsedData = JSON.parse(cached) as DashboardData;
          setData(parsedData);
        }
      } catch (error) {
        console.error('Error loading cached Microsoft data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedData();
  }, []);

  // Function to save new data
  const saveData = (newData: DashboardData) => {
    try {
      // Ensure timestamp is set
      if (!newData.timestamp) {
        newData.timestamp = Date.now();
      }
      
      // Save to state
      setData(newData);
      
      // Cache in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving Microsoft data:', error);
    }
  };

  // Function to clear data
  const clearData = () => {
    setData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    isConnected,
    isLoading,
    data,
    formattedTimestamp,
    saveData,
    clearData
  };
} 