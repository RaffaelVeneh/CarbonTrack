'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { initializeSocket, onAccountUnbanned, offAccountUnbanned } from '@/utils/socket';

export default function BannedPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check if user data exists
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserData(user);

      // Initialize socket for this user on banned page
      const socket = initializeSocket(user.id);

      // Listen for unban event
      onAccountUnbanned((data) => {
        console.log('✅ UNBANNED on banned page:', data);
        
        // Update localStorage
        user.status = data.status || 'offline';
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));

        // Show alert and redirect
        alert('✅ Your account has been unbanned!\n\nYou can now access the application.');
        window.location.href = '/dashboard';
      });
    }

    // Prevent back navigation
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
      offAccountUnbanned();
    };
  }, []);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.clear();
    // Redirect to login
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-red-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 animate-pulse">
              <ShieldAlert size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">
              Akun Anda Telah Diblokir
            </h1>
            <p className="text-red-100 text-lg">
              Your account has been suspended
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* User Info */}
            {userData && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Akun yang diblokir:</div>
                <div className="font-bold text-gray-900 text-lg">{userData.username}</div>
                <div className="text-sm text-gray-500">{userData.email}</div>
              </div>
            )}

            {/* Reason */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">Mengapa akun saya diblokir?</h3>
                  <p className="text-red-800 text-sm leading-relaxed">
                    Akun Anda telah dinonaktifkan oleh administrator karena melanggar kebijakan atau 
                    ketentuan penggunaan aplikasi. Ini mungkin terkait dengan:
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-red-700">
                    <li>• Pelanggaran kebijakan komunitas</li>
                    <li>• Aktivitas mencurigakan atau spam</li>
                    <li>• Penyalahgunaan fitur aplikasi</li>
                    <li>• Laporan dari pengguna lain</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ Informasi Penting</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Semua fitur aplikasi telah dinonaktifkan</li>
                <li>✓ Data Anda tetap aman dan tersimpan</li>
                <li>✓ Anda dapat mengajukan banding jika merasa ini kesalahan</li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-center">Butuh Bantuan?</h3>
              
              <a
                href="mailto:carbontrackappservice.2025@gmail.com?subject=Banding%20Pemblokiran%20Akun"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                <Mail size={20} />
                Hubungi Support via Email
              </a>

              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Email Support:</p>
                <p className="font-mono font-semibold text-gray-800">
                  carbontrackappservice.2025@gmail.com
                </p>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 CarbonTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
