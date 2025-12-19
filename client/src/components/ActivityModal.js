'use client';

import { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Leaf, Flame, Search } from 'lucide-react';
import { useBadge } from '@/contexts/BadgeContext';
import { apiGet } from '@/utils/auth';

export default function ActivityModal({ isOpen, onClose, userId, onRefresh, initialActivityId, onUpdateStreak, onActivityLogged }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState('emission');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false); 

  const { checkBadges } = useBadge(); 

  useEffect(() => {
    if (isOpen && activities.length === 0) {
      // Only fetch if activities not loaded yet (cache in state) - Using JWT
      apiGet('/logs/activities')
        .then(data => {
            // Ensure data is array
            const activitiesData = Array.isArray(data) ? data : [];
            setActivities(activitiesData);
            if (initialActivityId) {
                const targetId = parseInt(initialActivityId);
                const targetActivity = activitiesData.find(act => act.id === targetId);
                setSelectedActivity(targetId);
                if (targetActivity?.impact_type === 'positive') {
                    setMode('saving');
                } else {
                    setMode('emission');
                }
                if (targetActivity) {
                  setSearchQuery(targetActivity.activity_name);
                }
            } else {
                setSelectedActivity('');
                setMode('emission');
                setSearchQuery('');
            }
        })
        .catch(err => {
          console.error("Gagal load aktivitas:", err);
          setActivities([]); // Set empty array on error
        });
    } else if (isOpen && initialActivityId) {
      // If activities already loaded, just set the initial activity
      const targetId = parseInt(initialActivityId);
      const targetActivity = activities.find(act => act.id === targetId);
      setSelectedActivity(targetId);
      if (targetActivity?.impact_type === 'positive') {
          setMode('saving');
      } else {
          setMode('emission');
      }
      if (targetActivity) {
        setSearchQuery(targetActivity.activity_name);
      }
    }
  }, [isOpen, initialActivityId, activities]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.activity-search-container')) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Filter berdasarkan mode (positive/negative)
  const modeFilteredActivities = activities.filter(act => 
    mode === 'emission' ? act.impact_type === 'negative' : act.impact_type === 'positive'
  );

  // Advanced search dengan fuzzy matching
  const searchFilteredActivities = () => {
    if (!searchQuery.trim()) return modeFilteredActivities;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Coba exact match dulu
    const exactMatch = modeFilteredActivities.filter(act => 
      act.activity_name.toLowerCase().includes(query) ||
      act.category.toLowerCase().includes(query)
    );
    
    if (exactMatch.length > 0) return exactMatch;
    
    // Jika tidak ada exact match, pecah per kata
    const keywords = query.split(/\s+/).filter(word => word.length > 0);
    
    return modeFilteredActivities.filter(act => {
      const activityText = `${act.activity_name} ${act.category}`.toLowerCase();
      // Activity harus mengandung minimal 1 keyword
      return keywords.some(keyword => activityText.includes(keyword));
    });
  };

  const filteredActivities = searchFilteredActivities();

  // Fungsi untuk highlight matching words
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const keywords = query.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
    let result = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      result = result.replace(regex, '<span class="bg-emerald-200 text-emerald-900 font-bold px-0.5 rounded">$1</span>');
    });
    
    return result;
  };

  // Handle select activity
  const handleSelectActivity = (activityId) => {
    setSelectedActivity(activityId);
    setShowDropdown(false);
    const selected = activities.find(a => a.id === activityId);
    if (selected) {
      setSearchQuery(selected.activity_name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Import apiPost dynamically
      const { apiPost } = await import('@/utils/auth');
      
      const result = await apiPost('/logs', {
        user_id: userId,
        activity_id: selectedActivity,
        input_value: inputValue,
        date: date
      });

      // apiPost already handles response, no need to check res.ok
      if (result) {
        if (result.newStreak !== undefined && onUpdateStreak) {
            onUpdateStreak(result.newStreak); 
        }
        
        // Refresh data
        if (onRefresh) {
          onRefresh(); 
        }
        
        // Badge check dengan timeout (non-blocking)
        if (userId) {
          setTimeout(() => {
            checkBadges(userId).catch(err => console.error('Badge check error:', err));
          }, 500);
        }
        
        setShowSuccess(true);
        setInputValue('');
        setSelectedActivity('');
        setSearchQuery('');
        setShowDropdown(false);
        
        // Callback for AI assistant
        if (onActivityLogged) {
          const activity = activities.find(a => a.id === selectedActivity);
          onActivityLogged({
            name: activity?.activity_name || 'Aktivitas',
            xp: result.xpGained || 0,
            co2: result.co2Impact || 0
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan: ' + (error.message || 'Koneksi gagal'));
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
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 overflow-visible">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Catat Aktivitas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><X size={20} /></button>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6">
            <button 
              onClick={() => { 
                setMode('emission'); 
                setSelectedActivity(''); 
                setSearchQuery('');
                setShowDropdown(false);
              }} 
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'emission' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Flame size={16} className={mode === 'emission' ? 'fill-red-500' : ''} /> Emisi (Buruk)
            </button>
            <button 
              onClick={() => { 
                setMode('saving'); 
                setSelectedActivity(''); 
                setSearchQuery('');
                setShowDropdown(false);
              }} 
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'saving' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Leaf size={16} className={mode === 'saving' ? 'fill-emerald-600' : ''} /> Aksi Hijau (Baik)
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium text-gray-700"
            />
          </div>
          
          <div className="relative activity-search-container">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Pilih {mode === 'emission' ? 'Sumber Emisi' : 'Aksi Hemat'}
            </label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${mode === 'emission' ? 'text-red-400' : 'text-emerald-500'}`} size={20} />
              <input
                type="text"
                required={!selectedActivity}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value.trim()) setSelectedActivity('');
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Ketik untuk mencari aktivitas..."
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none bg-white font-medium transition ${mode === 'emission' ? 'border-red-100 focus:border-red-400 text-gray-700' : 'border-emerald-100 focus:border-emerald-400 text-gray-700'}`}
              />
            </div>

            {/* Dropdown Results - Below Input with Fixed Height */}
            {showDropdown && filteredActivities.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[70]" style={{ maxHeight: '320px', top: '100%' }}>
                <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                  {filteredActivities.map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleSelectActivity(act.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0 ${selectedActivity === act.id ? 'bg-emerald-50' : ''}`}
                      style={{ minHeight: '64px' }}
                    >
                      <div 
                        className="font-semibold text-gray-800"
                        dangerouslySetInnerHTML={{ __html: highlightText(act.activity_name, searchQuery) }}
                      />
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span 
                          dangerouslySetInnerHTML={{ __html: highlightText(act.category, searchQuery) }}
                        />
                        <span className="text-gray-400">•</span>
                        <span>{act.unit}</span>
                        <span className="text-gray-400">•</span>
                        <span className={act.impact_type === 'positive' ? 'text-emerald-600' : 'text-red-500'}>
                          {act.emission_factor} kg CO₂
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message - Below Input */}
            {showDropdown && searchQuery && filteredActivities.length === 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 text-center text-gray-500 text-sm z-[70]" style={{ top: '100%' }}>
                <Search className="mx-auto mb-2 text-gray-400" size={24} />
                Aktivitas tidak ditemukan
              </div>
            )}
          </div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah ({selectedActivity ? currentUnit : '...'})</label><input type="number" required min="0" step="0.1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium text-lg"/></div>
          <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mt-4 ${mode === 'emission' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>{loading ? <span className="animate-pulse">Menyimpan...</span> : <><Save size={20} /> Simpan Log</>}</button>
        </form>
      </div>
    </div>
  );
}