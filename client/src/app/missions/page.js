'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Target, CheckCircle, Award, PartyPopper } from 'lucide-react'; // Tambah PartyPopper
import Confetti from 'react-confetti'; 

export default function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const [user, setUser] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // State untuk Popup Kustom
  const [modalInfo, setModalInfo] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' // 'success' atau 'levelup'
  });

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
    } catch (err) { console.error(err); }
  };

  const handleClaim = async (missionId) => {
    try {
      const res = await fetch('http://localhost:5000/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, missionId }),
      });
      const result = await res.json();

      if (res.ok) {
        fetchMissions(user.id); // Refresh

        if (result.leveledUp) {
            // --- POPUP LEVEL UP ---
            setShowConfetti(true);
            setModalInfo({
                show: true,
                type: 'levelup',
                title: `Naik Level ${result.newLevel}! 🎉`,
                message: 'Selamat! Kamu makin jago menjaga bumi.'
            });

            // Update user storage
            const updatedUser = { ...user, level: result.newLevel };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            // Matikan confetti nanti
            setTimeout(() => setShowConfetti(false), 5000);

        } else {
            // --- POPUP MISI SELESAI BIASA ---
            setModalInfo({
                show: true,
                type: 'success',
                title: 'Misi Selesai! ✅',
                message: `Kamu mendapatkan +${result.xpAdded} XP`
            });
        }
      } else {
        alert(result.message);
      }
    } catch (error) { console.error(error); }
  };

  const closeModal = () => {
    setModalInfo({ ...modalInfo, show: false });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <main className="flex-1 ml-64 p-8 relative"> {/* Tambah relative */}
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Misi Harian 🎯</h1>
            <p className="text-gray-500">Selesaikan misi untuk mendapatkan XP.</p>
          </div>
          <div className="bg-emerald-100 px-4 py-2 rounded-lg flex items-center gap-2 text-emerald-700 font-bold">
            <Award size={20} />
            <span>Level {user.level || 1}</span>
          </div>
        </div>

        {/* --- LIST MISI --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission) => (
            <div key={mission.id} className={`p-6 rounded-2xl border transition-all ${mission.is_claimed ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Target size={24} /></div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+{mission.xp_reward} XP</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{mission.title}</h3>
              <p className="text-gray-500 text-sm mb-6">{mission.description}</p>
              <button onClick={() => handleClaim(mission.id)} disabled={mission.is_claimed} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${mission.is_claimed ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                {mission.is_claimed ? <><CheckCircle size={20} /> Selesai</> : 'Klaim Misi'}
              </button>
            </div>
          ))}
        </div>

        {/* --- MODAL POPUP KUSTOM (GLOBAL UNTUK HALAMAN INI) --- */}
        {modalInfo.show && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-300">
                    
                    {/* Ikon Berubah Tergantung Tipe */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalInfo.type === 'levelup' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                        {modalInfo.type === 'levelup' ? (
                            <PartyPopper className="text-yellow-600 w-8 h-8" />
                        ) : (
                            <CheckCircle className="text-green-600 w-8 h-8" />
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{modalInfo.title}</h3>
                    <p className="text-gray-500 mb-6 text-sm">{modalInfo.message}</p>

                    <button 
                        onClick={closeModal}
                        className={`w-full font-bold py-2.5 rounded-xl text-white transition shadow-lg ${modalInfo.type === 'levelup' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {modalInfo.type === 'levelup' ? 'Yay, Keren!' : 'Oke, Mantap!'}
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}