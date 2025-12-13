'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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

  // Apply theme on mount and when theme changes
  useEffect(() => {
    setMounted(true);
    
    // Always sync with actual localStorage value
    const savedTheme = localStorage.getItem('carbontrack_theme') || 'light';
    
    if (savedTheme !== theme) {
      setTheme(savedTheme);
    }
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    
    // Force immediate DOM update
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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDarkTheme, setLightTheme, mounted }}>
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
