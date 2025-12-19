// Authentication utility functions for JWT dual-token system
// Access Token: 30 minutes - for API calls
// Refresh Token: 7 days - for renewing access token

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

/**
 * Store tokens in both localStorage AND cookies
 * - localStorage: For client-side API calls
 * - Cookies: For server-side middleware authentication check
 */
export const setTokens = (accessToken, refreshToken, userData = null) => {
  if (typeof window !== 'undefined') {
    // Store in localStorage (existing behavior)
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
    
    // ALSO store in cookies for middleware
    // Set expiry: accessToken = 30 min, refreshToken = 7 days
    const accessExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    document.cookie = `token=${accessToken}; path=/; expires=${accessExpiry.toUTCString()}; SameSite=Lax`;
    document.cookie = `refreshToken=${refreshToken}; path=/; expires=${refreshExpiry.toUTCString()}; SameSite=Lax`;
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
 * Clear all authentication data (localStorage AND cookies)
 */
export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    // Clear new JWT tokens from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Clear legacy keys (for backward compatibility)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userAuth');
    
    // ALSO clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
  }
};

/**
 * Decode JWT token (without verification - client-side safe)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  // Check if token expired (exp is in seconds, Date.now() is in milliseconds)
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Check if user is authenticated (has valid, non-expired tokens)
 * @returns {boolean} True if authenticated with valid token
 */
export const isAuthenticated = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  // No tokens = not authenticated
  if (!accessToken || !refreshToken) {
    return false;
  }
  
  // Check if access token expired
  if (isTokenExpired(accessToken)) {
    console.log('⚠️ Access token expired');
    // If access token expired but refresh token valid, still considered authenticated
    // (will be refreshed automatically by API calls)
    if (!isTokenExpired(refreshToken)) {
      console.log('✅ Refresh token still valid, user authenticated');
      return true;
    }
    
    // Both tokens expired - clear auth data
    console.log('❌ Both tokens expired, clearing auth data');
    clearAuth();
    return false;
  }
  
  return true;
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

  // Check for various error conditions
  if (response.status === 403) {
    const errorData = await response.json();
    
    // ⚡ CRITICAL: Account banned - immediate redirect (skip for admin routes)
    if (errorData.accountBanned) {
      console.error('🚫 Account has been banned');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/banned';
      }
      throw new Error('Account banned');
    }
  }

  // If 401 and token expired, try to refresh
  if (response.status === 401) {
    const errorData = await response.json();
    
    // Check if account is banned (can also come as 401) (skip for admin routes)
    if (errorData.accountBanned) {
      console.error('🚫 Account has been banned');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/banned';
      }
      throw new Error('Account banned');
    }
    
    // Check if status is offline (force re-login)
    if (errorData.statusOffline) {
      console.error('⚠️ Session expired - status is offline');
      clearAuth();
      if (typeof window !== 'undefined') {
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
    
    if (errorData.tokenExpired || errorData.requireRefresh) {
      console.log('🔄 Access token expired, attempting refresh...');
      
      // Try to refresh token
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        // Retry request with new token
        options.headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, options);
        
        // Re-check for banned status after refresh (skip for admin routes)
        if (response.status === 403) {
          const retryError = await response.json();
          if (retryError.accountBanned) {
            console.error('🚫 Account has been banned');
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
              window.location.href = '/banned';
            }
            throw new Error('Account banned');
          }
        }
      } else {
        // Refresh failed, redirect to login
        console.error('❌ Token refresh failed, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }
    } else if (errorData.requireAuth || errorData.tokenRevoked) {
      // No valid auth at all or token revoked, redirect to login
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
