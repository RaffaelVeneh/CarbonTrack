'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { Trophy, Crown, Medal, Search, TrendingUp, Award, Zap, Leaf, Star, Users, Filter, ChevronDown, Sparkles, Loader2 } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'xp', 'level', 'co2'
  const [currentUser, setCurrentUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredRank, setHoveredRank] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const observerRef = useRef(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (pageNum, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`${API_URL}/users/leaderboard?page=${pageNum}&limit=10`);
      const response = await res.json();

      console.log('Leaderboard Response:', response);

      // Handle both old format (array) and new format (object with pagination)
      if (Array.isArray(response)) {
        // Old format - just array of users
        if (append) {
          setLeaders(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPlayers = response.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPlayers];
          });
        } else {
          setLeaders(response);
        }
        setHasMore(false); // No pagination in old format
        setTotalUsers(response.length);
      } else if (response.data && Array.isArray(response.data)) {
        // New format - object with data and pagination
        if (append) {
          setLeaders(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPlayers = response.data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPlayers];
          });
        } else {
          setLeaders(response.data);
        }
        setHasMore(response.pagination?.hasMore || false);
        setTotalUsers(response.pagination?.totalUsers || response.data.length);
      } else {
        // Error response or empty
        console.error('Unexpected response format:', response);
        setHasMore(false);
        setTotalUsers(0);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Leaderboard Fetch Error:', err);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [API_URL]);

  useEffect(() => {
    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    // Fetch initial data
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    if (searchQuery || filterType !== 'all') {
      // When searching/filtering, disable infinite scroll
      setHasMore(false);
    }
  }, [searchQuery, filterType]);

  // Filter and search logic
  const filteredLeaders = useMemo(() => {
    let filtered = [...leaders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(player => 
        player.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort filter
    switch (filterType) {
      case 'xp':
        filtered.sort((a, b) => b.total_xp - a.total_xp);
        break;
      case 'level':
        filtered.sort((a, b) => b.current_level - a.current_level);
        break;
      case 'co2':
        filtered.sort((a, b) => (b.total_co2_saved || 0) - (a.total_co2_saved || 0));
        break;
      default:
        // Already sorted by total_xp from backend
        break;
    }

    return filtered;
  }, [leaders, searchQuery, filterType]);

  // Infinite scroll observer
  const lastLeaderRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchLeaderboard(nextPage, true);
          return nextPage;
        });
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchLeaderboard]);

  // Stats calculation
  const stats = useMemo(() => {
    if (leaders.length === 0) return null;
    
    return {
      totalUsers: totalUsers,
      loadedUsers: leaders.length,
      avgLevel: Math.round(leaders.reduce((sum, p) => sum + p.current_level, 0) / leaders.length),
      totalXP: leaders.reduce((sum, p) => sum + p.total_xp, 0),
      topXP: leaders[0]?.total_xp || 0
    };
  }, [leaders, totalUsers]);

  // Find current user rank
  const currentUserRank = useMemo(() => {
    if (!currentUser) return null;
    const index = leaders.findIndex(p => p.id === currentUser.id);
    return index >= 0 ? index + 1 : null;
  }, [leaders, currentUser]);

  // Styling functions
  const getRankStyle = (index, isCurrentUser) => {
    if (isCurrentUser) {
      return 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg transform scale-[1.02]';
    }
    if (index === 0) return 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-600 shadow-xl shadow-yellow-100/50 dark:shadow-yellow-900/20'; // Emas
    if (index === 1) return 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 border-2 border-gray-400 dark:border-gray-600 shadow-lg shadow-gray-100 dark:shadow-gray-900/50';     // Perak
    if (index === 2) return 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-orange-400 dark:border-orange-600 shadow-lg shadow-orange-100 dark:shadow-orange-900/20'; // Perunggu
    return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md';
  };

  const getRankIcon = (index) => {
    if (index === 0) return (
      <div className="relative">
        <Crown className="text-yellow-500 fill-yellow-400 drop-shadow-lg animate-pulse" size={28} />
        <Sparkles className="absolute -top-1 -right-1 text-yellow-400" size={12} />
      </div>
    );
    if (index === 1) return <Medal className="text-gray-500 fill-gray-400 drop-shadow-md" size={26} />;
    if (index === 2) return <Medal className="text-orange-500 fill-orange-400 drop-shadow-md" size={26} />;
    return <span className="font-bold text-gray-500 text-lg">#{index + 1}</span>;
  };

  const getRankBadge = (index) => {
    if (index === 0) return '👑 Juara 1';
    if (index === 1) return '🥈 Juara 2';
    if (index === 2) return '🥉 Juara 3';
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-teal-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* Animated Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-emerald-400/10 to-teal-400/10 animate-gradient rounded-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border-2 border-white dark:border-gray-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative p-4 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl shadow-xl">
                    <Trophy size={40} className="drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 via-emerald-600 to-teal-600 dark:from-yellow-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Hall of Fame
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 font-medium">Pahlawan Lingkungan Terbaik</p>
                </div>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3 lg:p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total Pengguna</span>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalUsers}</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{stats.loadedUsers} dimuat</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-3 lg:p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Rata-rata Level</span>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.avgLevel}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-3 lg:p-4 rounded-xl border border-emerald-200 dark:border-emerald-700 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Total XP Komunitas</span>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.totalXP.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Current User Rank Badge */}
            {currentUserRank && (
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <Award className="animate-bounce" size={24} />
                    <div>
                      <p className="text-sm font-medium opacity-90">Peringkat Anda</p>
                      <p className="text-2xl font-bold">#{currentUserRank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Dari {stats.totalUsers} Pengguna</p>
                    <p className="text-xs opacity-75">Terus tingkatkan! 🚀</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Cari nama pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <Filter size={20} />
                <span className="hidden lg:inline">Filter</span>
                <ChevronDown size={18} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                  {[
                    { value: 'all', label: 'Semua', icon: Trophy },
                    { value: 'xp', label: 'XP Tertinggi', icon: Zap },
                    { value: 'level', label: 'Level Tertinggi', icon: TrendingUp },
                    { value: 'co2', label: 'CO2 Tersimpan', icon: Leaf }
                  ].map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setFilterType(filter.value);
                          setShowFilters(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors ${
                          filterType === filter.value ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top 3 Podium - Only show when no search/filter */}
        {!searchQuery && filterType === 'all' && filteredLeaders.length >= 3 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4 max-w-4xl mx-auto">
              {/* 2nd Place - Higher than 3rd */}
              <div className="flex-1 max-w-xs md:mt-12">
                <div className="bg-gradient-to-br from-slate-100 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-2xl shadow-lg border-2 border-gray-400 dark:border-gray-600 hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <div className="relative inline-block mb-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-200 border-3 border-white dark:border-gray-500 shadow-lg">
                        {filteredLeaders[1].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md">
                        <Medal className="text-gray-500 dark:text-gray-400 fill-gray-400 dark:fill-gray-500" size={18} />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100 truncate">{filteredLeaders[1].username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">🥈 Juara 2</p>
                    <div className="space-y-1.5">
                      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                        <p className="font-bold text-base text-blue-600 dark:text-blue-400">{filteredLeaders[1].current_level}</p>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total XP</p>
                        <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">{filteredLeaders[1].total_xp.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place - Highest */}
              <div className="flex-1 max-w-xs">
                <div className="bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 p-5 rounded-2xl shadow-2xl border-2 border-yellow-400 hover:scale-105 transition-transform duration-300 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg animate-bounce">
                      🏆 Champion
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <div className="relative inline-block mb-3">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-3xl font-bold text-white border-3 border-white shadow-2xl animate-pulse">
                        {filteredLeaders[0].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-xl">
                        <Crown className="text-yellow-500 fill-yellow-400" size={22} />
                      </div>
                      <div className="absolute -top-1 -left-1">
                        <Star className="text-yellow-400 fill-yellow-300 animate-spin-slow" size={16} />
                      </div>
                    </div>
                    <h3 className="font-bold text-xl mb-1 text-yellow-900 dark:text-yellow-100 truncate">{filteredLeaders[0].username}</h3>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold mb-2">👑 Juara 1</p>
                    <div className="space-y-1.5">
                      <div className="bg-white/90 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                        <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{filteredLeaders[0].current_level}</p>
                      </div>
                      <div className="bg-white/90 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total XP</p>
                        <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{filteredLeaders[0].total_xp.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place - Lowest */}
              <div className="flex-1 max-w-xs md:mt-20">
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 p-4 rounded-2xl shadow-lg border-2 border-orange-400 dark:border-orange-700 hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <div className="relative inline-block mb-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 dark:from-orange-700 dark:to-amber-700 flex items-center justify-center text-2xl font-bold text-orange-800 dark:text-orange-200 border-3 border-white dark:border-orange-600 shadow-lg">
                        {filteredLeaders[2].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-md">
                        <Medal className="text-orange-500 dark:text-orange-400 fill-orange-400 dark:fill-orange-500" size={18} />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-orange-900 dark:text-orange-200 truncate">{filteredLeaders[2].username}</h3>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">🥉 Juara 3</p>
                    <div className="space-y-1.5">
                      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                        <p className="font-bold text-base text-blue-600 dark:text-blue-400">{filteredLeaders[2].current_level}</p>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total XP</p>
                        <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">{filteredLeaders[2].total_xp.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Trophy size={24} />
              Papan Peringkat Lengkap
            </h2>
          </div>

          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5 pl-4">Pengguna</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-center">XP</div>
            <div className="col-span-2 text-center">CO2 Saved</div>
          </div>

          {loading ? (
             <div className="p-16 text-center">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 dark:border-t-emerald-400"></div>
                  <Trophy className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400" size={24} />
                </div>
                <p className="mt-6 text-gray-500 dark:text-gray-400 font-medium">Memuat data juara...</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tunggu sebentar ya! 🏆</p>
             </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="p-16 text-center">
              <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada hasil ditemukan</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Coba kata kunci lain</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLeaders.map((player, index) => {
                const isCurrentUser = currentUser && player.id === currentUser.id;
                const rankBadge = getRankBadge(index);
                const isLastItem = index === filteredLeaders.length - 1;
                
                return (
                  <div 
                    key={player.id} 
                    ref={isLastItem ? lastLeaderRef : null}
                    onMouseEnter={() => setHoveredRank(index)}
                    onMouseLeave={() => setHoveredRank(null)}
                    className={`grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-5 items-center transition-all duration-300 cursor-pointer ${getRankStyle(index, isCurrentUser)} ${
                      hoveredRank === index ? 'transform scale-[1.01]' : ''
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(index)}
                        </div>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-3 shadow-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white border-yellow-400' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 border-gray-400' :
                          index === 2 ? 'bg-gradient-to-br from-orange-200 to-amber-300 text-orange-800 border-orange-400' :
                          isCurrentUser ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-500' :
                          'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{player.username}</span>
                            {isCurrentUser && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Anda</span>}
                          </div>
                          {rankBadge && <span className="text-xs bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-700 dark:to-orange-700 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded-full font-bold">{rankBadge}</span>}
                          <div className="flex gap-3 mt-2 text-sm">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">Lvl {player.current_level}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{player.total_xp.toLocaleString()} XP</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:contents">
                      {/* Rank Icon */}
                      <div className="col-span-1 flex justify-center">
                        {getRankIcon(index)}
                      </div>

                      {/* User Info */}
                      <div className="col-span-5 flex items-center gap-4 pl-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-3 shadow-lg transition-transform ${
                          hoveredRank === index ? 'scale-110' : ''
                        } ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white border-yellow-400' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 border-gray-400' :
                          index === 2 ? 'bg-gradient-to-br from-orange-200 to-amber-300 text-orange-800 border-orange-400' :
                          isCurrentUser ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-500' :
                          'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{player.username}</span>
                            {isCurrentUser && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">Anda</span>}
                          </div>
                          {rankBadge && <span className="text-xs bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-700 dark:to-orange-700 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded-full font-bold inline-block mt-1">{rankBadge}</span>}
                        </div>
                      </div>

                      {/* Level */}
                      <div className="col-span-2 flex justify-center">
                        <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold shadow-md">
                          Level {player.current_level}
                        </span>
                      </div>

                      {/* XP */}
                      <div className="col-span-2 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          <Zap className="text-emerald-600" size={16} />
                          <span className="font-mono font-bold text-lg text-emerald-700">{player.total_xp.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* CO2 Saved */}
                      <div className="col-span-2 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border border-green-200">
                          <Leaf className="text-green-600" size={16} />
                          <span className="font-bold text-green-700">{(parseFloat(player.total_co2_saved) || 0).toFixed(1)} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full border-2 border-emerald-200 dark:border-emerald-700">
                <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={20} />
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Memuat lebih banyak...</span>
              </div>
            </div>
          )}

          {/* No More Data Indicator */}
          {!hasMore && leaders.length > 0 && !loading && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">
                <Trophy className="text-gray-400 dark:text-gray-500" size={20} />
                <span className="text-gray-600 dark:text-gray-300 font-semibold">Semua data telah dimuat • {totalUsers} pengguna</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Data diperbarui secara real-time • Terus tingkatkan kontribusimu! 🌱</p>
        </div>
      </main>
    </div>
  );
}