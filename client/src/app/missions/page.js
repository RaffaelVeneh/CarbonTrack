'use client';

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import NotificationDropdown from '@/components/NotificationDropdown';
import DailyMissionsTab from '@/components/DailyMissionsTab';
import WeeklyMissionsTab from '@/components/WeeklyMissionsTab';
import { Target, CheckCircle, Lock, Zap, PartyPopper, TrendingUp, ArrowRight } from 'lucide-react';
import { useBadge } from '@/contexts/BadgeContext';
import { getUserFromStorage } from '@/utils/userStorage';
import { apiGet, apiPost } from '@/utils/auth';
import { checkBannedStatus } from '@/utils/bannedCheck';
import useAuth from '@/hooks/useAuth';

// Lazy load heavy components
const EcoPlant = lazy(() => import('@/components/EcoPlant'));
const Confetti = lazy(() => import('react-confetti'));

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [notification, setNotification] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetActivityId, setTargetActivityId] = useState(null);

  // Tab system for Daily and Weekly Missions
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'daily', or 'weekly'
  const [plantHealth, setPlantHealth] = useState(0);
  const [dailyMissionsRefreshKey, setDailyMissionsRefreshKey] = useState(0);
  const [weeklyMissionsRefreshKey, setWeeklyMissionsRefreshKey] = useState(0);

  const { checkBadges } = useBadge();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Memoized fetch function (without isLoading in deps to avoid infinite loop)
  const fetchMissions = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const data = await apiGet(`/missions/${userId}`);
      
      if (data.missions) setMissions(data.missions);
      if (data.levelInfo) setLevelInfo(data.levelInfo);
    } catch (err) { 
      console.error('Fetch missions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch plant health
  const fetchPlantHealth = useCallback(async (userId) => {
    try {
      const data = await apiGet(`/missions/daily/plant-health/${userId}`);
      console.log('🌻 Fetched plant health:', data);
      setPlantHealth(data.plant_health || 0);
    } catch (err) {
      console.error('Fetch plant health error:', err);
    }
  }, []);

  useEffect(() => {
    // ⚡ CRITICAL: Check banned status first
    if (checkBannedStatus()) {
      return; // Will redirect to /banned
    }

    const userData = getUserFromStorage();
    setUser(userData);
    if (userData) {
      Promise.all([
        fetchMissions(userData.id),
        fetchPlantHealth(userData.id)
      ]).finally(() => {
        setInitialLoading(false);
      });
    } else {
      setInitialLoading(false);
    }
  }, []); // Empty deps - only run once on mount

  const handleDoMission = useCallback((requiredActivityId) => {
    setTargetActivityId(requiredActivityId); 
    setIsActivityModalOpen(true);
  }, []);

  const handleClaim = useCallback(async (missionId) => {
    // Prevent duplicate claims
    setIsLoading(true);
    try {
        const { apiPost } = await import('@/utils/auth');
        
        const result = await apiPost('/missions/claim', {
            userId: user.id,
            missionId
        });

        if (result) {
            // OPTIMISTIC UI UPDATE - Update state dulu tanpa fetch ulang
            const updatedMissions = missions.map(m => 
                m.id === missionId ? { ...m, is_claimed: true, is_completable: false } : m
            );
            setMissions(updatedMissions);

            // Update level info dari response (backend sudah kirim data lengkap)
            if (result.newLevel && result.currentXP !== undefined) {
                setLevelInfo(prev => {
                    const xpPerLevel = prev?.xpPerLevel || result.xpPerLevel || 100;
                    const xpProgress = result.currentXP - ((result.newLevel - 1) * xpPerLevel);
                    return {
                        ...prev,
                        currentLevel: result.newLevel,
                        currentXP: result.currentXP,
                        xpProgress: xpProgress,
                        xpPerLevel: xpPerLevel,
                        progressPercentage: Math.floor((xpProgress / xpPerLevel) * 100)
                    };
                });
            }

            const leveledUp = result.leveledUp || false;

            if (leveledUp) {
                setShowConfetti(true);
                setNotification({
                    type: 'level_up',
                    message: 'Luar biasa! Kamu berhasil naik level! 🎉',
                    xpAdded: result.xpAdded,
                    newLevel: result.newLevel,
                    level: result.newLevel
                });
                setTimeout(() => setShowConfetti(false), 5000);
            } else {
                setNotification({
                    type: 'xp_progress',
                    message: `Mantap! Misi selesai. Lihat progress XP-mu!`,
                    xpAdded: result.xpAdded,
                    currentXP: result.currentXP,
                    maxXP: result.xpPerLevel,
                    xpPercentage: result.xpPercentage
                });
            }

            // Badge check dengan debounce (500ms delay, tidak blocking)
            setTimeout(() => {
                checkBadges(user.id).catch(err => console.error('Badge check error:', err));
            }, 500);

        } else {
            setNotification({ 
                type: 'error', 
                message: result.message || 'Terjadi kesalahan saat mengklaim misi.'
            });
        }
    } catch (error) { 
        console.error(error);
        setNotification({ 
            type: 'error', 
            message: 'Gagal mengklaim misi. Silakan coba lagi.'
        });
    } finally {
        setIsLoading(false);
    }
  }, [API_URL, user, missions, checkBadges, isLoading]);

  const closeNotification = useCallback(() => setNotification(null), []);

  // Memoized computations
  const xpPercentage = useMemo(() => {
    if (!levelInfo) return 0;
    return (levelInfo.xpProgress / levelInfo.xpPerLevel) * 100;
  }, [levelInfo]);
  
  const completedMissionsCount = useMemo(() => {
    return missions.filter(m => m.is_claimed).length;
  }, [missions]);

  // Tab click handler
  const handleTabSwitch = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  if (!user || !levelInfo) return null;

  // Loading State
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          {/* Skeleton Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
            <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-700 rounded-3xl h-48"></div>
            <div className="lg:col-span-1 bg-gray-200 dark:bg-gray-700 rounded-3xl h-48"></div>
          </div>
          
          {/* Skeleton Tabs */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl p-2 inline-flex gap-2 animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-12 w-32 rounded-xl"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-12 w-32 rounded-xl"></div>
            <div className="bg-gray-200 dark:bg-gray-700 h-12 w-32 rounded-xl"></div>
          </div>
          
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-24"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-24"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-24"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-24"></div>
          </div>
          
          {/* Skeleton Missions */}
          <div className="space-y-4 animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans">
      <Sidebar />
      
      {showConfetti && (
        <Suspense fallback={null}>
          <Confetti recycle={false} numberOfPieces={800} gravity={0.3} />
        </Suspense>
      )}

      {/* Notification */}
      <NotificationDropdown 
        notification={notification}
        onClose={closeNotification}
      />

      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        userId={user.id}
        onRefresh={() => {
          fetchMissions(user.id);
          // Refresh daily missions jika sedang di tab daily
          if (activeTab === 'daily') {
            setDailyMissionsRefreshKey(prev => prev + 1);
          }
          // Refresh weekly missions jika sedang di tab weekly
          if (activeTab === 'weekly') {
            setWeeklyMissionsRefreshKey(prev => prev + 1);
          }
        }} 
        initialActivityId={targetActivityId} 
      />

      <main className="flex-1 ml-64 p-8">
        
        {/* --- GRID HEADER: LEVEL & TAMAGOTCHI --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* KOTAK KIRI: LEVEL PROGRESS (Lebar 2 Kolom) */}
            <div className="lg:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden flex flex-col justify-end">
                <div className="relative z-10 flex justify-between items-end mb-2">
                    <div>
                        <h2 className="text-4xl font-extrabold mb-1">Level {levelInfo.currentLevel}</h2>
                        <p className="opacity-90 font-medium">Eco Warrior</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{levelInfo.xpProgress} <span className="text-sm opacity-70">/ {levelInfo.xpPerLevel} XP</span></p>
                    </div>
                </div>
                <div className="bg-black/20 rounded-full h-4 w-full overflow-hidden backdrop-blur-sm">
                    <div className="bg-yellow-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.7)]" style={{ width: `${xpPercentage}%` }}></div>
                </div>
                
                {/* Hiasan background */}
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <TrendingUp size={200} />
                </div>
            </div>

            {/* KOTAK KANAN: TAMAGOTCHI TANAMAN (Lebar 1 Kolom) */}
            <div className="lg:col-span-1 h-full min-h-[250px]">
                <Suspense fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-emerald-100 dark:border-gray-700 flex items-center justify-center h-full">
                    <div className="animate-pulse text-emerald-600 dark:text-emerald-400">Loading plant...</div>
                  </div>
                }>
                  <EcoPlant plantHealth={plantHealth} />
                </Suspense>
            </div>

        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm inline-flex gap-2">
            <button
              onClick={() => handleTabSwitch('main')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'main'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Target size={18} />
                Misi Utama
              </span>
            </button>
            <button
              onClick={() => handleTabSwitch('daily')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                ⏰ Misi Harian
              </span>
            </button>
            <button
              onClick={() => handleTabSwitch('weekly')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'weekly'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                📅 Misi Mingguan
              </span>
            </button>
          </div>
        </div>

        {/* --- CONDITIONAL CONTENT --- */}
        {activeTab === 'main' && (
          <>
            {/* Mission Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <Target className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total Misi</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{missions.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <CheckCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Selesai</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{completedMissionsCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-2xl border-2 border-purple-100 dark:border-purple-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-xl">
                    <Zap className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Bisa Diklaim</p>
                    <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                      {missions.filter(m => m.is_completable && !m.is_claimed).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-2xl border-2 border-yellow-100 dark:border-yellow-700/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 rounded-xl">
                    <PartyPopper className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total XP</p>
                    <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">
                      {missions.reduce((sum, m) => sum + (m.is_claimed ? m.xp_reward : 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Target className="text-emerald-600 dark:text-emerald-400"/> Misi Tersedia
            </h3>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-3xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
              <Target className="text-gray-300 dark:text-gray-600" size={64} />
            </div>
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">Tidak Ada Misi Tersedia</h3>
            <p className="text-gray-500 dark:text-gray-400">Misi baru akan segera hadir!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div key={mission.id} className={`p-6 rounded-3xl border-2 relative overflow-hidden transition-all hover:-translate-y-1 duration-300
                ${mission.is_locked 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700'}
            `}>
              
              {mission.is_locked && (
                  <div className="absolute inset-0 bg-gray-100/60 dark:bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                        <Lock size={16} className="text-gray-400 dark:text-gray-500"/>
                        <span className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Level {mission.min_level}</span>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    {mission.icon || '🎯'}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      mission.difficulty === 'easy' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                      mission.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                    }`}>
                      {mission.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-700">+{mission.xp_reward} XP</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight">{mission.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">{mission.description}</p>
              
              {!mission.is_claimed && !mission.is_locked && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Progress</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{mission.progress_text}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, (mission.progress / mission.target_value) * 100)}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                  {mission.is_completable && !mission.is_claimed && (
                      <button 
                        onClick={() => handleClaim(mission.id)} 
                        className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 transform active:scale-95 transition-all"
                      >
                        <Zap size={18} fill="currentColor" /> Klaim Reward
                      </button>
                  )}

                  {!mission.is_completable && !mission.is_claimed && !mission.is_locked && (
                      <button 
                        onClick={() => handleDoMission(mission.required_activity_id)} 
                        className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-2 border-emerald-100 dark:border-emerald-700 hover:border-emerald-200 dark:hover:border-emerald-600 transition-all"
                      >
                        Lakukan <ArrowRight size={18} />
                      </button>
                  )}

                  {mission.is_claimed && (
                      <button disabled className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default border border-gray-100 dark:border-gray-600">
                        <CheckCircle size={18} /> Selesai
                      </button>
                  )}
              </div>

            </div>
          ))}
          </div>
        )}
          </>
        )}

        {/* --- DAILY MISSIONS TAB --- */}
        {activeTab === 'daily' && (
          <DailyMissionsTab 
            userId={user.id}
            API_URL={API_URL}
            onActivitySelect={handleDoMission}
            refreshKey={dailyMissionsRefreshKey}
            onClaimSuccess={(result) => {
              console.log('🎉 Claim success result:', result);
              
              // Update plant health state immediately
              setPlantHealth(result.newPlantHealth);
              console.log('🌻 Updated plant health to:', result.newPlantHealth);
              
              // Also refresh to ensure data consistency
              fetchPlantHealth(user.id);
              
              // Update level info if XP changed
              if (result.newXP !== undefined && result.newLevel) {
                console.log('📊 Updating levelInfo:', {
                  oldXP: levelInfo?.currentXP,
                  newXP: result.newXP,
                  oldLevel: levelInfo?.currentLevel,
                  newLevel: result.newLevel
                });
                
                const xpPerLevel = levelInfo?.xpPerLevel || 100;
                const xpProgress = result.newXP - ((result.newLevel - 1) * xpPerLevel);
                
                setLevelInfo(prev => ({
                  ...prev,
                  currentLevel: result.newLevel,
                  currentXP: result.newXP,
                  xpProgress: xpProgress,
                  progressPercentage: result.xpPercentage || Math.floor((xpProgress / xpPerLevel) * 100)
                }));
              }
              
              // Show combined notification (XP + Health in grid)
              if (result.leveledUp) {
                setShowConfetti(true);
                setNotification({
                  type: 'level_up',
                  level: result.newLevel,
                  message: 'Luar biasa! Kamu berhasil naik level! 🎉',
                  xpAdded: result.xpAdded,
                });
                setTimeout(() => setShowConfetti(false), 5000);
              } else {
                setNotification({
                  type: 'combined',
                  message: 'Mantap! Misi harian selesai.',
                  xpAdded: result.xpAdded,
                  healthAdded: result.healthAdded,
                  currentXP: result.newXP,
                  maxXP: levelInfo?.xpPerLevel || 1000,
                  xpPercentage: result.xpPercentage,
                  newPlantHealth: result.newPlantHealth,
                });
              }

              // Badge check
              setTimeout(() => {
                checkBadges(user.id).catch(err => console.error('Badge check error:', err));
              }, 500);
            }}
          />
        )}

        {/* --- WEEKLY MISSIONS TAB --- */}
        {activeTab === 'weekly' && (
          <WeeklyMissionsTab 
            userId={user.id}
            API_URL={API_URL}
            onActivitySelect={handleDoMission}
            refreshKey={weeklyMissionsRefreshKey}
            onClaimSuccess={(result) => {
              console.log('🎉 Weekly mission claim success:', result);
              
              // Update plant health state immediately (check both possible keys)
              const newHealth = result.newPlantHealth || result.plant_health || result.newHealth;
              if (newHealth !== undefined) {
                setPlantHealth(newHealth);
                console.log('🌻 Updated plant health to:', newHealth);
              }
              
              // Also refresh to ensure data consistency
              fetchPlantHealth(user.id);
              
              // Update level info if XP changed (always update, not just when leveled up)
              if (result.newXP !== undefined || result.currentXP !== undefined) {
                const xpPerLevel = levelInfo?.xpPerLevel || result.xpPerLevel || 100;
                const updatedXP = result.newXP || result.currentXP;
                const updatedLevel = result.newLevel || result.currentLevel || levelInfo?.currentLevel;
                const xpProgress = updatedXP - ((updatedLevel - 1) * xpPerLevel);
                
                console.log('📊 Updating levelInfo:', {
                  oldXP: levelInfo?.currentXP,
                  newXP: updatedXP,
                  oldLevel: levelInfo?.currentLevel,
                  newLevel: updatedLevel
                });
                
                setLevelInfo(prev => ({
                  ...prev,
                  currentLevel: updatedLevel,
                  currentXP: updatedXP,
                  xpProgress: xpProgress,
                  xpPerLevel: xpPerLevel,
                  progressPercentage: result.xpPercentage || Math.floor((xpProgress / xpPerLevel) * 100)
                }));
              }
              
              // Show notification
              if (result.leveledUp) {
                setShowConfetti(true);
                setNotification({
                  type: 'level_up',
                  level: result.newLevel,
                  message: 'Luar biasa! Kamu berhasil naik level! 🎉',
                  xpAdded: result.xpAdded,
                });
                setTimeout(() => setShowConfetti(false), 5000);
              } else {
                setNotification({
                  type: 'combined',
                  message: 'Mantap! Misi mingguan selesai.',
                  xpAdded: result.xpAdded,
                  healthAdded: result.healthAdded,
                  currentXP: result.newXP,
                  maxXP: levelInfo?.xpPerLevel || 1000,
                  xpPercentage: result.xpPercentage,
                  newPlantHealth: result.newPlantHealth,
                });
              }

              // Badge check
              setTimeout(() => {
                checkBadges(user.id).catch(err => console.error('Badge check error:', err));
              }, 500);
            }}
          />
        )}

      </main>
    </div>
  );
}