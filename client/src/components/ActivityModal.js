'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function ActivityModal({ isOpen, onClose, userId, onRefresh }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [selectedActivity, setSelectedActivity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default hari ini

  // Ambil data aktivitas saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/logs/activities')
        .then(res => res.json())
        .then(data => setActivities(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/logs', {
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
        alert('Aktivitas berhasil dicatat! 🌱');
        onRefresh(); // Refresh data dashboard (nanti kita buat)
        onClose();   // Tutup modal
        setInputValue(''); // Reset form
      } else {
        alert('Gagal menyimpan.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Cari satuan unit aktivitas yang dipilih (misal: km, jam, pcs)
  const currentUnit = activities.find(a => a.id == selectedActivity)?.unit || 'unit';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Catat Aktivitas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Pilih Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Pilih Aktivitas */}
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

          {/* Input Nilai */}
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
              placeholder={`Contoh: 10`}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Tombol Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Save size={20} />
            {loading ? 'Menyimpan...' : 'Simpan Log'}
          </button>

        </form>
      </div>
    </div>
  );
}