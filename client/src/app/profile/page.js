'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { User, Calendar, Award, Leaf, Zap, Shield } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      fetch(`${API_URL}/users/profile/${storedUser.id}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, []);

  if (loading || !profile) return (
    <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </main>
    </div>
  );

  const { user, stats, badges } = profile;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* --- HEADER PROFIL --- */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            {/* Background Hiasan */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90"></div>
            
            <div className="relative mt-[30px] flex flex-col md:flex-row items-end md:items-center gap-6">
                {/* Avatar */}
                <div className="w-32 h-32 bg-white p-1 rounded-full shadow-lg -mb-4 md:mb-0 z-10">
                    <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-5xl font-bold text-emerald-600">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                
                {/* Info Text */}
                <div className="flex-1 pb-3">
                    <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"><User size={14}/> {user.email}</span>
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"><Calendar size={14}/> Gabung: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Level Card Besar */}
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 text-center min-w-[150px]">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Current Level</p>
                    <div className="text-4xl font-extrabold text-blue-600 my-1">{user.current_level}</div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{user.total_xp} XP</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- KIRI: STATISTIK --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-emerald-500 fill-emerald-500"/> Statistik Dampak
                </h3>
                <div className="space-y-4">
                    <StatItem label="Total Jejak Karbon" value={`${parseFloat(stats.totalEmission).toFixed(2)} kg`} icon={<Leaf size={16}/>} />
                    <StatItem label="Aktivitas Dicatat" value={`${stats.totalLogs} kali`} icon={<Shield size={16}/>} />
                    <StatItem label="Kesehatan Pulau" value={`${user.island_health}%`} icon={<User size={16}/>} color={user.island_health > 50 ? 'text-green-600' : 'text-red-500'} />
                </div>
            </div>
          </div>

          {/* --- KANAN: KOLEKSI BADGE --- */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Award size={24} className="text-yellow-500 fill-yellow-500"/> Koleksi Lencana
                    <span className="text-sm font-normal text-gray-500">
                        ({badges.filter(b => b.unlocked).length}/{badges.length})
                    </span>
                </h3>
                
                {badges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <Award size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Belum ada data lencana.</p>
                        <p className="text-sm text-gray-400">Selesaikan misi untuk membukanya!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {badges.map((badge, idx) => (
                            <div 
                                key={idx} 
                                className={`group flex flex-col items-center p-4 rounded-2xl border transition-all hover:scale-105 cursor-help relative ${
                                    badge.unlocked 
                                        ? 'bg-yellow-50 border-yellow-200 hover:shadow-md hover:bg-yellow-100' 
                                        : 'bg-gray-100 border-gray-200 opacity-60 hover:opacity-80'
                                }`}
                                title={badge.description}
                            >
                                {/* Lock overlay untuk badge yang belum unlock */}
                                {!badge.unlocked && (
                                    <div className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </div>
                                )}
                                
                                {/* Icon badge dengan grayscale filter jika locked */}
                                <div className={`text-4xl mb-3 drop-shadow-sm transition-transform group-hover:rotate-12 ${
                                    !badge.unlocked ? 'grayscale opacity-50' : ''
                                }`}>
                                    {badge.icon}
                                </div>
                                
                                <span className={`text-sm font-bold text-center leading-tight ${
                                    badge.unlocked ? 'text-gray-800' : 'text-gray-500'
                                }`}>
                                    {badge.name}
                                </span>
                                
                                {/* Tier badge */}
                                <span className={`text-xs mt-2 px-2 py-0.5 rounded-full font-semibold ${
                                    badge.tier === 'bronze' ? 'bg-amber-100 text-amber-700' :
                                    badge.tier === 'silver' ? 'bg-gray-200 text-gray-700' :
                                    badge.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                    badge.tier === 'diamond' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                }`}>
                                    {badge.tier}
                                </span>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 bg-gray-800 text-white text-xs p-3 rounded-lg text-center z-20 shadow-xl">
                                    <p className="font-bold mb-1">{badge.name}</p>
                                    <p className="opacity-90">{badge.description}</p>
                                    {!badge.unlocked && (
                                        <p className="mt-2 text-yellow-300 text-[10px]">🔒 Belum Terbuka</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Komponen Kecil untuk Baris Statistik
function StatItem({ label, value, icon, color = 'text-gray-900' }) {
    return (
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
                {icon}
                <span>{label}</span>
            </div>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}