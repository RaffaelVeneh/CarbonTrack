'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import Lottie from 'lottie-react'; 

// Import Animasi (Pastikan nama file sesuai dengan yang ada di folder assets kamu)
// Kalau nama filemu masih "healty.json" (typo), sesuaikan di sini ya
import healthyAnim from '@/assets/lottie/healthy.json';
import normalAnim from '@/assets/lottie/normal.json';
import deadAnim from '@/assets/lottie/dead.json';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Zap, TrendingDown, Plus, Heart } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Data Dashboard
  const [stats, setStats] = useState({ todayEmission: 0, totalEmission: 0, graphData: [] });

  // State Animasi Pohon
  const [treeConfig, setTreeConfig] = useState({ 
    anim: null, 
    text: 'Memuat...', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-200' 
  });

  // FUNGSI 1: Ambil Data Terbaru (Stats + Health User)
  const fetchAllData = useCallback(async (userId) => {
    try {
      // A. Ambil Statistik Emisi
      const resStats = await fetch(`http://localhost:5000/api/logs/summary/${userId}`);
      const dataStats = await resStats.json();
      if (resStats.ok) setStats(dataStats);

      // B. Ambil Data Profil User TERBARU (Supaya Health selalu update)
      const resUser = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
      const dataUser = await resUser.json();
      
      if (resUser.ok) {
        // Update state user dengan health terbaru dari database
        setUser(prev => ({ ...prev, island_health: dataUser.user.island_health }));
        updateTreeUI(dataUser.user.island_health); // Panggil fungsi update tampilan pohon
      }

    } catch (error) {
      console.error("Gagal ambil data", error);
    }
  }, []);

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

  // Load Awal
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Langsung panggil data terbaru dari server
      fetchAllData(parsedUser.id);
    }
  }, [router, fetchAllData]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Halo, {user.username}! 👋</h1>
            <p className="text-gray-500">Statistik jejak karbon real-time kamu.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition transform hover:scale-105"
          >
            <Plus size={20} /> Catat Aktivitas
          </button>
        </div>

        {/* --- AREA POHON DIGITAL --- */}
        <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-8 mb-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-48 h-48 flex-shrink-0 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    {treeConfig.anim ? (
                        <Lottie animationData={treeConfig.anim} loop={true} style={{ width: 160, height: 160 }} />
                    ) : (
                        <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Status Pulau Virtual</h2>
                    <p className={`text-lg font-semibold mb-4 ${treeConfig.color}`}>
                        "{treeConfig.text}"
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <Heart className="text-red-500 animate-pulse" fill="currentColor" size={24} />
                        <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${treeConfig.bgColor}`} 
                                style={{ width: `${user.island_health}%` }}
                            ></div>
                        </div>
                        <span className="font-bold text-gray-700 w-12">{user.island_health}%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- KARTU STATISTIK --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Leaf size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Jejak Karbon</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalEmission} kg</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Zap size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Level Kamu</p>
              <h3 className="text-2xl font-bold text-gray-800">Level {user.level || 1}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${parseFloat(stats.todayEmission) > 5 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Emisi Hari Ini</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.todayEmission} kg</h3>
            </div>
          </div>
        </div>

        {/* --- GRAFIK --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Tren Emisi Minggu Ini</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '10px' }} cursor={{ stroke: '#10B981' }} />
                <Line type="monotone" dataKey="co2" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal dengan Auto Refresh Data */}
        {user && (
          <ActivityModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            userId={user.id} 
            onRefresh={() => fetchAllData(user.id)} // <--- PENTING: Refresh semua data setelah input
          />
        )}
      </main>
    </div>
  );
}