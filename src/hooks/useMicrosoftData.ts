'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/lib/services/msal-service';
import { DashboardData } from '@/components/connect-data-modal';

// Storage keys
const MS_DATA_KEY = 'ms_graph_data';
const MS_DATA_TIMESTAMP_KEY = 'ms_graph_data_timestamp';

export function useMicrosoftData() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if we have a connection and data on mount
  useEffect(() => {
    // Check if we're authenticated with MSAL
    const msalAuthenticated = typeof window !== 'undefined' ? isAuthenticated() : false;
    
    // Check if we have cached data
    const cachedData = typeof window !== 'undefined' ? localStorage.getItem(MS_DATA_KEY) : null;
    const cachedTimestamp = typeof window !== 'undefined' ? localStorage.getItem(MS_DATA_TIMESTAMP_KEY) : null;
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setData(parsedData);
        setDataTimestamp(cachedTimestamp);
        setIsConnected(true);
      } catch (error) {
        console.error('Error parsing cached Microsoft data:', error);
        // Clear invalid data
        localStorage.removeItem(MS_DATA_KEY);
        localStorage.removeItem(MS_DATA_TIMESTAMP_KEY);
      }
    }
    
    // If we have MSAL auth but no data, we're in a weird state - still mark as connected
    // so the user can refresh data
    if (msalAuthenticated && !cachedData) {
      setIsConnected(true);
    }
    
    setIsLoading(false);
  }, []);

  // Save data to localStorage and update state
  const saveData = (newData: DashboardData) => {
    setData(newData);
    setIsConnected(true);
    
    // Create timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    setDataTimestamp(timestamp);
    
    // Save to localStorage
    localStorage.setItem(MS_DATA_KEY, JSON.stringify(newData));
    localStorage.setItem(MS_DATA_TIMESTAMP_KEY, timestamp);
  };

  // Clear data from localStorage and update state
  const clearData = () => {
    setData(null);
    setDataTimestamp(null);
    setIsConnected(false);
    
    // Remove from localStorage
    localStorage.removeItem(MS_DATA_KEY);
    localStorage.removeItem(MS_DATA_TIMESTAMP_KEY);
  };

  // Format the timestamp for display
  const getFormattedTimestamp = (): string => {
    if (!dataTimestamp) return 'Never';
    
    try {
      const date = new Date(dataTimestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'Unknown date';
    }
  };

  return {
    isConnected,
    isLoading,
    data,
    dataTimestamp,
    formattedTimestamp: getFormattedTimestamp(),
    saveData,
    clearData
  };
} 