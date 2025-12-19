'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/utils/auth';

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple processing
    if (processed) return;

    if (status === 'authenticated' && session?.backendToken) {
      console.log('✅ Google auth successful, saving tokens...');
      
      // Save JWT tokens to localStorage
      setTokens(
        session.backendToken.accessToken,
        session.backendToken.refreshToken,
        session.userData
      );
      
      setProcessed(true);
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } else if (status === 'unauthenticated') {
      console.error('❌ Google auth failed');
      setProcessed(true);
      router.push('/login?error=google_auth_failed');
    }
  }, [status, session, router, processed]);

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
