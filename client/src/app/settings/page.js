'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Save, User, Mail, Lock, Shield, Calendar, Award, Zap, Flame, Clock, Eye, EyeOff, AlertCircle, CheckCircle2, Info, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      fetchAccountInfo(storedUser.id);
    }
  }, []);

  const fetchAccountInfo = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/account-info/${userId}`);
      const data = await res.json();
      
      if (res.ok) {
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

    const storedUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch(`${API_URL}/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: storedUser.id,
            username: formData.username
        })
      });

      const data = await res.json();
      if (res.ok) {
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
    const storedUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch(`${API_URL}/users/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: storedUser.id,
            showInLeaderboard: !showInLeaderboard
        })
      });

      const data = await res.json();
      if (res.ok) {
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

    const storedUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: storedUser.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
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
      <main className="flex-1 ml-64 p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Pengaturan Akun
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Kelola profil dan preferensi akun kamu</p>
        </div>

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
            
            {/* Profile Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User size={24}/>
                  Informasi Profil
                </h2>
              </div>
              
              <form onSubmit={handleUpdateUsername} className="p-6 space-y-6">
                
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Username</label>
                  <div className="relative">
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
                  </div>
                  {!accountInfo.canChangeUsername && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <Clock size={16} className="flex-shrink-0 mt-0.5"/>
                      <span>Username baru bisa diganti <strong>{accountInfo.daysUntilChange} hari</strong> lagi</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5">Username bisa diganti 1x per minggu</p>
                </div>

                {/* Email Field (Readonly) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20}/>
                    <input 
                      type="email" 
                      value={accountInfo.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-not-allowed text-gray-500 dark:text-gray-400"
                    />
                    {accountInfo.email_verified && (
                      <div className="absolute right-4 top-3.5">
                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                          <CheckCircle2 size={14}/>
                          Terverifikasi
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Email tidak dapat diubah</p>
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

            {/* Privacy Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield size={24}/>
                  Privasi & Keamanan
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                
                {/* Leaderboard Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    {showInLeaderboard ? <Eye size={20} className="text-purple-600 mt-1"/> : <EyeOff size={20} className="text-gray-400 dark:text-gray-500 mt-1"/>}
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">Tampil di Leaderboard</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Tampilkan profil kamu di leaderboard publik</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpdatePrivacy}
                    disabled={loading}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                      showInLeaderboard ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      showInLeaderboard ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    {theme === 'dark' ? <Moon size={20} className="text-purple-600 mt-1"/> : <Sun size={20} className="text-amber-500 mt-1"/>}
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">Mode Gelap</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Aktifkan tema gelap untuk kenyamanan mata</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {theme}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🖱️ Toggle clicked! Current theme:', theme);
                      toggleTheme();
                    }}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                      theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

              </div>
            </div>

            {/* Change Password Card - Only show for non-Google accounts */}
            {!accountInfo.isGoogleAccount && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Lock size={24}/>
                    Ganti Password
                  </h2>
                </div>
                
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                  
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
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                        placeholder="Masukkan password lama"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                        placeholder="Minimal 6 karakter"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                        placeholder="Ulangi password baru"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeOff size={20}/> : <Eye size={20}/>}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <div className={`h-1.5 flex-1 rounded-full transition ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition ${passwordData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition ${passwordData.newPassword.length >= 10 && /[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {passwordData.newPassword.length < 6 ? 'Lemah' : 
                         passwordData.newPassword.length < 8 ? 'Sedang' : 
                         passwordData.newPassword.length >= 10 && /[A-Z]/.test(passwordData.newPassword) ? 'Kuat' : 'Cukup Kuat'}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={passwordLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={20}/> {passwordLoading ? 'Menyimpan...' : 'Ubah Password'}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-2">
                    Pastikan password baru berbeda dengan password lama
                  </p>
                </form>
              </div>
            )}

          </div>

          {/* Right Column - Account Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Account Overview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award size={22}/>
                  Ringkasan Akun
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                
                {/* Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <Award size={18} className="text-blue-600 dark:text-blue-400"/>
                    </div>
                    <span className="font-semibold">Level</span>
                  </div>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{accountInfo.current_level}</span>
                </div>

                {/* Total XP */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <Zap size={18} className="text-purple-600 dark:text-purple-400"/>
                    </div>
                    <span className="font-semibold">Total XP</span>
                  </div>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{accountInfo.total_xp.toLocaleString()}</span>
                </div>

                {/* Current Streak */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                      <Flame size={18} className="text-orange-600 dark:text-orange-400"/>
                    </div>
                    <span className="font-semibold">Streak Saat Ini</span>
                  </div>
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{accountInfo.current_streak}</span>
                </div>

                <hr className="border-gray-200 dark:border-gray-700"/>

                {/* Member Since */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <Calendar size={16}/>
                    <span className="text-sm font-semibold">Bergabung Sejak</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-bold pl-6">{formatDate(accountInfo.created_at)}</p>
                </div>

                {/* Account Type */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <Shield size={16}/>
                    <span className="text-sm font-semibold">Tipe Akun</span>
                  </div>
                  <div className="pl-6">
                    {accountInfo.isGoogleAccount ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="font-bold text-gray-800 dark:text-gray-200">Google Account</span>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-800 dark:text-gray-200">Email Account</span>
                    )}
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