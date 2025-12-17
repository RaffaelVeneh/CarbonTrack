'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { saveUserAuth } = useTheme();

  useEffect(() => {
    if (status === 'authenticated' && session?.backendToken) {
      // Save to localStorage dengan 2 tokens
      saveUserAuth(
        session.userData,
        session.backendToken.accessToken,
        session.backendToken.refreshToken
      );
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      // Failed authentication
      router.push('/login?error=google_auth_failed');
    }
  }, [status, session, router, saveUserAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">
          Menyelesaikan login dengan Google...
        </p>
      </div>
    </div>
  );
}
