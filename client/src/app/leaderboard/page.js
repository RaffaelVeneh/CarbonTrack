'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Trophy, Crown, Medal, Search } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data leaderboard dari Backend
    fetch('http://localhost:5000/api/users/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // Fungsi untuk memberi warna khusus pada Juara 1, 2, 3
  const getRankStyle = (index) => {
    if (index === 0) return 'bg-yellow-50 border-yellow-300 text-yellow-800 shadow-yellow-100 ring-1 ring-yellow-200'; // Emas
    if (index === 1) return 'bg-gray-100 border-gray-300 text-gray-800 shadow-gray-100';     // Perak
    if (index === 2) return 'bg-orange-50 border-orange-300 text-orange-800 shadow-orange-100'; // Perunggu
    return 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50';
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="text-yellow-500 fill-yellow-500" size={24} />;
    if (index === 1) return <Medal className="text-gray-400 fill-gray-300" size={24} />;
    if (index === 2) return <Medal className="text-orange-400 fill-orange-300" size={24} />;
    return <span className="font-bold text-gray-400 text-lg">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pahlawan Lingkungan 🏆</h1>
            <p className="text-gray-500">Top 10 pengguna dengan kontribusi terbaik.</p>
          </div>
        </div>

        {/* Tabel Leaderboard */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Tabel */}
          <div className="grid grid-cols-12 gap-4 p-5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 text-sm uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-6 pl-4">Pengguna</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-3 text-right pr-4">Total XP</div>
          </div>

          {loading ? (
             <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Sedang memuat data juara...</p>
             </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaders.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-12 gap-4 p-5 items-center transition-all duration-200 ${getRankStyle(index)}`}
                >
                  {/* Rank Icon */}
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(index)}
                  </div>

                  {/* User Info */}
                  <div className="col-span-6 flex items-center gap-4 pl-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                        'bg-emerald-100 text-emerald-700 border-white shadow-sm'
                    }`}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="font-bold text-lg block">{player.username}</span>
                        {index === 0 && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-bold">Juara 1</span>}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 text-center">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold">
                      Lvl {player.current_level}
                    </span>
                  </div>

                  {/* XP */}
                  <div className="col-span-3 text-right pr-4">
                    <span className="font-mono font-bold text-lg text-emerald-600">{player.total_xp.toLocaleString()}</span> 
                    <span className="text-xs text-gray-400 ml-1">XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}