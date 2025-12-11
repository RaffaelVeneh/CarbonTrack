'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import EcoPlant from '@/components/EcoPlant'; // <--- 1. IMPORT ECO PLANT
import { Target, CheckCircle, Lock, Zap, PartyPopper, TrendingUp, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useBadge } from '@/contexts/BadgeContext';

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [modalInfo, setModalInfo] = useState({ show: false, title: '', message: '', type: 'success' });
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetActivityId, setTargetActivityId] = useState(null);

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

  const handleDoMission = (requiredActivityId) => {
    setTargetActivityId(requiredActivityId); 
    setIsActivityModalOpen(true);
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
            await fetchMissions(user.id);
            await checkBadges(user.id);
            
            const leveledUp = result.leveledUp || false;

            if (leveledUp) {
                setShowConfetti(true);
                setModalInfo({ 
                    show: true, 
                    type: 'levelup', 
                    title: `NAIK LEVEL ${result.newLevel}! 🎉`, 
                    message: `Luar biasa! Kamu mendapatkan +${result.xpAdded} XP.` 
                });
                setTimeout(() => setShowConfetti(false), 6000);
            } else {
                setModalInfo({ 
                    show: true, 
                    type: 'success', 
                    title: 'Misi Selesai! ✅', 
                    message: `Mantap! +${result.xpAdded} XP berhasil didapatkan. Cek tanamanmu!` 
                });
            }
        } else {
            setModalInfo({ show: true, type: 'error', title: 'Ups!', message: result.message });
        }
    } catch (error) { 
        console.error(error); 
    }
  };

  const closeModal = () => setModalInfo({ ...modalInfo, show: false });

  if (!user || !levelInfo) return null;

  const xpPercentage = (levelInfo.xpProgress / levelInfo.xpPerLevel) * 100;
  
  // 2. HITUNG JUMLAH MISI SELESAI (claimed) UNTUK TANAMAN
  const completedMissionsCount = missions.filter(m => m.is_claimed).length;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar />
      
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        userId={user.id}
        onRefresh={() => fetchMissions(user.id)} 
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
                {/* 3. PANGGIL KOMPONEN ECO PLANT */}
                <EcoPlant completedCount={completedMissionsCount} />
            </div>

        </div>

        {/* --- LIST MISI --- */}
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

        {modalInfo.show && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 border-4 
                    ${modalInfo.type === 'levelup' ? 'border-yellow-200' : 'border-emerald-100'}`}>
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
                              'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
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