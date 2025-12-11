'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Zap, PartyPopper, X } from 'lucide-react';

export default function NotificationDropdown({ notification, onClose }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Animasi progress bar
      setTimeout(() => {
        setProgress(notification.xpPercentage || 0);
      }, 300);

      // Auto close setelah 5 detik
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!notification) return null;

  const isLevelUp = notification.type === 'levelup';

  return (
    <div 
      className={`fixed top-20 right-6 z-[999] transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-96 overflow-hidden border-2 ${
        isLevelUp ? 'border-yellow-300' : 'border-emerald-300'
      }`}>
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${
          isLevelUp 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isLevelUp ? 'bg-white/30' : 'bg-white/30'
            } backdrop-blur-sm animate-bounce`}>
              {isLevelUp ? (
                <PartyPopper size={20} className="text-white" />
              ) : (
                <CheckCircle size={20} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {isLevelUp ? '🎉 LEVEL UP!' : '✅ Misi Selesai!'}
              </h3>
              <p className="text-white/90 text-xs">
                {isLevelUp ? `Level ${notification.newLevel}` : `+${notification.xpGained} XP`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4 font-medium">
            {notification.message}
          </p>

          {/* XP Progress Bar - Hanya tampil jika bukan level up */}
          {!isLevelUp && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Progress XP</span>
                <span className="text-emerald-600 font-bold">
                  {notification.currentXP} / {notification.maxXP} XP
                </span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                {/* Background glow effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-20 blur-sm"
                  style={{ 
                    width: `${progress}%`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                {/* Main progress bar dengan animasi */}
                <div 
                  className="relative h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {notification.xpPercentage >= 100 
                  ? '🎯 Siap naik level!' 
                  : `${(100 - notification.xpPercentage).toFixed(0)}% lagi untuk level berikutnya`
                }
              </p>
            </div>
          )}

          {/* Level Up Celebration */}
          {isLevelUp && (
            <div className="text-center space-y-3">
              <div className="text-6xl animate-bounce">🎊</div>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-200">
                <p className="text-2xl font-bold text-yellow-700 mb-1">
                  Level {notification.newLevel}
                </p>
                <p className="text-sm text-yellow-600">
                  Kamu mendapatkan +{notification.xpGained} XP
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
              isLevelUp
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {isLevelUp ? 'Keren Banget! 🔥' : 'Mantap! 👍'}
          </button>
        </div>
      </div>
    </div>
  );
}
