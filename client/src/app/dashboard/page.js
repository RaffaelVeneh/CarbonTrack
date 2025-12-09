'use client';

import { useEffect, useState, useCallback } from 'react'; // Tambah useCallback
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ActivityModal from '@/components/ActivityModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Zap, TrendingDown, Plus } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();

  // State Data User & UI
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Data Dashboard (Real Data)
  const [stats, setStats] = useState({
    todayEmission: 0,
    totalEmission: 0,
    graphData: []
  });

  // Fungsi ambil data dari Backend
  const fetchDashboardData = useCallback(async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/logs/summary/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Gagal ambil data dashboard", error);
    }
  }, []);

  // Cek Login & Load Data Awal
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Panggil fungsi ambil data
      fetchDashboardData(parsedUser.id);
    }
  }, [router, fetchDashboardData]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Halo, {user.username}! 👋
            </h1>
            <p className="text-gray-500">Statistik jejak karbon real-time kamu.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-200 transition"
          >
            <Plus size={20} />
            Catat Aktivitas
          </button>
        </div>

        {/* --- KARTU STATISTIK (DATA REAL) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card Total Emisi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Leaf size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Jejak Karbon</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalEmission} kg</h3>
              <span className="text-xs text-gray-400">Sejak mulai bergabung</span>
            </div>
          </div>

          {/* Card Level (Masih statis dulu, nanti kita update di part Gamifikasi) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Level Kamu</p>
              <h3 className="text-2xl font-bold text-gray-800">Level {user.level || 1}</h3>
              <span className="text-xs text-blue-600 font-medium">Semangat naik level!</span>
            </div>
          </div>

          {/* Card Emisi Hari Ini */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${parseFloat(stats.todayEmission) > 5 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Emisi Hari Ini</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.todayEmission} kg</h3>
              <span className="text-xs text-gray-400">
                {parseFloat(stats.todayEmission) > 5 ? 'Warning: Tinggi!' : 'Aman (Low)'}
              </span>
            </div>
          </div>
        </div>

        {/* --- GRAFIK (DATA REAL) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Tren Emisi Minggu Ini</h2>
          <div className="h-80 w-full">
            {stats.graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#10B981', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="co2" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Leaf size={40} className="mb-2 opacity-20"/>
                <p>Belum ada data grafik. Mulai catat aktivitasmu!</p>
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL (Dengan fitur auto-refresh) --- */}
        {user && (
          <ActivityModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            userId={user.id} 
            onRefresh={() => fetchDashboardData(user.id)} // <--- PENTING: Refresh data setelah input
          />
        )}
      </main>
    </div>
  );
}