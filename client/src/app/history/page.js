'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Calendar, Filter, Leaf, ShieldCheck, ArrowRight, TrendingDown, TrendingUp,
  Search, X, Clock, MapPin, Activity, BarChart3, PieChart, Zap, Trash2,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

export default function HistoryPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all'); // 'all', 'positive', 'negative'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'impact', 'activity'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [expandedLog, setExpandedLog] = useState(null);

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

  // Format functions
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return formatDate(dateString);
  };

  // Filter and sort logic
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Impact filter
    if (impactFilter === 'positive') {
      filtered = filtered.filter(log => parseFloat(log.carbon_saved) > 0);
    } else if (impactFilter === 'negative') {
      filtered = filtered.filter(log => parseFloat(log.carbon_emission) > 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'impact':
          const impactA = parseFloat(a.carbon_saved) || parseFloat(a.carbon_emission);
          const impactB = parseFloat(b.carbon_saved) || parseFloat(b.carbon_emission);
          comparison = impactB - impactA;
          break;
        case 'activity':
          comparison = a.activity_name.localeCompare(b.activity_name);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [logs, searchQuery, categoryFilter, impactFilter, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalSaved = logs.reduce((sum, log) => sum + parseFloat(log.carbon_saved || 0), 0);
    const totalEmission = logs.reduce((sum, log) => sum + parseFloat(log.carbon_emission || 0), 0);
    const netImpact = totalSaved - totalEmission;
    const positiveActions = logs.filter(log => parseFloat(log.carbon_saved) > 0).length;
    const categories = [...new Set(logs.map(log => log.category))];

    return {
      totalSaved,
      totalEmission,
      netImpact,
      positiveActions,
      totalActions: logs.length,
      categories: categories.length
    };
  }, [logs]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(logs.map(log => log.category))];
  }, [logs]);

  const filters = [
    { id: 'daily', label: 'Hari Ini', icon: Calendar },
    { id: 'weekly', label: 'Minggu Ini', icon: Calendar },
    { id: 'monthly', label: 'Bulan Ini', icon: Calendar },
    { id: 'all', label: 'Semua', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/10 to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-blue-400/10 animate-gradient rounded-3xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border-2 border-white dark:border-gray-700">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-xl">
                      <Clock size={40} className="drop-shadow-lg" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400 bg-clip-text text-transparent">
                      Riwayat Aktivitas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 font-medium">Jejak langkahmu dalam menjaga bumi</p>
                  </div>
                </div>

                {/* Stats Summary */}
                {logs.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span className="text-xs text-emerald-600 font-semibold">CO2 Hemat</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">{stats.totalSaved.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-3 rounded-xl border border-red-200 dark:border-red-700">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={14} className="text-red-600" />
                        <span className="text-xs text-red-600 font-semibold">CO2 Emisi</span>
                      </div>
                      <p className="text-lg font-bold text-red-700">{stats.totalEmission.toFixed(1)} kg</p>
                    </div>
                    <div className={`bg-gradient-to-br p-3 rounded-xl border ${
                      stats.netImpact >= 0 
                        ? 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700' 
                        : 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {stats.netImpact >= 0 ? (
                          <TrendingUp size={14} className="text-blue-600" />
                        ) : (
                          <TrendingDown size={14} className="text-orange-600" />
                        )}
                        <span className={`text-xs font-semibold ${
                          stats.netImpact >= 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>Net Impact</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        stats.netImpact >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>{Math.abs(stats.netImpact).toFixed(1)} kg</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-3 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-purple-600" />
                        <span className="text-xs text-purple-600 font-semibold">Total Aktivitas</span>
                      </div>
                      <p className="text-lg font-bold text-purple-700">{stats.totalActions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 inline-flex gap-1">
            {filters.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    filter === f.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Advanced Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Cari aktivitas atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all font-medium"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Impact Filter */}
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all font-medium"
              >
                <option value="all">Semua Dampak</option>
                <option value="positive">🌱 Positif (Hemat)</option>
                <option value="negative">⚠️ Negatif (Emisi)</option>
              </select>

              {/* Sort Options */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl transition-all font-medium flex items-center gap-2"
              >
                {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Activity List - Card Style */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
                <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={24} />
              </div>
              <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Memuat riwayat aktivitas...</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tunggu sebentar ya! ⏳</p>
            </div>
          ) : filteredAndSortedLogs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Filter className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                {searchQuery || categoryFilter !== 'all' || impactFilter !== 'all' 
                  ? 'Tidak ada hasil ditemukan' 
                  : 'Belum ada aktivitas'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || categoryFilter !== 'all' || impactFilter !== 'all'
                  ? 'Coba ubah filter atau kata kunci pencarian'
                  : 'Ubah filter waktu atau mulai catat aktivitas baru'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Menampilkan <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredAndSortedLogs.length}</span> aktivitas
                  {searchQuery && <span> untuk "{searchQuery}"</span>}
                </p>
                {(searchQuery || categoryFilter !== 'all' || impactFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setImpactFilter('all');
                    }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <X size={16} />
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredAndSortedLogs.map((log, index) => {
                const isSaved = parseFloat(log.carbon_saved) > 0;
                const isExpanded = expandedLog === log.id;
                
                return (
                  <div 
                    key={log.id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg ${
                      isSaved 
                        ? 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500' 
                        : 'border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500'
                    }`}
                  >
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Section - Activity Info */}
                        <div className="flex items-center gap-4 flex-1">
                          {/* Icon/Number Badge */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                            isSaved 
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' 
                              : 'bg-gradient-to-br from-red-400 to-orange-500 text-white'
                          }`}>
                            {isSaved ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                          </div>

                          {/* Activity Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">
                                {log.activity_name}
                              </h3>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                                log.category === 'transportation' ? 'bg-blue-100 text-blue-700' :
                                log.category === 'energy' ? 'bg-yellow-100 text-yellow-700' :
                                log.category === 'food' ? 'bg-green-100 text-green-700' :
                                log.category === 'waste' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {log.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {getRelativeTime(log.date)}
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {log.input_value} {log.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Impact Badge */}
                        <div className="flex items-center gap-3">
                          {isSaved ? (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-3 rounded-xl shadow-md">
                              <div className="flex items-center gap-2">
                                <TrendingUp size={18} />
                                <div className="text-right">
                                  <p className="text-xs font-medium opacity-90">Hemat</p>
                                  <p className="text-lg font-bold">{log.carbon_saved} kg</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-3 rounded-xl shadow-md">
                              <div className="flex items-center gap-2">
                                <TrendingDown size={18} />
                                <div className="text-right">
                                  <p className="text-xs font-medium opacity-90">Emisi</p>
                                  <p className="text-lg font-bold">{log.carbon_emission} kg</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <ChevronDown 
                            size={20} 
                            className={`text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tanggal Lengkap</p>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{formatDate(log.date)}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Waktu</p>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{formatTime(log.created_at || log.date)}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Jumlah Input</p>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{log.input_value} {log.unit}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emission Factor</p>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{log.emission_factor || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Info */}
        {filteredAndSortedLogs.length > 0 && (
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>💡 Tip: Klik pada setiap aktivitas untuk melihat detail lebih lengkap</p>
          </div>
        )}
      </main>
    </div>
  );
}