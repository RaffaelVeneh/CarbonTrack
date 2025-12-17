'use client';

import { useRouter } from 'next/navigation';
import { Home, Search, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  // Force remove any layout styling
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 leading-none animate-pulse">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl">
              <AlertTriangle size={64} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Oops! Sepertinya halaman yang kamu cari sedang bersembunyi di hutan 🌳
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
            onClick={() => router.push('/dashboard')}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <Home size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Dashboard</span>
          </button>
        </div>

        {/* Search Suggestion */}
        <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Search className="text-emerald-400" size={24} />
            <h3 className="text-white font-semibold text-lg">Coba cari halaman lain?</h3>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Missions', path: '/missions' },
              { label: 'Leaderboard', path: '/leaderboard' },
              { label: 'AI Assistant', path: '/assistant' },
              { label: 'Profile', path: '/profile' }
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

        {/* Fun Fact */}
        <div className="mt-8 text-gray-400 text-sm italic">
          💡 Fun fact: Setiap halaman yang tidak ditemukan mengurangi 0.001 kg CO2 dari internetmu 😄
        </div>
      </div>
    </div>
  );
}
