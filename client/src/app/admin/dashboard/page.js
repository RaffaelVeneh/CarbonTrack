'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, Activity, TrendingUp, Award, Leaf, 
  LogOut, Settings, Search, Filter, ChevronRight,
  Calendar, Clock, Zap, Target, BarChart3, UserCheck,
  AlertCircle, Loader2, Menu, X
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    
    if (!token || !info) {
      router.push('/admin/login');
      return;
    }
    
    setAdminInfo(JSON.parse(info));
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      
      if (res.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-slate-800/80 backdrop-blur-lg border-r border-white/10 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="text-white" size={24} />
              </div>
              {sidebarOpen && <span className="text-white font-bold text-lg">Admin Panel</span>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="text-white" size={20} /> : <Menu className="text-white" size={20} />}
            </button>
          </div>

          {/* Admin Info */}
          {sidebarOpen && adminInfo && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {adminInfo.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{adminInfo.username}</p>
                  <p className="text-gray-400 text-xs">{adminInfo.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'user-control', label: 'User Control', icon: Shield, link: '/admin/users' },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'missions', label: 'Missions', icon: Target },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              
              // If item has link, use router.push instead of setActiveTab
              if (item.link) {
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.link)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    {sidebarOpen && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                );
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full mt-8 flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-300">Welcome back, {adminInfo?.username}! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="text-blue-400" size={24} />
                </div>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <TrendingUp size={16} />
                  +{stats.newUsersToday}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-gray-400 mt-2">{stats.activeUsers} active this week</p>
            </div>

            {/* Today's Activities */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Activity className="text-purple-400" size={24} />
                </div>
                <span className="text-sm text-purple-400 flex items-center gap-1">
                  <Clock size={16} />
                  Today
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Activities Logged</h3>
              <p className="text-3xl font-bold text-white">{stats.todayActivities}</p>
              <p className="text-xs text-gray-400 mt-2">User interactions</p>
            </div>

            {/* Total CO2 Saved */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Leaf className="text-green-400" size={24} />
                </div>
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <Zap size={16} />
                  All time
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total CO2 Saved</h3>
              <p className="text-3xl font-bold text-white">{stats.totalCO2Saved} kg</p>
              <p className="text-xs text-gray-400 mt-2">Environmental impact</p>
            </div>

            {/* Completed Missions */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Award className="text-orange-400" size={24} />
                </div>
                <span className="text-sm text-orange-400 flex items-center gap-1">
                  <Target size={16} />
                  Total
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Missions Completed</h3>
              <p className="text-3xl font-bold text-white">{stats.completedMissions}</p>
              <p className="text-xs text-gray-400 mt-2">
                {stats.dailyMissionsToday} daily, {stats.weeklyMissionsThisWeek} weekly
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={24} />
                Quick Actions
              </h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users className="text-blue-400" size={20} />
                  <div className="text-left">
                    <p className="text-white font-medium">Manage Users</p>
                    <p className="text-xs text-gray-400">View and manage all users</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-green-400" size={20} />
                  <div className="text-left">
                    <p className="text-white font-medium">View Analytics</p>
                    <p className="text-xs text-gray-400">Detailed statistics and reports</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <Settings className="text-purple-400" size={20} />
                  <div className="text-left">
                    <p className="text-white font-medium">System Settings</p>
                    <p className="text-xs text-gray-400">Configure application settings</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCheck size={24} />
                System Status
              </h2>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                All Systems Operational
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Database</span>
                <span className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API Server</span>
                <span className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Authentication</span>
                <span className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Last Backup</span>
                <span className="text-gray-400">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
