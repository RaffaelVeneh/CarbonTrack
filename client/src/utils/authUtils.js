'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Higher-Order Component untuk protect route yang memerlukan authentication
 * Usage: export default withAuth(MyComponent);
 */
export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { user, isTokenExpired, refreshAccessToken, getAccessToken, clearUserAuth } = useTheme();

    useEffect(() => {
      const checkAuth = async () => {
        // Jika user null, berarti belum login
        if (!user) {
          router.push('/login');
          return;
        }

        // Jika token expired, coba refresh
        if (isTokenExpired) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            // Refresh failed, redirect ke login
            router.push('/login');
            return;
          }
        }

        // Check apakah ada token di localStorage
        const token = getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }
      };

      checkAuth();
    }, [user, isTokenExpired, router, refreshAccessToken, getAccessToken]);

    // Show loading state saat checking auth
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook untuk menggunakan auth context di component
 * Usage: const { user, getAccessToken, logout } = useAuth();
 */
export function useAuth() {
  const { user, getAccessToken, clearUserAuth, logout, refreshAccessToken, isTokenExpired } = useTheme();

  return {
    user,
    isAuthenticated: !!user,
    getAccessToken,
    logout,
    refreshAccessToken,
    isTokenExpired,
    clearAuth: clearUserAuth
  };
}
