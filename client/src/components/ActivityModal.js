'use client';

import { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Leaf, Flame } from 'lucide-react';
import { useBadge } from '@/contexts/BadgeContext';

export default function ActivityModal({ isOpen, onClose, userId, onRefresh, initialActivityId, onUpdateStreak }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState('emission'); 

  const { checkBadges } = useBadge(); 
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/logs/activities`) 
        .then(res => res.json())
        .then(data => {
            setActivities(data);
            if (initialActivityId) {
                const targetId = parseInt(initialActivityId);
                const targetActivity = data.find(act => act.id === targetId);
                setSelectedActivity(targetId);
                if (targetActivity?.impact_type === 'positive') {
                    setMode('saving');
                } else {
                    setMode('emission');
                }
            } else {
                setSelectedActivity('');
                setMode('emission');
            }
        })
        .catch(err => console.error("Gagal load aktivitas:", err));
    }
  }, [isOpen, API_URL, initialActivityId]);

  const filteredActivities = activities.filter(act => 
    mode === 'emission' ? act.impact_type === 'negative' : act.impact_type === 'positive'
  );

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

      // --- PERBAIKAN: DEFINISIKAN VARIABLE RESULT DULU ---
      const result = await res.json(); 
      // --------------------------------------------------

      if (res.ok) {
        // Sekarang variabel 'result' sudah ada isinya, aman dipakai
        if (result.newStreak !== undefined && onUpdateStreak) {
            console.log("🔥 Force updating streak to:", result.newStreak);
            onUpdateStreak(result.newStreak); 
        }
        
        onRefresh(); 
        await checkBadges(userId); 
        setShowSuccess(true);
        setInputValue('');
        setSelectedActivity('');
      } else {
        // Tampilkan pesan error dari backend jika ada
        alert('Gagal menyimpan: ' + (result.message || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentUnit = activities.find(a => a.id == selectedActivity)?.unit || '...';

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center animate-in fade-in zoom-in duration-300 border-4 border-emerald-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Berhasil Dicatat! 🎉</h3>
          <p className="text-gray-500 mb-6 text-sm">
             Data tersimpan. Streak kamu aman!
          </p>
          <button 
            onClick={handleCloseSuccess}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-200"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Catat Aktivitas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><X size={20} /></button>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6">
            <button onClick={() => { setMode('emission'); setSelectedActivity(''); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'emission' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Flame size={16} className={mode === 'emission' ? 'fill-red-500' : ''} /> Emisi (Buruk)</button>
            <button onClick={() => { setMode('saving'); setSelectedActivity(''); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'saving' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Leaf size={16} className={mode === 'saving' ? 'fill-emerald-600' : ''} /> Aksi Hijau (Baik)</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium text-gray-700"/></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Pilih {mode === 'emission' ? 'Sumber Emisi' : 'Aksi Hemat'}</label><div className="relative"><select required value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none appearance-none bg-white font-medium transition ${mode === 'emission' ? 'border-red-100 focus:border-red-400 text-gray-700' : 'border-emerald-100 focus:border-emerald-400 text-gray-700'}`}><option value="">-- Cari Aktivitas --</option>{filteredActivities.map(act => (<option key={act.id} value={act.id}>{act.activity_name} ({act.category})</option>))}</select></div></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah ({selectedActivity ? currentUnit : '...'})</label><input type="number" required min="0" step="0.1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium text-lg"/></div>
          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mt-4 ${mode === 'emission' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>{loading ? <span className="animate-pulse">Menyimpan...</span> : <><Save size={20} /> Simpan Log</>}</button>
        </form>
      </div>
    </div>
  );
}