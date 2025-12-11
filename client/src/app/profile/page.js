'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import BadgeCollection from '@/components/BadgeCollection';
import { User, Mail, Calendar, TrendingUp, ShieldCheck, Leaf } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]); 
  const [stats, setStats] = useState({ totalLogs: 0, totalEmission: 0, totalSaved: 0 });
  const [loading, setLoading] = useState(true);

  // Fallback URL localhost untuk testing lokal
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // 1. Ambil data awal dari LocalStorage (mungkin data lama)
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
        setUser(userData);
        // 2. Panggil data terbaru dari server
        fetchProfileData(userData.id);
    }
  }, []);

  const fetchProfileData = async (userId) => {
    try {
        setLoading(true);
        
        // A. Ambil Semua Badge
        const resBadges = await fetch(`${API_URL}/badges?userId=${userId}`);
        const dataBadges = await resBadges.json();
        
        if (dataBadges.badges) {
            setBadges(dataBadges.badges);
        }

        // B. Ambil Statistik Summary
        const resStats = await fetch(`${API_URL}/logs/summary/${userId}`);
        const dataStats = await resStats.json();
        if (resStats.ok) {
            setStats(dataStats);
        }

        // C. Ambil Detail User TERBARU (Level, XP, Health)
        // --- PERBAIKAN DI SINI ---
        const resUser = await fetch(`${API_URL}/users/profile/${userId}`);
        const dataUser = await resUser.json();

        if (resUser.ok && dataUser.user) {
            // Gabungkan data lama dengan data baru
            const updatedUser = {
                ...JSON.parse(localStorage.getItem('user')), // Ambil base data
                ...dataUser.user, // Timpa dengan data baru (level, xp, dll)
                level: dataUser.user.current_level || dataUser.user.level // Pastikan field level benar
            };

            // Update State & LocalStorage
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

    } catch (error) {
        console.error("Gagal ambil data profil", error);
    } finally {
        setLoading(false);
    }
  };

  if (!user) return null;

  // Hitung jumlah badge yang sudah didapat
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil Saya</h1>

        {/* --- CARD UTAMA USER --- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-xl text-white">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                
                {/* Info Text */}
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{user.username}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                            <Mail size={14}/> {user.email}
                        </span>
                        {/* Level Label (Sekarang akan update otomatis) */}
                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                            <TrendingUp size={14}/> Level {user.level || user.current_level || 1}
                        </span>
                    </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="flex gap-4">
                    <div className="text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-bold text-emerald-600">{parseFloat(stats.todaySaved || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wide">Kg Hemat</div>
                    </div>
                    <div className="text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-bold text-gray-800">{unlockedCount}</div>
                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wide">Badges</div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- BAGIAN BADGES --- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        🏆 Koleksi Penghargaan
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">Selesaikan misi untuk membuka gembok!</p>
                </div>
                
                {/* Progress Bar Badge */}
                <div className="w-1/3 hidden md:block">
                    <div className="flex justify-between text-xs mb-1 font-bold text-gray-500">
                        <span>Progress Koleksi</span>
                        <span>{Math.round((unlockedCount / Math.max(badges.length, 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                            style={{ width: `${(unlockedCount / Math.max(badges.length, 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-400 animate-pulse">Memuat koleksi badge...</div>
            ) : (
                <BadgeCollection badges={badges} />
            )}
        </div>

      </main>
    </div>
  );
}