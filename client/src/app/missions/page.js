'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal'; // <--- 1. IMPORT MODAL
import { Target, CheckCircle, Lock, Zap, PartyPopper, TrendingUp, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useBadge } from '@/contexts/BadgeContext';

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // State Modal Info (Untuk Level Up / Sukses Klaim)
  const [modalInfo, setModalInfo] = useState({ show: false, title: '', message: '', type: 'success' });
  
  // STATE BARU: Untuk Modal Aktivitas (Fitur Lakukan Misi)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetActivityId, setTargetActivityId] = useState(null);

  // Badge Context
  const { checkBadges } = useBadge();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) fetchMissions(userData.id);
  }, []);

  const fetchMissions = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/missions/${userId}`);
      const data = await res.json();
      
      if (data.missions) setMissions(data.missions);
      if (data.levelInfo) setLevelInfo(data.levelInfo);
    } catch (err) { 
      console.error('Fetch missions error:', err);
    }
  };

  // --- FUNGSI BARU: TOMBOL LAKUKAN MISI ---
  const handleDoMission = (requiredActivityId) => {
    setTargetActivityId(requiredActivityId); // Set ID aktivitas (misal: 101 sepeda)
    setIsActivityModalOpen(true); // Buka modal
  };

  const handleClaim = async (missionId) => {
    try {
        const res = await fetch(`${API_URL}/missions/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, missionId }),
        });
        const result = await res.json();

        if (res.ok) {
            // Refresh Data
            await fetchMissions(user.id);
            await checkBadges(user.id);
            
            const leveledUp = result.leveledUp || false;

            // --- LOGIKA POPUP ANIMASI (DIKEMBALIKAN) ---
            if (leveledUp) {
                // Kalo Naik Level: Tampilkan Confetti & Modal Besar Emas
                setShowConfetti(true);
                setModalInfo({ 
                    show: true, 
                    type: 'levelup', 
                    title: `NAIK LEVEL ${result.newLevel}! 🎉`, 
                    message: `Luar biasa! Kamu mendapatkan +${result.xpAdded} XP dan +${result.healthAdded} ❤️ Health.` 
                });
                // Matikan confetti otomatis
                setTimeout(() => setShowConfetti(false), 6000);
            } else {
                // Kalo Cuma Klaim Biasa: Modal Sukses Hijau
                setModalInfo({ 
                    show: true, 
                    type: 'success', 
                    title: 'Misi Selesai! ✅', 
                    message: `Mantap! +${result.xpAdded} XP berhasil didapatkan.` 
                });
            }
        } else {
            // Error
            setModalInfo({ show: true, type: 'error', title: 'Ups!', message: result.message });
        }
    } catch (error) { 
        console.error(error); 
    }
  };

  const closeModal = () => setModalInfo({ ...modalInfo, show: false });

  if (!user || !levelInfo) return null;

  // Hitung persentase XP
  const xpPercentage = (levelInfo.xpProgress / levelInfo.xpPerLevel) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar />
      
      {/* Animasi Confetti */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* --- RENDER MODAL AKTIVITAS (FITUR BARU) --- */}
      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        userId={user.id}
        onRefresh={() => fetchMissions(user.id)} // Refresh misi setelah log disimpan
        initialActivityId={targetActivityId} // Kirim ID biar otomatis terpilih
      />

      <main className="flex-1 ml-64 p-8">
        
        {/* --- HEADER LEVEL PROGRESS --- */}
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
                ${mission.is_locked ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}
            `}>
              
              {/* Overlay Locked */}
              {mission.is_locked && (
                  <div className="absolute inset-0 bg-gray-200/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-white p-3 rounded-full shadow-md flex items-center gap-2 px-6">
                        <Lock size={20} className="text-gray-500"/>
                        <span className="font-bold text-gray-600 text-sm">Buka di Level {mission.min_level}</span>
                      </div>
                  </div>
              )}

              {/* Header Card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{mission.icon || '🎯'}</div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      mission.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      mission.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {mission.difficulty === 'easy' ? 'Mudah' : 
                       mission.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+{mission.xp_reward} XP</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{mission.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{mission.description}</p>
              
              {/* Progress Bar */}
              {!mission.is_claimed && !mission.is_locked && (
                <div className="mb-4">
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
                  
                  {!mission.is_completed && (
                    <div className="text-xs font-semibold px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg inline-block border border-orange-100 mt-2">
                      ⚠️ Syarat belum terpenuhi
                    </div>
                  )}
                </div>
              )}

              {/* --- ACTION BUTTONS (LOGIKA BARU) --- */}
              <div className="flex gap-2">
                  
                  {/* KONDISI 1: SUDAH SELESAI -> TOMBOL KLAIM */}
                  {mission.is_completable && !mission.is_claimed && (
                      <button 
                        onClick={() => handleClaim(mission.id)} 
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg animate-pulse"
                      >
                        <Zap size={18} /> Klaim Reward!
                      </button>
                  )}

                  {/* KONDISI 2: BELUM SELESAI -> TOMBOL LAKUKAN MISI */}
                  {!mission.is_completable && !mission.is_claimed && !mission.is_locked && (
                      <button 
                        onClick={() => handleDoMission(mission.required_activity_id)} 
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition"
                      >
                        Lakukan Misi <ArrowRight size={18} />
                      </button>
                  )}

                  {/* KONDISI 3: SUDAH DIKLAIM */}
                  {mission.is_claimed && (
                      <button disabled className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-green-100 text-green-700 cursor-default border border-green-200">
                        <CheckCircle size={18} /> Sudah Diklaim
                      </button>
                  )}
              </div>

            </div>
          ))}
        </div>

        {/* --- MODAL POPUP (LEVEL UP / SUCCESS) --- */}
        {modalInfo.show && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border-4 
                    ${modalInfo.type === 'levelup' ? 'border-yellow-200' : 
                      modalInfo.type === 'error' ? 'border-red-200' : 'border-emerald-100'}`}>
                    
                    {/* Icon Header */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce
                        ${modalInfo.type === 'levelup' ? 'bg-yellow-100 text-yellow-600' : 
                          modalInfo.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {modalInfo.type === 'levelup' ? <PartyPopper size={40} /> : 
                         modalInfo.type === 'error' ? <Zap size={40} /> : <CheckCircle size={40} />}
                    </div>

                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">{modalInfo.title}</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed">{modalInfo.message}</p>

                    <button 
                        onClick={closeModal} 
                        className={`w-full font-bold py-3.5 rounded-xl text-white shadow-lg transition-transform active:scale-95
                            ${modalInfo.type === 'levelup' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200' : 
                              modalInfo.type === 'error' ? 'bg-gray-800' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                    >
                        {modalInfo.type === 'levelup' ? 'Keren Banget!' : 'Mantap!'}
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}