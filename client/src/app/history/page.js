'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Calendar, Filter, Leaf, ShieldCheck, ArrowRight } from 'lucide-react'; // Tambah Icon ShieldCheck

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // 1. PERBAIKAN URL: Kasih fallback ke localhost kalau env kosong
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [filter, user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/logs/history/${user.id}?filter=${filter}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Gagal ambil history", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const filters = [
    { id: 'daily', label: 'Hari Ini' },
    { id: 'weekly', label: 'Minggu Ini' },
    { id: 'monthly', label: 'Bulan Ini' },
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
            <p className="text-gray-500">Jejak langkahmu dalam menjaga bumi.</p>
          </div>
        </div>

        {/* FILTER BUTTONS */}
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

        {/* LIST AKTIVITAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Sedang memuat data...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Filter className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Belum ada aktivitas</h3>
                <p className="text-gray-500 text-sm">Ubah filter waktu atau mulai catat aktivitas baru.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Aktivitas</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Jumlah</th>
                  {/* Judul Kolom Diganti biar Netral */}
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Dampak Karbon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    
                    {/* Kolom Tanggal */}
                    <td className="p-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-emerald-500"/>
                            {formatDate(log.date)}
                        </div>
                    </td>

                    {/* Kolom Nama Aktivitas */}
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{log.activity_name}</div>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 capitalize">
                        {log.category}
                      </span>
                    </td>

                    {/* Kolom Input (Jumlah) */}
                    <td className="p-4 text-sm text-gray-700 font-medium">
                      {log.input_value} <span className="text-gray-400 text-xs">{log.unit}</span>
                    </td>

                    {/* 2. PERBAIKAN TAMPILAN: Cek Emisi atau Hemat? */}
                    <td className="p-4 text-right">
                      {/* Kalau ada Carbon Saved (Hijau) */}
                      {parseFloat(log.carbon_saved) > 0 ? (
                         <div className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                            <ShieldCheck size={14} />
                            Hemat {log.carbon_saved} kg
                         </div>
                      ) : (
                         /* Kalau Carbon Produced (Merah) */
                         <div className="inline-flex items-center gap-1 font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                            <Leaf size={14} />
                            Emisi {log.carbon_emission} kg
                         </div>
                      )}
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