'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import BadgeCollection from '@/components/BadgeCollection';
import { 
  User, Mail, Calendar, TrendingUp, ShieldCheck, Leaf, 
  Award, Zap, Heart, Trophy, Sparkles, Target, 
  Activity, BarChart3, Flame, Crown
} from 'lucide-react';

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

        // C. Ambil Detail User TERBARU (Level, XP, Health, Rank)
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
            
            // Update stats dengan data dari profile (termasuk rank)
            if (dataUser.stats) {
                setStats(prev => ({...prev, ...dataUser.stats}));
            }
        }

    } catch (error) {
        console.error("Gagal ambil data profil", error);
    } finally {
        setLoading(false);
    }
  };

  // Calculated stats (MUST be before early return)
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalBadges = badges.length;
  const completionRate = totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;
  const xpToNextLevel = user ? (user.current_level || user.level || 1) * 100 : 100;
  const xpProgress = user ? Math.min(100, ((user.total_xp || 0) / xpToNextLevel) * 100) : 0;
  const netImpact = (stats.totalSaved || 0) - (stats.totalEmission || 0);

  // Badge tiers (useMemo must be before early return)
  const badgesByTier = useMemo(() => {
    const tiers = { bronze: [], silver: [], gold: [], diamond: [], legendary: [] };
    badges.forEach(badge => {
      if (tiers[badge.tier]) tiers[badge.tier].push(badge);
    });
    return tiers;
  }, [badges]);

  // Early return AFTER all hooks
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/10 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="relative overflow-visible rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-gradient rounded-3xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border-2 border-white dark:border-gray-700">
              {/* Top Section: Avatar + Basic Info */}
              <div className="flex items-center gap-6 mb-6">
                {/* Enhanced Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl border-4 border-white dark:border-gray-700 shadow-2xl text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                    {user.username}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-1.5 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-700">
                      <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400"/>
                      <span className="text-emerald-700 dark:text-emerald-400">{user.total_xp || 0} Total XP</span>
                    </span>
                    {stats.rank && (
                      <span className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-3 py-1.5 rounded-lg text-sm font-semibold border border-yellow-300 dark:border-yellow-700">
                        <Trophy size={14} className="text-yellow-600 dark:text-yellow-400"/>
                        <span className="text-yellow-700 dark:text-yellow-400">Peringkat #{stats.rank}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Level/Rank + Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Level Progress */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 p-5 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                      <Crown className="text-white" size={28} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Current Level</p>
                      <p className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                        Level {user.level || user.current_level || 1}
                      </p>
                    </div>
                  </div>
                  
                  {/* XP Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Progress to Level {(user.level || user.current_level || 1) + 1}</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="h-4 bg-white dark:bg-gray-700 rounded-full overflow-hidden border-2 border-yellow-300 dark:border-yellow-600 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ width: `${xpProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                      🎯 {Math.max(0, xpToNextLevel - (user.total_xp || 0))} XP lagi untuk level up!
                    </p>
                  </div>
                </div>

                {/* Middle: Leaderboard Rank */}
                {stats.rank && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 dark:bg-purple-500/20 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                          <Trophy className="text-white" size={28} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Peringkat Global</p>
                          <p className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            #{stats.rank}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-600 dark:text-gray-400">Dari Total Pemain</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{stats.totalUsers || '...'} users</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                          {stats.rank <= 3 ? '🏆 Top 3 Champion!' : 
                           stats.rank <= 10 ? '🌟 Top 10 Elite!' :
                           stats.rank <= 50 ? '⭐ Top 50 Player!' :
                           '💪 Terus semangat!'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right: Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 text-center">
                    <ShieldCheck className="text-emerald-600 mx-auto mb-1" size={20} />
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-1">CO2 Hemat</div>
                    <div className="text-2xl font-black text-emerald-700">{parseFloat(stats.totalSaved || 0).toFixed(1)}</div>
                    <div className="text-xs text-emerald-600 font-semibold">kg</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-3 rounded-xl border-2 border-purple-200 dark:border-purple-700 text-center">
                    <Trophy className="text-purple-600 mx-auto mb-1" size={20} />
                    <div className="text-xs font-bold text-purple-600 uppercase mb-1">Badges</div>
                    <div className="text-2xl font-black text-purple-700">{unlockedCount}/{totalBadges}</div>
                    <div className="text-xs text-purple-600 font-semibold">{completionRate}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 text-center">
                    <Activity className="text-blue-600 mx-auto mb-1" size={20} />
                    <div className="text-xs font-bold text-blue-600 uppercase mb-1">Aktivitas</div>
                    <div className="text-2xl font-black text-blue-700">{stats.totalLogs || 0}</div>
                    <div className="text-xs text-blue-600 font-semibold">logs</div>
                  </div>
                  <div className={`bg-gradient-to-br p-3 rounded-xl border-2 text-center ${
                    netImpact >= 0 
                      ? 'from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-200 dark:border-teal-700' 
                      : 'from-red-50 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-700'
                  }`}>
                    <BarChart3 className={`mx-auto mb-1 ${netImpact >= 0 ? 'text-teal-600' : 'text-red-600'}`} size={20} />
                    <div className={`text-xs font-bold uppercase mb-1 ${netImpact >= 0 ? 'text-teal-600' : 'text-red-600'}`}>Impact</div>
                    <div className={`text-2xl font-black ${netImpact >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
                      {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(1)}
                    </div>
                    <div className={`text-xs font-semibold ${netImpact >= 0 ? 'text-teal-600' : 'text-red-600'}`}>kg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl">
                <Flame className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Streak Tertinggi</p>
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{user.current_streak || 0} hari</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Kesehatan Pulau</p>
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{user.island_health || 0} HP</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Total XP</p>
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{user.total_xp || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Badge Rank</p>
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">#{completionRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Badges Section */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-visible">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3 mb-2">
                            <Trophy className="text-yellow-500" size={32} />
                            Koleksi Penghargaan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Selesaikan misi untuk membuka badge eksklusif!</p>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="w-full md:w-80">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Progress Koleksi</span>
                            <span className="text-lg font-black text-yellow-600 dark:text-yellow-400">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-1000 relative overflow-hidden" 
                                style={{ width: `${completionRate}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{unlockedCount} terbuka</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{totalBadges - unlockedCount} terkunci</span>
                        </div>
                    </div>
                </div>

                {/* Badge Tier Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                    {[
                        { tier: 'bronze', label: 'Bronze', color: 'from-amber-600 to-orange-700', icon: '🥉' },
                        { tier: 'silver', label: 'Silver', color: 'from-gray-400 to-gray-600', icon: '🥈' },
                        { tier: 'gold', label: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
                        { tier: 'diamond', label: 'Diamond', color: 'from-blue-400 to-indigo-600', icon: '💎' },
                        { tier: 'legendary', label: 'Legendary', color: 'from-purple-500 to-pink-600', icon: '👑' }
                    ].map(({ tier, label, color, icon }) => {
                        const tierBadges = badgesByTier[tier] || [];
                        const unlocked = tierBadges.filter(b => b.unlocked).length;
                        return (
                            <div key={tier} className={`bg-gradient-to-br ${color} p-3 rounded-xl text-white text-center`}>
                                <div className="text-2xl mb-1">{icon}</div>
                                <div className="text-xs font-semibold opacity-90">{label}</div>
                                <div className="text-lg font-black">{unlocked}/{tierBadges.length}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="relative inline-block">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 dark:border-yellow-700 border-t-yellow-500"></div>
                        <Trophy className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-500" size={24} />
                    </div>
                    <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Memuat koleksi badge...</p>
                </div>
            ) : (
                <BadgeCollection badges={badges} />
            )}
        </div>

      </main>
    </div>
  );
}