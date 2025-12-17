'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialize from localStorage synchronously if possible
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('carbontrack_theme');
      return savedTheme || 'light';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Load user data dan tokens dari localStorage
  useEffect(() => {
    setMounted(true);
    
    // Load theme
    const savedTheme = localStorage.getItem('carbontrack_theme') || 'light';
    if (savedTheme !== theme) {
      setTheme(savedTheme);
    }
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Load user auth
    loadUserFromStorage();
  }, []);

  // Update document when theme state changes
  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('carbontrack_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setDarkTheme = () => {
    setTheme('dark');
    localStorage.setItem('carbontrack_theme', 'dark');
  };

  const setLightTheme = () => {
    setTheme('light');
    localStorage.setItem('carbontrack_theme', 'light');
  };

  // ===== JWT TOKEN MANAGEMENT =====

  const saveUserAuth = useCallback((userData, accessToken, refreshToken) => {
    const authData = {
      user: userData,
      accessToken,
      refreshToken,
      loginTime: new Date().toISOString()
    };
    // Primary storage for new auth system
    localStorage.setItem('userAuth', JSON.stringify(authData));
    // Keep legacy keys for compatibility with existing pages
    try {
      localStorage.setItem('token', accessToken || '');
      localStorage.setItem('user', JSON.stringify(userData || {}));
    } catch (err) {
      // ignore storage errors
    }
    setUser(userData);
    setIsTokenExpired(false);
  }, []);

  const loadUserFromStorage = useCallback(() => {
    try {
      const authData = localStorage.getItem('userAuth');
      if (authData) {
        const parsed = JSON.parse(authData);
        setUser(parsed.user);
        // Check if access token expired (optional)
        checkTokenStatus(parsed.accessToken);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      clearUserAuth();
    }
  }, []);

  const checkTokenStatus = useCallback((token) => {
    try {
      // Decode token tanpa verify
      const parts = token.split('.');
      if (parts.length !== 3) return;

      const decoded = JSON.parse(atob(parts[1]));
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Consider expired if less than 2 minutes left
      if (timeUntilExpiry < 2 * 60 * 1000) {
        setIsTokenExpired(true);
      }
    } catch (error) {
      console.error('Error checking token status:', error);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const authData = localStorage.getItem('userAuth');
      if (!authData) {
        clearUserAuth();
        return false;
      }

      const { refreshToken } = JSON.parse(authData);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearUserAuth();
          return false;
        }
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const currentAuthData = JSON.parse(authData);
      
      // Update tokens
      saveUserAuth(currentAuthData.user, data.accessToken, data.refreshToken);
      setIsTokenExpired(false);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearUserAuth();
      return false;
    }
  }, [saveUserAuth]);

  const getAccessToken = useCallback(() => {
    try {
      const authData = localStorage.getItem('userAuth');
      if (!authData) return null;
      const { accessToken } = JSON.parse(authData);
      return accessToken;
    } catch (error) {
      return null;
    }
  }, []);

  const clearUserAuth = useCallback(() => {
    // Remove both new and legacy storage keys
    try {
      localStorage.removeItem('userAuth');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      // ignore
    }
    setUser(null);
    setIsTokenExpired(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const token = getAccessToken();

      if (token) {
        // Call logout endpoint (optional)
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error('Logout API error:', err));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUserAuth();
    }
  }, [getAccessToken, clearUserAuth]);

  const value = {
    // Theme
    theme,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    mounted,
    
    // Auth
    user,
    isTokenExpired,
    saveUserAuth,
    loadUserFromStorage,
    refreshAccessToken,
    getAccessToken,
    clearUserAuth,
    logout
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}