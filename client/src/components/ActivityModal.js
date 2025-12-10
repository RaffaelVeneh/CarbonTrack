'use client';

import { useState, useEffect } from 'react';
import { X, Save, CheckCircle } from 'lucide-react'; // Tambah CheckCircle

export default function ActivityModal({ isOpen, onClose, userId, onRefresh }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [selectedActivity, setSelectedActivity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // State Modal Sukses
  const [showSuccess, setShowSuccess] = useState(false);

  // Ambil data aktivitas
  useEffect(() => {
    if (isOpen) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      fetch(`${API_URL}/logs/activities`)
        .then(res => res.json())
        .then(data => setActivities(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          activity_id: selectedActivity,
          input_value: inputValue,
          date: date
        })
      });

      if (res.ok) {
        // --- SUKSES ---
        // 1. Refresh data dashboard di belakang layar
        onRefresh();
        
        // 2. Tampilkan Popup Sukses Kustom
        setShowSuccess(true);
        
        // 3. Reset Form
        setInputValue('');
        
      } else {
        alert('Gagal menyimpan.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false); // Tutup popup sukses
    onClose();             // Tutup modal utama
  };

  if (!isOpen) return null;

  const currentUnit = activities.find(a => a.id == selectedActivity)?.unit || 'unit';

  // JIKA SUKSES, TAMPILKAN POPUP SUKSES (Bukan Form)
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Berhasil Dicatat! 🌱</h3>
          <p className="text-gray-500 mb-6">Aktivitasmu sudah masuk ke dalam perhitungan jejak karbon.</p>
          <button 
            onClick={handleCloseSuccess}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
          >
            Oke, Lanjut
          </button>
        </div>
      </div>
    );
  }

  // TAMPILAN FORM NORMAL
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Catat Aktivitas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Aktivitas</label>
            <select 
              required
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="">-- Pilih Aktivitas --</option>
              {activities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.activity_name} ({act.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah ({selectedActivity ? currentUnit : '...'})
            </label>
            <input 
              type="number" 
              required
              min="0"
              step="0.1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Contoh: 10"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Save size={20} />
            {loading ? 'Menyimpan...' : 'Simpan Log'}
          </button>

        </form>
      </div>
    </div>
  );
}