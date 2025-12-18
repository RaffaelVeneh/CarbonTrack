// Authentication utility functions for JWT dual-token system
// Access Token: 30 minutes - for API calls
// Refresh Token: 7 days - for renewing access token

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

/**
 * Store tokens in localStorage
 */
export const setTokens = (accessToken, refreshToken, userData = null) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

/**
 * Get user data from localStorage
 */
export const getUserData = () => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    // Clear new JWT tokens
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Clear legacy keys (for backward compatibility)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userAuth');
  }
};

/**
 * Check if user is authenticated (has valid tokens)
 */
export const isAuthenticated = () => {
  return !!(getAccessToken() && getRefreshToken());
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<string|null>} New access token or null if failed
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      // Update access token in localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      console.log('✅ Access token refreshed successfully');
      return data.accessToken;
    } else {
      // Refresh token expired or invalid - need to re-login
      console.error('❌ Refresh token expired or invalid:', data.message);
      clearAuth();
      return null;
    }
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    clearAuth();
    return null;
  }
};

/**
 * Logout user and clear tokens from server and client
 */
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      // Notify server to invalidate refresh token
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    clearAuth();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

/**
 * Fetch wrapper with automatic token refresh
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = getAccessToken();

  // Ensure headers object exists
  if (!options.headers) {
    options.headers = {};
  }

  // Add access token to headers
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Make first request
  let response = await fetch(url, options);

  // If 401 and token expired, try to refresh
  if (response.status === 401) {
    const errorData = await response.json();
    
    if (errorData.tokenExpired || errorData.requireRefresh) {
      console.log('🔄 Access token expired, attempting refresh...');
      
      // Try to refresh token
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry request with new token
        options.headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, options);
      } else {
        // Refresh failed, redirect to login
        console.error('❌ Token refresh failed, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }
    } else if (errorData.requireAuth) {
      // No valid auth at all, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
  }

  return response;
};

/**
 * API call helper with authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetchWithAuth(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API call failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * Simple authenticated GET request
 * @param {string} endpoint - API endpoint (starting with /)
 * @returns {Promise<object>}
 */
export const apiGet = async (endpoint) => {
  return apiCall(endpoint, { method: 'GET' });
};

/**
 * Simple authenticated POST request
 * @param {string} endpoint - API endpoint (starting with /)
 * @param {object} data - Request body data
 * @returns {Promise<object>}
 */
export const apiPost = async (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

/**
 * Simple authenticated PUT request
 * @param {string} endpoint - API endpoint (starting with /)
 * @param {object} data - Request body data
 * @returns {Promise<object>}
 */
export const apiPut = async (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

/**
 * Simple authenticated DELETE request
 * @param {string} endpoint - API endpoint (starting with /)
 * @returns {Promise<object>}
 */
export const apiDelete = async (endpoint) => {
  return apiCall(endpoint, { method: 'DELETE' });
};
