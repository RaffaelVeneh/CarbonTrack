'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Target, CheckCircle, Lock, Zap, PartyPopper, TrendingUp } from 'lucide-react';
import Confetti from 'react-confetti';
import { useBadge } from '@/contexts/BadgeContext'; // Import badge context 

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalInfo, setModalInfo] = useState({ show: false, title: '', message: '', type: 'success' });
  
  // Get badge context
  const { checkBadges } = useBadge();
  
  // State untuk floating notification
  const [notification, setNotification] = useState({
    show: false,
    oldXP: 0,
    newXP: 0,
    xpGained: 0,
    oldLevel: 0,
    newLevel: 0,
    leveledUp: false,
    oldPercentage: 0,
    newPercentage: 0,
    xpPerLevel: 100 // Default 100 XP per level
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) fetchMissions(userData.id);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const fetchMissions = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/missions/${userId}`);
      const data = await res.json();
      console.log('Missions data:', data);
      
      if (data.missions && data.missions.length > 0) {
        console.log('First mission:', data.missions[0]);
        setMissions(data.missions);
      } else {
        console.warn('No missions returned');
        setMissions([]);
      }
      
      if (data.levelInfo) {
        setLevelInfo(data.levelInfo);
      }
    } catch (err) { 
      console.error('Fetch missions error:', err);
      setMissions([]);
    }
  };

  const handleClaim = async (missionId) => {
    try {
        // Simpan state sebelum claim
        const oldXP = levelInfo.currentXP;
        const oldLevel = levelInfo.currentLevel;
        const xpPerLevel = levelInfo.xpPerLevel; // 100 XP per level
        
        // Hitung XP progress SEBELUM claim
        // xpProgress sudah merupakan XP di level saat ini dari backend
        const oldXPInCurrentLevel = levelInfo.xpProgress;
        const oldPercentage = (oldXPInCurrentLevel / xpPerLevel) * 100;

        const res = await fetch(`${API_URL}/missions/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, missionId }),
        });
        const result = await res.json();
        console.log('Claim result:', result);

        if (res.ok) {
            // Hitung data untuk notification SEBELUM fetch
            const xpGained = result.xpAdded || 0;
            const newLevel = result.newLevel || oldLevel;
            const leveledUp = result.leveledUp || false;
            
            // Hitung new XP in current level
            let newXPInCurrentLevel;
            if (leveledUp) {
                // Jika level up, ambil sisa XP dari backend
                newXPInCurrentLevel = result.xpProgress || 0;
            } else {
                // Jika tidak level up, tambahkan XP gained
                newXPInCurrentLevel = oldXPInCurrentLevel + xpGained;
            }
            
            const newPercentage = (newXPInCurrentLevel / xpPerLevel) * 100;
            
            console.log('XP Calculation:', {
                oldXP,
                oldXPInCurrentLevel,
                xpGained,
                newXPInCurrentLevel,
                oldPercentage,
                newPercentage,
                leveledUp,
                oldLevel,
                newLevel
            });
            
            // Show floating notification LANGSUNG
            setNotification({
                show: true,
                oldXP: oldXPInCurrentLevel,
                newXP: newXPInCurrentLevel,
                xpGained,
                oldLevel,
                newLevel,
                leveledUp,
                oldPercentage,
                newPercentage,
                xpPerLevel
            });

            // Confetti untuk level up
            if (leveledUp) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }

            // Auto-hide notification after 5 seconds
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 5000);
            
            // Fetch missions DAN check badges secara parallel (tidak block)
            Promise.all([
                fetchMissions(user.id),
                checkBadges(user.id)
            ]);
        } else {
            // Error tetap pakai modal
            setModalInfo({ show: true, type: 'error', title: 'Ups!', message: result.message });
        }
    } catch (error) { 
        console.error(error); 
    }
  };

  const closeModal = () => setModalInfo({ ...modalInfo, show: false });

  if (!user || !levelInfo) return null;

  // Hitung persentase XP untuk progress bar
  const xpPercentage = (levelInfo.xpProgress / levelInfo.xpPerLevel) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* === FLOATING XP NOTIFICATION === */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        notification.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 shadow-2xl text-white min-w-[400px] border-4 border-white relative overflow-hidden">
          
          {/* Celebration Confetti Background (untuk level up) */}
          {notification.leveledUp && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Falling confetti emojis */}
              {[...Array(20)].map((_, i) => (
                <span
                  key={i}
                  className="absolute text-2xl animate-confetti-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '🎊', '⭐', '✨', '🌟', '💚', '🏆'][Math.floor(Math.random() * 7)]}
                </span>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 rounded-full w-6 h-6 flex items-center justify-center transition-colors z-10"
            title="Tutup"
          >
            <span className="text-white text-sm">✕</span>
          </button>

          {/* Header dengan icon */}
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className={`p-2 rounded-full ${notification.leveledUp ? 'bg-yellow-400 animate-bounce' : 'bg-white/20'}`}>
              {notification.leveledUp ? (
                <PartyPopper size={24} className="text-emerald-600" />
              ) : (
                <TrendingUp size={24} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {notification.leveledUp ? `🎉 Level Up ke ${notification.newLevel}!` : '⚡ XP Bertambah!'}
              </h3>
              <p className="text-sm opacity-90">+{notification.xpGained} XP didapatkan</p>
            </div>
          </div>

          {/* Level Info */}
          <div className="flex justify-between items-center mb-3 relative z-10">
            <div>
              <p className="text-sm opacity-80">Level</p>
              <p className="text-2xl font-bold">
                {notification.leveledUp ? (
                  <span className="animate-pulse">{notification.oldLevel} → {notification.newLevel}</span>
                ) : (
                  notification.oldLevel
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">XP di Level Ini</p>
              <p className="text-xl font-bold">
                {notification.leveledUp ? (
                  <span className="text-yellow-300 animate-pulse">LEVEL UP!</span>
                ) : (
                  `${Math.round(notification.newXP)} / ${notification.xpPerLevel}`
                )}
              </p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="bg-black/20 rounded-full h-4 overflow-hidden relative z-10">
            <div 
              className="bg-yellow-400 h-full transition-all duration-1000 ease-out absolute left-0 top-0"
              style={{ 
                width: `${notification.show ? (notification.leveledUp ? 100 : notification.newPercentage) : notification.oldPercentage}%` 
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          <p className="text-xs text-center mt-2 opacity-75 relative z-10">
            {notification.leveledUp 
              ? '🎊 Selamat! Misi baru terbuka!' 
              : `${Math.round(notification.newPercentage)}% progress • ${notification.xpPerLevel - Math.round(notification.newXP)} XP lagi ke Level ${notification.oldLevel + 1}`
            }
          </p>
        </div>
      </div>

      <main className="flex-1 ml-64 p-8">
        
        {/* --- LEVEL & XP PROGRESS --- */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-1">Level {levelInfo.currentLevel}</h2>
                    <p className="opacity-90">Eco Warrior</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{levelInfo.xpProgress} <span className="text-sm opacity-70">/ {levelInfo.xpPerLevel} XP</span></p>
                    <p className="text-sm opacity-80">Menuju Level {levelInfo.currentLevel + 1}</p>
                </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 bg-black/20 rounded-full h-3 w-full overflow-hidden">
                <div className="bg-yellow-400 h-full transition-all duration-1000 ease-out" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>

        {/* --- LIST MISI --- */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">Misi Tersedia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div key={mission.id} className={`p-6 rounded-2xl border relative overflow-hidden transition-all 
                ${mission.is_locked ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-100 shadow-sm'}
            `}>
              
              {/* Jika Locked, tampilkan overlay gembok */}
              {mission.is_locked && (
                  <div className="absolute inset-0 bg-gray-200/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-white p-3 rounded-full shadow-md flex items-center gap-2 px-6">
                        <Lock size={20} className="text-gray-500"/>
                        <span className="font-bold text-gray-600 text-sm">Buka di Level {mission.min_level}</span>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{mission.icon || '🎯'}</div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      mission.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      mission.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      mission.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {mission.difficulty === 'easy' ? '⭐ Mudah' :
                       mission.difficulty === 'medium' ? '⭐⭐ Sedang' :
                       mission.difficulty === 'hard' ? '⭐⭐⭐ Sulit' :
                       '⭐⭐⭐⭐ Expert'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+{mission.xp_reward} XP</span>
                  <div className="text-xs text-green-600 font-semibold mt-1">+{mission.health_reward} ❤️</div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{mission.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{mission.description}</p>
              
              {/* Progress Bar dan Status */}
              {!mission.is_claimed && !mission.is_locked && (
                <div className="mb-4">
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Progress</span>
                      <span className={`font-bold ${mission.is_completed ? 'text-green-600' : 'text-orange-600'}`}>
                        {mission.progress_text || `${mission.progress} / ${mission.target_value}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${mission.is_completed ? 'bg-green-500' : 'bg-orange-400'}`}
                        style={{ width: `${Math.min(100, (mission.progress / mission.target_value) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {!mission.is_completed && (
                    <div className="text-xs font-semibold px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg inline-block border border-orange-100">
                      ⚠️ Syarat belum terpenuhi
                    </div>
                  )}
                  {mission.is_completed && (
                    <div className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 rounded-lg inline-block border border-green-100">
                      ✅ Siap diklaim!
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => mission.is_completable && handleClaim(mission.id)} 
                disabled={!mission.is_completable || mission.is_claimed || mission.is_locked} 
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition 
                    ${mission.is_claimed 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : mission.is_completable 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
              >
                {mission.is_claimed 
                  ? <><CheckCircle size={20} /> Sudah Diklaim</> 
                  : mission.is_completable 
                    ? <><Zap size={20} /> Klaim Sekarang!</>
                    : 'Syarat Belum Terpenuhi'
                }
              </button>
            </div>
          ))}
        </div>

        {/* --- MODAL POPUP --- */}
        {modalInfo.show && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalInfo.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {modalInfo.type === 'error' ? <Zap /> : <CheckCircle />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{modalInfo.title}</h3>
                    <p className="text-gray-500 mb-6 text-sm">{modalInfo.message}</p>
                    <button onClick={closeModal} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl">Tutup</button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}