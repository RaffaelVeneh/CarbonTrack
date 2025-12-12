'use client';

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import NotificationDropdown from '@/components/NotificationDropdown';
import DailyMissionsTab from '@/components/DailyMissionsTab';
import { Target, CheckCircle, Lock, Zap, PartyPopper, TrendingUp, ArrowRight } from 'lucide-react';
import { useBadge } from '@/contexts/BadgeContext';

// Lazy load heavy components
const EcoPlant = lazy(() => import('@/components/EcoPlant'));
const Confetti = lazy(() => import('react-confetti'));

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [notification, setNotification] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetActivityId, setTargetActivityId] = useState(null);

  // Tab system for Daily Missions
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'daily'
  const [plantHealth, setPlantHealth] = useState(0);
  const [dailyMissionsRefreshKey, setDailyMissionsRefreshKey] = useState(0);

  const { checkBadges } = useBadge();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Memoized fetch function (without isLoading in deps to avoid infinite loop)
  const fetchMissions = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/missions/${userId}`, {
        headers: { 'Cache-Control': 'max-age=300' } // Cache 5 menit
      });
      const data = await res.json();
      
      if (data.missions) setMissions(data.missions);
      if (data.levelInfo) setLevelInfo(data.levelInfo);
    } catch (err) { 
      console.error('Fetch missions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // Fetch plant health
  const fetchPlantHealth = useCallback(async (userId) => {
    try {
      const res = await fetch(`${API_URL}/missions/daily/plant-health/${userId}`);
      const data = await res.json();
      console.log('🌻 Fetched plant health:', data);
      setPlantHealth(data.plant_health || 0);
    } catch (err) {
      console.error('Fetch plant health error:', err);
    }
  }, [API_URL]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) {
      fetchMissions(userData.id);
      fetchPlantHealth(userData.id);
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
        const res = await fetch(`${API_URL}/missions/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, missionId }),
        });
        const result = await res.json();

        if (res.ok) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
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
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 flex items-center justify-center h-full">
                    <div className="animate-pulse text-emerald-600">Loading plant...</div>
                  </div>
                }>
                  <EcoPlant plantHealth={plantHealth} />
                </Suspense>
            </div>

        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-2 shadow-sm inline-flex gap-2">
            <button
              onClick={() => handleTabSwitch('main')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'main'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
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
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                ⏰ Misi Harian
              </span>
            </button>
          </div>
        </div>

        {/* --- CONDITIONAL CONTENT --- */}
        {activeTab === 'main' && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Target className="text-emerald-600"/> Misi Tersedia
            </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div key={mission.id} className={`p-6 rounded-3xl border-2 relative overflow-hidden transition-all hover:-translate-y-1 duration-300
                ${mission.is_locked 
                    ? 'bg-gray-100 border-gray-200 opacity-70' 
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200'}
            `}>
              
              {mission.is_locked && (
                  <div className="absolute inset-0 bg-gray-100/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-gray-200">
                        <Lock size={16} className="text-gray-400"/>
                        <span className="font-bold text-gray-500 text-xs uppercase tracking-wide">Level {mission.min_level}</span>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                    {mission.icon || '🎯'}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      mission.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                      mission.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {mission.difficulty}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">+{mission.xp_reward} XP</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{mission.title}</h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{mission.description}</p>
              
              {!mission.is_claimed && !mission.is_locked && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-semibold">Progress</span>
                      <span className="font-bold text-emerald-600">{mission.progress_text}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (mission.progress / mission.target_value) * 100)}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                  {mission.is_completable && !mission.is_claimed && (
                      <button 
                        onClick={() => handleClaim(mission.id)} 
                        className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 transform active:scale-95 transition-all"
                      >
                        <Zap size={18} fill="currentColor" /> Klaim Reward
                      </button>
                  )}

                  {!mission.is_completable && !mission.is_claimed && !mission.is_locked && (
                      <button 
                        onClick={() => handleDoMission(mission.required_activity_id)} 
                        className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-200 transition-all"
                      >
                        Lakukan <ArrowRight size={18} />
                      </button>
                  )}

                  {mission.is_claimed && (
                      <button disabled className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gray-50 text-gray-400 cursor-default border border-gray-100">
                        <CheckCircle size={18} /> Selesai
                      </button>
                  )}
              </div>

            </div>
          ))}
        </div>
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

      </main>
    </div>
  );
}