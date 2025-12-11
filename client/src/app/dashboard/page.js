'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import Lottie from 'lottie-react'; 

// Import Animasi
import healthyAnim from '@/assets/lottie/healthy.json';
import normalAnim from '@/assets/lottie/normal.json';
import deadAnim from '@/assets/lottie/dead.json';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// PENTING: Tambahkan 'Flame' di import ini
import { Leaf, Zap, TrendingDown, Plus, Heart, ShieldCheck, Flame } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Data Dashboard
  const [stats, setStats] = useState({ 
    todayEmission: 0, 
    todaySaved: 0,
    totalEmission: 0, 
    totalSaved: 0, 
    graphData: [] 
  });

  // State Animasi Pohon
  const [treeConfig, setTreeConfig] = useState({ 
    anim: null, 
    text: 'Memuat...', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-200' 
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  // FUNGSI 1: Ambil Data Terbaru (Stats + Health User)
  const fetchAllData = useCallback(async (userId) => {
    try {
      // A. Ambil Statistik
      const resStats = await fetch(`${API_URL}/logs/summary/${userId}`);
      const dataStats = await resStats.json();
      
      const normalizedStats = {
        todayEmission: parseFloat(dataStats?.todayEmission || 0),
        todaySaved: parseFloat(dataStats?.todaySaved || 0),
        totalEmission: parseFloat(dataStats?.totalEmission || 0),
        totalSaved: parseFloat(dataStats?.totalSaved || 0),
        graphData: []
      };
      
      if (dataStats?.graphData && Array.isArray(dataStats.graphData)) {
        normalizedStats.graphData = dataStats.graphData.map(item => ({
          name: item.name || 'Unknown',
          emission: parseFloat(item.emission || 0),
          saved: parseFloat(item.saved || 0)
        }));
      }
      setStats(normalizedStats);

      // B. Ambil Profil User TERBARU (Health & Level & Streak)
      const resUser = await fetch(`${API_URL}/users/profile/${userId}`);
      const dataUser = await resUser.json();
      
      if (resUser.ok && dataUser.user) {
        // Update State User di Layar (biar langsung berubah)
        const updatedUser = { 
            ...user, 
            ...dataUser.user, // Gabungkan data lama dengan data baru dari server
            level: dataUser.user.current_level || dataUser.user.level 
        };
        setUser(updatedUser);

        // Update LocalStorage (Supaya kalau di-refresh tetap data baru)
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update Pohon
        updateTreeUI(dataUser.user.island_health);
      }

    } catch (error) {
      console.error("Gagal ambil data", error);
    }
  }, [API_URL, user]); 

  // FUNGSI 2: Logika Ganti Gambar Pohon
  const updateTreeUI = (health) => {
    if (health >= 80) {
        setTreeConfig({ 
            anim: healthyAnim, 
            text: 'Pulau Subur! Alam tersenyum padamu 🌿', 
            color: 'text-emerald-600', 
            bgColor: 'bg-emerald-500' 
        });
    } else if (health >= 40) {
        setTreeConfig({ 
            anim: normalAnim, 
            text: 'Hati-hati, daun mulai menguning... 🍂', 
            color: 'text-yellow-600', 
            bgColor: 'bg-yellow-500' 
        });
    } else {
        setTreeConfig({ 
            anim: deadAnim, 
            text: 'BAHAYA! Pulaumu sekarat... 🌪️', 
            color: 'text-red-600', 
            bgColor: 'bg-red-500' 
        });
    }
  };

  // FUNGSI 3: Cek Apakah Streak Aktif Hari Ini
  const isStreakActiveToday = () => {
    if (!user || !user.last_log_date) return false;
    // Bandingkan tanggal hari ini dengan last_log_date dari database
    const today = new Date().toLocaleDateString('en-CA'); // Format YYYY-MM-DD lokal
    const lastLog = new Date(user.last_log_date).toLocaleDateString('en-CA');
    return today === lastLog;
  };

  // --- FUNGSI BARU: UPDATE STREAK SECARA PAKSA (Optimistic UI) ---
  const handleForceStreak = (newStreakValue) => {
    if (!user) return;
    
    // Kita manipulasi state user secara lokal
    const updatedUser = {
        ...user,
        current_streak: newStreakValue, // Paksa ganti angka streak
        last_log_date: new Date().toISOString() // Paksa anggap sudah log hari ini
    };

    console.log("🚀 Frontend forcing streak update:", newStreakValue);
    
    // Update State Langsung (Biar UI berubah detik itu juga)
    setUser(updatedUser);
    
    // Update LocalStorage Langsung (Biar pas refresh gak ilang)
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Load Awal
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAllData(parsedUser.id);
    }
  }, []); 

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Halo, {user.username}! 👋</h1>
            <p className="text-gray-500">Statistik jejak karbon real-time kamu.</p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* --- 🔥 KOMPONEN STREAK 🔥 --- */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all cursor-help relative group select-none
                ${isStreakActiveToday() 
                    ? 'bg-orange-50 border-orange-200 text-orange-500' // Kalo Aktif: Oranye
                    : 'bg-gray-100 border-gray-200 text-gray-400 grayscale' // Kalo Belum: Abu-abu
                }`}
            >
                {/* Ikon Api */}
                <div className={`text-2xl ${isStreakActiveToday() ? 'animate-bounce drop-shadow-md' : ''}`}>
                    <Flame fill={isStreakActiveToday() ? "currentColor" : "none"} />
                </div>
                
                {/* Angka Streak */}
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black font-mono">{user.current_streak || 0}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Hari</span>
                </div>

                {/* Tooltip Hover */}
                <div className="absolute top-full mt-3 right-0 w-48 bg-gray-800 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {isStreakActiveToday() 
                        ? "Hebat! Streak kamu aman hari ini. 🔥" 
                        : "Kamu belum mencatat aktivitas hari ini! Awas streak-nya hangus! 😱"}
                    {/* Panah Tooltip */}
                    <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
            </div>
            {/* ------------------------------------------- */}

            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition transform hover:scale-105"
            >
                <Plus size={20} /> Catat Aktivitas
            </button>
          </div>
        </div>

        {/* --- AREA POHON DIGITAL --- */}
        <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-8 mb-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-48 h-48 flex-shrink-0 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    {treeConfig.anim ? (
                        <Lottie animationData={treeConfig.anim} loop={true} style={{ width: 160, height: 160 }} />
                    ) : (
                        <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Status Pulau Virtual</h2>
                    <p className={`text-lg font-semibold mb-4 ${treeConfig.color}`}>
                        "{treeConfig.text}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <Heart className="text-red-500 animate-pulse" fill="currentColor" size={24} />
                        <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${treeConfig.bgColor}`} 
                                style={{ width: `${user.island_health}%` }}
                            ></div>
                        </div>
                        <span className="font-bold text-gray-700 w-12">{user.island_health}%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- KARTU STATISTIK --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg"><Leaf size={20} /></div>
              <p className="text-sm text-gray-500 font-medium">Total Emisi</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalEmission} <span className="text-sm font-normal text-gray-400">kg</span></h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><TrendingDown size={20} /></div>
              <p className="text-sm text-gray-500 font-medium">Emisi Hari Ini</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{stats.todayEmission} <span className="text-sm font-normal text-gray-400">kg</span></h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ShieldCheck size={20} /></div>
              <p className="text-sm text-gray-500 font-medium">Cegah Polusi</p>
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">{parseFloat(stats.totalSaved).toFixed(2)} <span className="text-sm font-normal text-emerald-400">kg</span></h3>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Zap size={20} /></div>
              <p className="text-sm text-gray-500 font-medium">Level Kamu</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Lvl {user.level || user.current_level || 1}</h3>
          </div>
        </div>

        {/* --- GRAFIK MERAH VS HIJAU --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Tren Jejak Karbon</h2>
              <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Emisi</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Hemat</div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 320 }}>
                {stats.graphData && stats.graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={stats.graphData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Line name="Emisi CO2" type="monotone" dataKey="emission" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
                      <Line name="CO2 Dihemat" type="monotone" dataKey="saved" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex items-center justify-center text-gray-400" style={{ height: 320 }}>
                    <p>Belum ada data grafik</p>
                </div>
                )}
            </div>
        </div>

        {user && (
          <ActivityModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            userId={user.id} 
            onRefresh={() => fetchAllData(user.id)}
            // 🔥 INI PENTING: Oper fungsi force update ke Modal 🔥
            onUpdateStreak={handleForceStreak}
          />
        )}
      </main>
    </div>
  );
}