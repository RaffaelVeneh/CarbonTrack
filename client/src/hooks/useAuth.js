'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';

/**
 * 🔐 CLIENT-SIDE AUTHENTICATION PROTECTION
 * Custom hook to protect pages from unauthorized access
 * 
 * Usage in any protected page:
 * ```
 * import useAuth from '@/hooks/useAuth';
 * 
 * export default function ProtectedPage() {
 *   useAuth(); // This line protects the page
 *   // ... rest of component
 * }
 * ```
 * 
 * Features:
 * - Redirects to login if not authenticated
 * - Preserves intended destination
 * - Shows loading state during check
 * - Client-side protection (works with localStorage)
 */
export default function useAuth(redirectTo = '/login') {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      if (!isAuthenticated()) {
        console.warn('🔒 Unauthorized access attempt to:', pathname);
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?from=${returnUrl}`);
      } else {
        console.log('✅ Authentication verified for:', pathname);
      }
    };

    checkAuth();
  }, [pathname, router, redirectTo]);

  return isAuthenticated();
}
