'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Save, User, Mail, Lock, Shield, Calendar, Award, Zap, Flame, Clock, Eye, EyeOff, AlertCircle, CheckCircle2, Info, Sun, Moon, HelpCircle, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserFromStorage } from '@/utils/userStorage';
import { apiGet, apiPut } from '@/utils/auth';
import { checkBannedStatus } from '@/utils/bannedCheck';
import useAuth from '@/hooks/useAuth';

export default function SettingsPage() {
  useAuth(); // 🔐 Protect this page
  const { theme, toggleTheme } = useTheme();
  const [accountInfo, setAccountInfo] = useState(null);
  const [formData, setFormData] = useState({ username: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showUsernameTooltip, setShowUsernameTooltip] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleTogglePasswordSection = () => {
    setShowPasswordSection(!showPasswordSection);
    if (!showPasswordSection) {
      // Scroll to password section after a short delay to allow animation
      setTimeout(() => {
        const passwordSection = document.getElementById('password-section');
        if (passwordSection) {
          passwordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (checkBannedStatus()) return;
    const storedUser = getUserFromStorage();
    if (storedUser) {
      fetchAccountInfo(storedUser.id);
    }
  }, []);

  const fetchAccountInfo = async (userId) => {
    try {
      const data = await apiGet(`/users/account-info/${userId}`);
      
      if (data) {
        setAccountInfo(data);
        setFormData({ username: data.username });
        setShowInLeaderboard(data.show_in_leaderboard);
      }
    } catch (err) {
      console.error('Fetch account info error:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const storedUser = getUserFromStorage();

    try {
      const data = await apiPut('/users/update', {
        userId: storedUser.id,
        username: formData.username
      });

      if (data) {
        setMessage({ type: 'success', text: 'Username berhasil diperbarui!' });
        
        // Update localStorage
        const updatedUser = { ...storedUser, username: formData.username };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Refresh account info
        fetchAccountInfo(storedUser.id);
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal memperbarui username' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivacy = async () => {
    setLoading(true);
    const storedUser = getUserFromStorage();

    try {
      const data = await apiPut('/users/privacy', {
        userId: storedUser.id,
        showInLeaderboard: !showInLeaderboard
      });

      if (data) {
        setShowInLeaderboard(!showInLeaderboard);
        setMessage({ type: 'success', text: 'Pengaturan privasi berhasil diperbarui!' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: 'Gagal memperbarui pengaturan privasi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok!' });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      setPasswordLoading(false);
      return;
    }

    const storedUser = getUserFromStorage();

    try {
      const data = await apiPut('/users/change-password', {
        userId: storedUser.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (data) {
        setPasswordMessage({ type: 'success', text: 'Password berhasil diubah!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setPasswordMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Gagal mengubah password' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Terjadi kesalahan server' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/10 to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48"></div>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-96"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!accountInfo) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/10 to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-0">
        <div className="p-8">
        

        {/* Global Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5"/> : <AlertCircle size={20} className="flex-shrink-0 mt-0.5"/>}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile & Account Info Card (Merged) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User size={24}/>
                  Profil & Ringkasan Akun
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdateUsername} className="space-y-6">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                          <Award size={24} className="text-blue-600 dark:text-blue-400"/>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{accountInfo.current_level}</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Level</div>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                          <Zap size={24} className="text-purple-600 dark:text-purple-400"/>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{accountInfo.total_xp.toLocaleString()}</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Total XP</div>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                          <Flame size={24} className="text-orange-600 dark:text-orange-400"/>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-orange-600 dark:text-orange-400">{accountInfo.current_streak}</div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">Streak</div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                        <Calendar size={16}/>
                        <span className="text-sm font-semibold">Bergabung Sejak</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 font-bold">{formatDate(accountInfo.created_at)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                        <Shield size={16}/>
                        <span className="text-sm font-semibold">Tipe Akun</span>
                      </div>
                      {accountInfo.isGoogleAccount ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="font-bold text-gray-800 dark:text-gray-200">Google</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-800 dark:text-gray-200">Email</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Username Field with Tooltip */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Username</label>
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowUsernameTooltip(true)}
                      onMouseLeave={() => setShowUsernameTooltip(false)}
                    >
                      <User className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        disabled={!accountInfo.canChangeUsername || loading}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                          !accountInfo.canChangeUsername 
                            ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 text-gray-900 dark:text-gray-100'
                        }`}
                        minLength={3}
                        maxLength={20}
                        required
                      />
                      
                      {/* Tooltip */}
                      {showUsernameTooltip && (
                        <div className="absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                          Username bisa diganti 1x per minggu
                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      )}
                    </div>
                    {!accountInfo.canChangeUsername && (
                      <div className="mt-2 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                        <Clock size={16} className="flex-shrink-0 mt-0.5"/>
                        <span>Username baru bisa diganti <strong>{accountInfo.daysUntilChange} hari</strong> lagi</span>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button 
                    type="submit" 
                    disabled={loading || !accountInfo.canChangeUsername || formData.username === accountInfo.username}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={20}/> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              </div>
            </div>

            {/* Privacy & Security Card (Merged with Password) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield size={24}/>
                  Privasi & Keamanan
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                
                {/* Email Field with Tooltip */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Email Address</label>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowEmailTooltip(true)}
                    onMouseLeave={() => setShowEmailTooltip(false)}
                  >
                    <Mail className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                    <input 
                      type="email" 
                      value={accountInfo.email}
                      disabled
                      className="w-full pl-12 pr-28 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400"
                    />
                    {accountInfo.email_verified && (
                      <div className="absolute right-4 top-3.5">
                        <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-bold">
                          <CheckCircle2 size={14}/>
                          Terverifikasi
                        </div>
                      </div>
                    )}
                    
                    {/* Tooltip */}
                    {showEmailTooltip && (
                      <div className="absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                        Email tidak dapat diubah
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700"/>
                
                {/* Change Password Button - Only for non-Google accounts */}
                {!accountInfo.isGoogleAccount && (
                  <>
                    <button
                      onClick={handleTogglePasswordSection}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition">
                          <KeyRound size={20} className="text-red-600 dark:text-red-400"/>
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-800 dark:text-gray-100">Ganti Password</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Ubah password akun kamu</p>
                        </div>
                      </div>
                      {showPasswordSection ? <ChevronUp size={20} className="text-gray-600 dark:text-gray-400"/> : <ChevronDown size={20} className="text-gray-600 dark:text-gray-400"/>}
                    </button>

                    {/* Password Change Form - Collapsible */}
                    {showPasswordSection && (
                      <form id="password-section" onSubmit={handleChangePassword} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        
                        {/* Password Change Message */}
                        {passwordMessage.text && (
                          <div className={`p-3 rounded-xl border-2 flex items-start gap-2 text-sm ${
                            passwordMessage.type === 'success' 
                              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' 
                              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                          }`}>
                            {passwordMessage.type === 'success' ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5"/> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5"/>}
                            <span className="font-medium">{passwordMessage.text}</span>
                          </div>
                        )}

                        {/* Current Password */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Password Lama</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                            <input 
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-gray-900 dark:text-gray-100"
                              placeholder="Masukkan password lama"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.current ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Password Baru</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                            <input 
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-gray-900 dark:text-gray-100"
                              placeholder="Minimal 6 karakter"
                              minLength={6}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.new ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Konfirmasi Password Baru</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                            <input 
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-gray-900 dark:text-gray-100"
                              placeholder="Ulangi password baru"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.confirm ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                          type="submit" 
                          disabled={passwordLoading}
                          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Save size={20}/> {passwordLoading ? 'Menyimpan...' : 'Ubah Password'}
                        </button>
                      </form>
                    )}
                  </>
                )}

              </div>
            </div>

          </div>

          {/* Right Column - Pengaturan Tambahan & Bantuan */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Pengaturan Tambahan Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield size={22}/>
                  Pengaturan Tambahan
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                
                {/* Leaderboard Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {showInLeaderboard ? <Eye size={18} className="text-blue-600 dark:text-blue-400"/> : <EyeOff size={18} className="text-gray-400 dark:text-gray-500"/>}
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">Tampil di Leaderboard</h3>
                    </div>
                    <button
                      onClick={handleUpdatePrivacy}
                      disabled={loading}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                        showInLeaderboard ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        showInLeaderboard ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">Tampilkan profil kamu di leaderboard publik</p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700"/>

                {/* Theme Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Moon size={18} className="text-indigo-600 dark:text-indigo-400"/> : <Sun size={18} className="text-amber-500"/>}
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">Mode Gelap</h3>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                        theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">Aktifkan tema gelap untuk kenyamanan mata</p>
                </div>

              </div>
            </div>

            {/* Help & Support Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <HelpCircle size={22}/>
                  Bantuan & Dukungan
                </h2>
              </div>
              
              <div className="p-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                    <HelpCircle size={32} className="text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Perlu Bantuan?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Tim kami siap membantu menjawab pertanyaan dan menyelesaikan masalah kamu
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Hubungi Kami</p>
                    <a 
                      href="mailto:carbontrackappservice.2025@gmail.com"
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-sm flex items-center justify-center gap-2"
                    >
                      <Mail size={16}/>
                      carbontrackappservice.2025@gmail.com
                    </a>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Kami akan merespon dalam 1-2 hari kerja
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
        </div>
      </main>
    </div>
  );
}