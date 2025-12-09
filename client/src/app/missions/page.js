'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Target, CheckCircle, Award } from 'lucide-react';
import Confetti from 'react-confetti'; // Efek pesta
import { useWindowSize } from 'react-use'; // Opsional, atau hardcode ukuran layar

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState('');

  // 1. Load User & Misi
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    if (userData) fetchMissions(userData.id);
  }, []);

  const fetchMissions = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/missions/${userId}`);
      const data = await res.json();
      setMissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fungsi Klaim
  const handleClaim = async (missionId) => {
    try {
      const res = await fetch('http://localhost:5000/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, missionId }),
      });
      const result = await res.json();

      if (res.ok) {
        // Refresh list misi (biar tombol berubah jadi 'Completed')
        fetchMissions(user.id);

        // Cek Level Up
        if (result.leveledUp) {
            setShowConfetti(true);
            setLevelUpMessage(`Selamat! Kamu naik ke Level ${result.newLevel}! 🎉`);
            
            // Update data user di LocalStorage biar sidebar juga update
            const updatedUser = { ...user, level: result.newLevel };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Matikan confetti setelah 5 detik
            setTimeout(() => {
                setShowConfetti(false);
                setLevelUpMessage('');
            }, 5000);
        } else {
            alert(`Misi Selesai! +${result.xpAdded} XP`);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      {/* Efek Confetti jika Level Up */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Misi Harian 🎯</h1>
            <p className="text-gray-500">Selesaikan misi untuk mendapatkan XP dan Badge.</p>
          </div>
          <div className="bg-emerald-100 px-4 py-2 rounded-lg flex items-center gap-2 text-emerald-700 font-bold">
            <Award size={20} />
            <span>Level {user.level || 1}</span>
          </div>
        </div>

        {/* Notifikasi Level Up */}
        {levelUpMessage && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-xl font-bold text-center text-lg animate-bounce">
                {levelUpMessage}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div 
                key={mission.id} 
                className={`p-6 rounded-2xl border transition-all ${
                    mission.is_claimed 
                    ? 'bg-gray-100 border-gray-200 opacity-70' 
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Target size={24} />
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  +{mission.xp_reward} XP
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{mission.title}</h3>
              <p className="text-gray-500 text-sm mb-6">{mission.description}</p>
              
              <button
                onClick={() => handleClaim(mission.id)}
                disabled={mission.is_claimed}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                    mission.is_claimed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {mission.is_claimed ? (
                    <>
                        <CheckCircle size={20} /> Selesai
                    </>
                ) : (
                    'Klaim Misi'
                )}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}