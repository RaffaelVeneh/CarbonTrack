'use client';

import { useRouter } from 'next/navigation';
import { Shield, Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminNotFound() {
  const router = useRouter();

  // Force remove any layout styling
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 leading-none animate-pulse">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl shadow-2xl">
              <AlertTriangle size={64} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Admin Page Not Found
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Halaman admin yang Anda cari tidak ditemukan atau belum tersedia.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-2xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-lg">Kembali</span>
          </button>

          <button
            onClick={() => router.push('/admin/dashboard')}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <Shield size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Admin Dashboard</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <h3 className="text-white font-semibold text-lg mb-4">Admin Quick Links</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Dashboard', path: '/admin/dashboard' },
              { label: 'Users', path: '/admin/users' },
              { label: 'Statistics', path: '/admin/stats' },
              { label: 'Settings', path: '/admin/settings' },
              { label: 'Logout', path: '/admin/login' }
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white rounded-lg text-sm transition-all duration-200 border border-white/10 hover:border-white/30"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-sm text-yellow-200">
            🔒 Jika Anda tidak seharusnya mengakses area admin, silakan kembali ke halaman utama
          </p>
        </div>
      </div>
    </div>
  );
}
