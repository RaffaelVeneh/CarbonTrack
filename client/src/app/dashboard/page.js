'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import Lottie from 'lottie-react'; 

// Import Animasi
import healthyAnim from '@/assets/lottie/healthy.json';
import normalAnim from '@/assets/lottie/normal.json';
import deadAnim from '@/assets/lottie/dead.json';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Leaf, Zap, TrendingDown, Plus, Heart, ShieldCheck, Flame, 
  Trophy, Target, Calendar, Clock, ArrowRight, Sparkles, 
  TrendingUp, Award, CheckCircle, Activity, AlertCircle,
  BarChart3, Lightbulb, Star
} from 'lucide-react';

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
    graphData: [],
    yesterdayEmission: 0,
    yesterdaySaved: 0
  });

  // State Animasi Pohon
  const [treeConfig, setTreeConfig] = useState({ 
    anim: null, 
    text: 'Memuat...', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-200' 
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Motivational tips array
  const tips = useMemo(() => [
    { icon: Lightbulb, text: "Matikan lampu saat tidak digunakan untuk hemat energi!", color: "yellow" },
    { icon: Leaf, text: "Gunakan transportasi umum untuk kurangi emisi karbon!", color: "green" },
    { icon: ShieldCheck, text: "Daur ulang sampah plastik untuk jaga lingkungan!", color: "blue" },
    { icon: Heart, text: "Kurangi penggunaan AC untuk hemat listrik!", color: "red" },
    { icon: Sparkles, text: "Bawa botol minum sendiri, kurangi sampah plastik!", color: "purple" },
    { icon: Target, text: "Tanam pohon untuk serap CO2 dan sejukkan bumi!", color: "emerald" }
  ], []);

  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [tips]);
  
  // FUNGSI 1: Ambil Data Terbaru (Stats + Health User)
  const fetchAllData = useCallback(async (userId) => {
    setLoading(true);
    try {
      // A. Ambil Statistik
      const resStats = await fetch(`${API_URL}/logs/summary/${userId}`);
      const dataStats = await resStats.json();
      
      const normalizedStats = {
        todayEmission: parseFloat(dataStats?.todayEmission || 0),
        todaySaved: parseFloat(dataStats?.todaySaved || 0),
        totalEmission: parseFloat(dataStats?.totalEmission || 0),
        totalSaved: parseFloat(dataStats?.totalSaved || 0),
        yesterdayEmission: parseFloat(dataStats?.yesterdayEmission || 0),
        yesterdaySaved: parseFloat(dataStats?.yesterdaySaved || 0),
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

      // B. Ambil Recent Activities
      try {
        const resActivities = await fetch(`${API_URL}/logs/daily/${userId}`);
        if (resActivities.ok) {
          const dataActivities = await resActivities.json();
          if (Array.isArray(dataActivities)) {
            setRecentActivities(dataActivities.slice(0, 5)); // Ambil 5 terakhir
          }
        } else {
          console.log('Recent activities endpoint not available yet');
          setRecentActivities([]);
        }
      } catch (err) {
        console.log('Failed to fetch recent activities:', err.message);
        setRecentActivities([]);
      }

      // C. Ambil Profil User TERBARU (Health & Level & Streak)
      const resUser = await fetch(`${API_URL}/users/profile/${userId}`);
      const dataUser = await resUser.json();
      
      if (resUser.ok && dataUser.user) {
        const updatedUser = { 
            ...user, 
            ...dataUser.user,
            level: dataUser.user.current_level || dataUser.user.level 
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateTreeUI(dataUser.user.island_health);
      }

    } catch (error) {
      console.error("Gagal ambil data", error);
    } finally {
      setLoading(false);
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
    
    // Format tanggal konsisten dengan backend (YYYY-MM-DD dalam UTC)
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Kita manipulasi state user secara lokal
    const updatedUser = {
        ...user,
        current_streak: newStreakValue, // Paksa ganti angka streak
        last_log_date: formattedDate // Format YYYY-MM-DD biar konsisten dengan isStreakActiveToday()
    };

    console.log("🚀 Frontend forcing streak update:", {
      newStreak: newStreakValue,
      last_log_date: formattedDate,
      comparison: formattedDate === new Date().toLocaleDateString('en-CA')
    });
    
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

  // Calculated Stats
  const netImpact = useMemo(() => stats.totalSaved - stats.totalEmission, [stats]);
  const todayComparison = useMemo(() => {
    const diff = stats.todayEmission - stats.yesterdayEmission;
    return { value: Math.abs(diff), isIncrease: diff > 0 };
  }, [stats]);
  const xpToNextLevel = useMemo(() => {
    if (!user) return 0;
    const currentLevel = user.current_level || user.level || 1;
    return currentLevel * 100;
  }, [user]);
  const xpProgress = useMemo(() => {
    if (!user) return 0;
    return Math.min(100, ((user.total_xp || 0) / xpToNextLevel) * 100);
  }, [user, xpToNextLevel]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/10 to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Enhanced Header */}
        <div className="mb-8 relative z-10">
          <div className="relative overflow-visible rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-blue-400/10 animate-gradient rounded-3xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border-2 border-white dark:border-gray-700 overflow-visible">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-xl flex items-center justify-center text-2xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                        Halo, {user.username}!
                      </h1>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full border-2 border-blue-200 dark:border-blue-700">
                        <Award className="text-blue-600 dark:text-blue-400" size={18} />
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Level {user.level || user.current_level || 1}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Selamat datang di dashboard carbon tracking kamu</p>
                  </div>
                </div>
          
                <div className="flex items-center gap-4">
            
                  {/* Enhanced Streak Badge */}
                  <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all cursor-help relative group select-none shadow-lg z-50
                      ${isStreakActiveToday() 
                          ? 'bg-gradient-to-br from-orange-400 to-red-500 border-orange-300 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 grayscale'
                      }`}
                  >
                      <div className={`text-3xl ${isStreakActiveToday() ? 'animate-bounce drop-shadow-md' : ''}`}>
                          <Flame fill={isStreakActiveToday() ? "currentColor" : "none"} size={32} />
                      </div>
                      
                      <div className="flex flex-col leading-none">
                          <span className="text-3xl font-black font-mono">{user.current_streak || 0}</span>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-90">Hari Beruntun</span>
                      </div>

                      <div className="absolute top-full mt-3 right-0 w-56 bg-gray-800 dark:bg-gray-700 text-white text-xs p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999]">
                          {isStreakActiveToday() 
                              ? "🔥 Mantap! Streak kamu aman hari ini!" 
                              : "⚠️ Catat aktivitas sekarang agar streak tidak hangus!"}
                          <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-800 dark:bg-gray-700 transform rotate-45"></div>
                      </div>
                  </div>

                  <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl transition transform hover:scale-105 font-bold"
                  >
                      <Plus size={22} /> Catat Aktivitas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status Pulau + Level Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Pulau Virtual */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-emerald-100 dark:border-gray-700 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10"></div>
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="w-48 h-48 flex-shrink-0 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                      {treeConfig.anim ? (
                          <Lottie animationData={treeConfig.anim} loop={true} style={{ width: 160, height: 160 }} />
                      ) : (
                          <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                      )}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-2 mb-2">
                        {user.island_health >= 80 && <Sparkles className="text-yellow-500 dark:text-yellow-400" size={24} />}
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Status Pulau Virtual</h2>
                      </div>
                      <p className={`text-lg font-semibold mb-6 ${treeConfig.color}`}>
                          "{treeConfig.text}"
                      </p>
                      
                      {/* Health Bar */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Heart className="text-red-500 dark:text-red-400 animate-pulse" fill="currentColor" size={20} />
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Nyawa Pulau</span>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200">{user.island_health} HP</span>
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner">
                              <div 
                                  className={`h-full transition-all duration-1000 ease-out ${treeConfig.bgColor}`} 
                                  style={{ width: `${user.island_health}%` }}
                              ></div>
                          </div>
                        </div>

                        {/* XP Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Zap className="text-yellow-500 dark:text-yellow-400" fill="currentColor" size={20} />
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">XP Progress</span>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200">{user.total_xp || 0} / {xpToNextLevel} XP</span>
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner">
                              <div 
                                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out" 
                                  style={{ width: `${xpProgress}%` }}
                              ></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                            {Math.round(xpToNextLevel - (user.total_xp || 0))} XP lagi ke Level {(user.current_level || user.level || 1) + 1}
                          </p>
                        </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Quick Actions + Tip */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500 dark:text-yellow-400" size={20} />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push('/missions')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/50 rounded-xl transition-all group border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center gap-3">
                    <Target className="text-emerald-600 dark:text-emerald-400" size={20} />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Lihat Misi</span>
                  </div>
                  <ArrowRight className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" size={18} />
                </button>
                <button 
                  onClick={() => router.push('/history')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 rounded-xl transition-all group border border-blue-200 dark:border-blue-700"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Riwayat</span>
                  </div>
                  <ArrowRight className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" size={18} />
                </button>
                <button 
                  onClick={() => router.push('/leaderboard')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/50 dark:hover:to-orange-900/50 rounded-xl transition-all group border border-yellow-200 dark:border-yellow-700"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Leaderboard</span>
                  </div>
                  <ArrowRight className="text-yellow-600 dark:text-yellow-400 group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              </div>
            </div>

            {/* Daily Tip */}
            <div className={`
              rounded-2xl shadow-lg border-2 p-6 bg-gradient-to-br
              ${randomTip.color === 'yellow' ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700/30' : ''}
              ${randomTip.color === 'green' ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700/30' : ''}
              ${randomTip.color === 'blue' ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700/30' : ''}
              ${randomTip.color === 'red' ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700/30' : ''}
              ${randomTip.color === 'purple' ? 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700/30' : ''}
              ${randomTip.color === 'emerald' ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700/30' : ''}
            `}>
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${randomTip.color === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-700/40' : ''}
                  ${randomTip.color === 'green' ? 'bg-green-200 dark:bg-green-700/40' : ''}
                  ${randomTip.color === 'blue' ? 'bg-blue-200 dark:bg-blue-700/40' : ''}
                  ${randomTip.color === 'red' ? 'bg-red-200 dark:bg-red-700/40' : ''}
                  ${randomTip.color === 'purple' ? 'bg-purple-200 dark:bg-purple-700/40' : ''}
                  ${randomTip.color === 'emerald' ? 'bg-emerald-200 dark:bg-emerald-700/40' : ''}
                `}>
                  <randomTip.icon className={`
                    ${randomTip.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' : ''}
                    ${randomTip.color === 'green' ? 'text-green-700 dark:text-green-300' : ''}
                    ${randomTip.color === 'blue' ? 'text-blue-700 dark:text-blue-300' : ''}
                    ${randomTip.color === 'red' ? 'text-red-700 dark:text-red-300' : ''}
                    ${randomTip.color === 'purple' ? 'text-purple-700 dark:text-purple-300' : ''}
                    ${randomTip.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' : ''}
                  `} size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                    💡 Tip Hari Ini
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{randomTip.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards dengan Animasi & Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Emisi */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-red-100 dark:border-red-900/30 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-xl shadow-md">
                  <Leaf size={24} />
                </div>
                <AlertCircle className="text-red-300 dark:text-red-500" size={18} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">Total Emisi</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{stats.totalEmission.toFixed(1)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kg</span></h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Sepanjang waktu</p>
            </div>
          </div>

          {/* Emisi Hari Ini + Comparison */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-orange-100 dark:border-orange-900/30 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-yellow-500 text-white rounded-xl shadow-md">
                  <TrendingDown size={24} />
                </div>
                {todayComparison.isIncrease ? (
                  <TrendingUp className="text-orange-500 dark:text-orange-400" size={18} />
                ) : (
                  <TrendingDown className="text-green-500 dark:text-green-400" size={18} />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">Emisi Hari Ini</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{stats.todayEmission.toFixed(1)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kg</span></h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs font-bold ${todayComparison.isIncrease ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {todayComparison.isIncrease ? '+' : '-'}{todayComparison.value.toFixed(1)} kg
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">vs kemarin</span>
              </div>
            </div>
          </div>

          {/* CO2 Saved */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-emerald-100 dark:border-emerald-900/30 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl shadow-md">
                  <ShieldCheck size={24} />
                </div>
                <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={18} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">CO2 Hemat</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.totalSaved.toFixed(1)} <span className="text-sm font-normal text-emerald-400 dark:text-emerald-500">kg</span></h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs font-bold ${netImpact >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  Net: {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Level + XP */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-blue-100 dark:border-blue-900/30 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-xl shadow-md">
                  <Award size={24} />
                </div>
                <Star className="text-yellow-400 fill-yellow-400 animate-pulse" size={20} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mb-1">Level Kamu</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">Level {user.level || user.current_level || 1}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{user.total_xp || 0} Total XP</p>
            </div>
          </div>
        </div>

        {/* Recent Activities Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity className="text-emerald-500 dark:text-emerald-400" size={24} />
              Aktivitas Terbaru
            </h2>
            <button 
              onClick={() => router.push('/history')}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 dark:border-t-emerald-400 mx-auto"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={40} />
              <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada aktivitas tercatat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const isSaved = parseFloat(activity.carbon_saved || 0) > 0;
                return (
                  <div 
                    key={activity.id || index}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      isSaved 
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' 
                        : 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isSaved ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {isSaved ? (
                        <ShieldCheck className="text-white" size={20} />
                      ) : (
                        <Leaf className="text-white" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate">{activity.activity_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        isSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isSaved ? '-' : '+'}{isSaved ? activity.carbon_saved : activity.carbon_emission} kg
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.input_value} {activity.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enhanced Graph */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Tren Jejak Karbon</h2>
              <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Emisi</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Hemat</div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 320 }}>
                {stats.graphData && stats.graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={stats.graphData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tooltip-bg, white)', color: 'var(--tooltip-text, black)' }} />
                      <Legend />
                      <Line name="Emisi CO2" type="monotone" dataKey="emission" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
                      <Line name="CO2 Dihemat" type="monotone" dataKey="saved" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex items-center justify-center text-gray-400 dark:text-gray-500" style={{ height: 320 }}>
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