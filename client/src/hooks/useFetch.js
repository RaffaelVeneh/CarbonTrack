'use client';

/**
 * Example hook untuk fetch data dengan JWT authentication
 * Automatically handle token refresh jika expired
 */

import { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function useFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAccessToken, refreshAccessToken, isTokenExpired } = useTheme();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      let token = getAccessToken();

      // Jika token expired, refresh dulu
      if (isTokenExpired) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Session expired. Please login again.');
        }
        token = getAccessToken();
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      // Jika response 401, coba refresh dan retry
      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          token = getAccessToken();
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${token}`
            }
          });
          return retryResponse;
        }
        throw new Error('Authentication failed');
      }

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, refreshAccessToken, isTokenExpired, API_URL]);

  return { fetchWithAuth, loading, error };
}

/**
 * Example penggunaan:
 * 
 * const { fetchWithAuth, loading } = useFetch();
 * 
 * // Get data
 * const response = await fetchWithAuth('/api/user/profile');
 * const data = await response.json();
 * 
 * // Post data
 * const response = await fetchWithAuth('/api/user/update', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
