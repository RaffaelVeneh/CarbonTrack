'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Target, Award, Users, Bot, LogOut, Settings, AlertTriangle, History } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { logout as logoutUser } from '@/utils/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { logout, clearUserAuth } = useTheme();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    // Use auth utility logout function (calls API and clears tokens)
    try {
      await logoutUser();
      // logoutUser() already handles redirect to /login
    } catch (err) {
      console.error('Logout error:', err);
      // Force redirect even if API call fails
      router.push('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Misi & Poin', href: '/missions', icon: Target },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
    { name: 'Riwayat', href: '/history', icon: History },
    { name: 'Profil', href: '/profile', icon: Users },
    { name: 'Eco AI', href: '/assistant', icon: Bot },
    { name: 'Pengaturan', href: '/settings', icon: Settings }
  ];

  return (
    <>
      <div className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-40">
        
        {/* --- BAGIAN LOGO & TEKS KUSTOM --- */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-start gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            
            {/* 1. Ikon Logo (Pastikan ini gambar yg sudah dicrop/icon saja) */}
            <Image 
              src="/logo-icon.jpg"   // Ganti nama file jika kamu sudah crop jadi 'icon.jpg'
              alt="CarbonTrack Icon"
              width={45}           
              height={45}           
              className="object-contain" 
              priority
            />

            {/* 2. Teks yang dibuat manual (Mirip desain asli) */}
            <div className="flex flex-col justify-center leading-none">
                <div className="flex items-baseline">
                    <span className="text-2xl font-extrabold text-gray-700 dark:text-gray-200 tracking-tight">
                        Carbon
                    </span>
                    <span className="text-2xl font-medium text-emerald-500 dark:text-emerald-400 ml-0.5">
                        Tracker
                    </span>
                </div>
            </div>

          </Link>
        </div>
        {/* ----------------------------------- */}

        {/* MENU NAVIGASI */}
        <nav className="flex-1 py-4 pl-4 pr-0 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 font-bold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-l-xl mr-0 pr-8 shadow-lg shadow-emerald-500/30 border-l-4 border-emerald-700'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg mr-4'
                }`}
                style={isActive ? {
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                } : {}}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-md' : ''} />
                <span className={isActive ? 'drop-shadow-md' : ''}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* TOMBOL KELUAR */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium transition"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </div>

      {/* --- POPUP MODAL KONFIRMASI --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Yakin ingin keluar?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Sesi kamu akan berakhir dan kamu harus login lagi untuk mengakses Dashboard.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                  Batal
                </button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-xl font-semibold hover:bg-red-700 dark:hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50 transition">
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}