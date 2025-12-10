'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Calendar, Filter, Trash2, Leaf } from 'lucide-react';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('daily'); // Default: Hari Ini
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Load User saat pertama buka
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  // Fetch Data setiap kali filter atau user berubah
  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [filter, user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Panggil API yang baru kita buat
      const res = await fetch(`${API_URL}/logs/history/${user.id}?filter=${filter}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Gagal ambil history", err);
    } finally {
      setLoading(false);
    }
  };

  // Format Tanggal Indonesia
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Pilihan Filter
  const filters = [
    { id: 'daily', label: 'Hari Ini' },
    { id: 'weekly', label: 'Minggu Ini' },
    { id: 'monthly', label: 'Bulan Ini' },
    { id: 'yearly', label: 'Tahun Ini' },
    { id: 'all', label: 'Semua' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               ⏳ Riwayat Aktivitas
            </h1>
            <p className="text-gray-500">Lihat jejak karbon yang sudah kamu catat.</p>
          </div>
        </div>

        {/* --- FILTER TAB BUTTONS --- */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 inline-flex gap-1 mb-8">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f.id
                  ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* --- LIST AKTIVITAS --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Filter className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Belum ada aktivitas</h3>
                <p className="text-gray-500 text-sm">Coba ubah filter atau catat aktivitas baru.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Aktivitas</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Jumlah</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Emisi (CO2)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-emerald-500"/>
                            {formatDate(log.date)}
                        </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{log.activity_name}</div>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 capitalize">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-medium">
                      {log.input_value} <span className="text-gray-400 text-xs">{log.unit}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1 font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                        <Leaf size={14} />
                        {log.carbon_emission} kg
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}