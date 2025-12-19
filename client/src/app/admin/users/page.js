'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Shield, ShieldAlert, ShieldOff, Clock, Loader2, ArrowUp, ArrowDown, X,
  LogOut, Settings, Activity, Target, BarChart3, Menu, ChevronRight, Leaf
} from 'lucide-react';
import io from 'socket.io-client';

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);
  const socketRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  
  // Modal confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  
  // Sorting state
  const [sortField, setSortField] = useState('status'); // 'username', 'current_level', 'status', 'last_login'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc' (for status: asc = online first)

  const LIMIT = 10;

  // Check auth and load admin info
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const info = localStorage.getItem('adminInfo');
    
    if (!token || !info) {
      router.push('/admin/login');
      return;
    }
    
    setAdminInfo(JSON.parse(info));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    router.push('/admin/login');
  };

  // Fetch users with progressive loading
  const fetchUsers = async (reset = false) => {
    if (loadingRef.current || (!hasMore && !reset)) return;
    
    loadingRef.current = true;
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const currentOffset = reset ? 0 : offset;

      const params = new URLSearchParams({
        limit: LIMIT,
        offset: currentOffset,
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users-status?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (reset) {
        setUsers(data.users);
        setOffset(LIMIT);
      } else {
        // Prevent duplicates by filtering out users that already exist
        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = data.users.filter(u => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
        setOffset(prev => prev + LIMIT);
      }

      setHasMore(data.pagination.hasMore);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Extract base URL without /api suffix for Socket.IO connection
    const baseURL = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    console.log('🔌 Initializing WebSocket connection to:', baseURL);
    
    // Connect to WebSocket server
    const socket = io(baseURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Admin panel connected to WebSocket, Socket ID:', socket.id);
      // Join admin room to receive user status updates
      socket.emit('join_admin', 'admin_room');
      console.log('📢 Emitted join_admin event to join admin_room');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Listen for user status changes (login/logout/ban/unban)
    socket.on('user_status_changed', (data) => {
      console.log('📡 RECEIVED user_status_changed event:', data);
      console.log('Current users count:', users.length);
      
      // Update user in the list
      setUsers(prevUsers => {
        console.log('🔄 Updating users list, current count:', prevUsers.length);
        const existingUserIndex = prevUsers.findIndex(u => u.id === data.userId);
        console.log('User index in list:', existingUserIndex);
        
        if (existingUserIndex !== -1) {
          // User exists in list - update status and last_login
          const updatedUsers = [...prevUsers];
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            status: data.status,
            last_login: data.lastLogin || updatedUsers[existingUserIndex].last_login
          };
          console.log('✅ Updated user:', updatedUsers[existingUserIndex]);
          return updatedUsers;
        } else {
          // User not in list yet - could be a new user, don't auto-add to avoid pagination issues
          console.log('⚠️ User not found in current list (userId:', data.userId, ')');
          return prevUsers;
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Admin panel disconnected from WebSocket');
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socket.disconnect();
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers(true);
  }, [search, statusFilter]);

  // Progressive loading - auto load next batch after 2 seconds idle
  useEffect(() => {
    if (!hasMore || loading) return;

    const timer = setTimeout(() => {
      fetchUsers();
    }, 2000); // Load next batch after 2s

    return () => clearTimeout(timer);
  }, [users, hasMore, loading]);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort users locally
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Special handling for status sorting with custom priority
    if (sortField === 'status') {
      const statusPriority = {
        'online': 1,
        'idle': 2,
        'banned': 3,
        'offline': 4
      };
      aVal = statusPriority[aVal] || 99;
      bVal = statusPriority[bVal] || 99;
    }
    // Handle null values for last_login
    else if (sortField === 'last_login') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }
    // Handle string comparison for username
    else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Confirmation modal handlers
  const openBanConfirmation = (user) => {
    setUserToBan(user);
    setShowConfirmModal(true);
  };

  const closeBanConfirmation = () => {
    setShowConfirmModal(false);
    setUserToBan(null);
  };

  const confirmBan = () => {
    if (userToBan) {
      updateUserStatus(userToBan.id, 'banned');
      closeBanConfirmation();
    }
  };

  // Update user status
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      alert(data.message);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status user');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const configs = {
      online: { bg: 'bg-green-500/20', text: 'text-green-300', icon: '🟢', label: 'Online' },
      idle: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', icon: '🟡', label: 'Idle' },
      offline: { bg: 'bg-gray-500/20', text: 'text-gray-300', icon: '⚪', label: 'Offline' },
      banned: { bg: 'bg-red-500/20', text: 'text-red-300', icon: '🔴', label: 'Banned' },
    };

    const config = configs[status] || configs.offline;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

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
              { id: 'overview', label: 'Overview', icon: BarChart3, link: '/admin/dashboard' },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'user-control', label: 'User Control', icon: Shield, active: true },
              { id: 'activities', label: 'Activities', icon: Activity },
              { id: 'missions', label: 'Missions', icon: Target },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              
              // If item has link, use router.push
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
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
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-blue-400" size={36} />
            User Control Panel
          </h1>
          <p className="text-gray-300">
            Total: {total} users | Loaded: {users.length} users | Real-time updates: Active 🟢
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                  setHasMore(true);
                }}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
                setHasMore(true);
              }}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            >
              <option value="" className="bg-slate-800">All Status</option>
              <option value="online" className="bg-slate-800">Online</option>
              <option value="idle" className="bg-slate-800">Idle</option>
              <option value="offline" className="bg-slate-800">Offline</option>
              <option value="banned" className="bg-slate-800">Banned</option>
            </select>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center gap-2">
                      User
                      {sortField === 'username' && (
                        sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-400" /> : <ArrowDown size={16} className="text-blue-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('current_level')}
                  >
                    <div className="flex items-center gap-2">
                      Level
                      {sortField === 'current_level' && (
                        sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-400" /> : <ArrowDown size={16} className="text-blue-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-400" /> : <ArrowDown size={16} className="text-blue-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('last_login')}
                  >
                    <div className="flex items-center gap-2">
                      Last Login
                      {sortField === 'last_login' && (
                        sortOrder === 'asc' ? <ArrowUp size={16} className="text-blue-400" /> : <ArrowDown size={16} className="text-blue-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">Lv {user.current_level}</span>
                        <span className="text-xs text-gray-400">({user.total_xp} XP)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.last_login ? new Date(user.last_login).toLocaleString('id-ID') : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.status !== 'banned' && (
                          <button
                            onClick={() => openBanConfirmation(user)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                            title="Ban User"
                          >
                            <ShieldAlert size={16} />
                            Ban
                          </button>
                        )}
                        {user.status === 'banned' && (
                          <button
                            onClick={() => updateUserStatus(user.id, 'offline')}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                            title="Unban User"
                          >
                            <Shield size={16} />
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8 text-gray-300">
              <Loader2 className="animate-spin text-blue-400" size={20} />
              <span>Loading more users...</span>
            </div>
          )}

          {/* All loaded */}
          {!hasMore && users.length > 0 && (
            <div className="text-center p-8 text-gray-300">
              ✅ All {total} users loaded
            </div>
          )}

          {/* Empty state */}
          {users.length === 0 && !loading && (
            <div className="text-center p-12 text-gray-400">
              <Users size={48} className="mx-auto mb-4" />
              <p className="text-lg">No users found</p>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={24} />
                Konfirmasi Ban User
              </h3>
              <button
                onClick={closeBanConfirmation}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Apakah Anda yakin ingin <span className="font-bold text-red-600">ban</span> user ini?
              </p>
              {userToBan && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">User:</div>
                  <div className="font-semibold text-gray-900">{userToBan.username}</div>
                  <div className="text-sm text-gray-500">{userToBan.email}</div>
                </div>
              )}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ User yang di-ban tidak akan bisa mengakses aplikasi dan akan segera ter-redirect ke halaman banned.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeBanConfirmation}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={confirmBan}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <ShieldAlert size={18} />
                Ya, Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
