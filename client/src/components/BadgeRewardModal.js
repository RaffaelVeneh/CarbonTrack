'use client';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Award, X, Star, Sparkles } from 'lucide-react';

// Tier colors mapping
const TIER_COLORS = {
  bronze: { bg: 'from-amber-700 to-amber-900', border: 'border-amber-500', glow: 'shadow-amber-500/50' },
  silver: { bg: 'from-gray-400 to-gray-600', border: 'border-gray-300', glow: 'shadow-gray-400/50' },
  gold: { bg: 'from-yellow-400 to-yellow-600', border: 'border-yellow-300', glow: 'shadow-yellow-400/50' },
  diamond: { bg: 'from-cyan-400 to-blue-600', border: 'border-cyan-300', glow: 'shadow-cyan-400/50' },
  legendary: { bg: 'from-purple-500 to-pink-600', border: 'border-purple-300', glow: 'shadow-purple-500/50' }
};

// Tier labels
const TIER_LABELS = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver', 
  gold: '🥇 Gold',
  diamond: '💎 Diamond',
  legendary: '👑 Legendary'
};

export default function BadgeRewardModal({ badge, onClose }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (badge) {
      setMounted(true);
      setShowConfetti(true);
      
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [badge]);

  if (!badge) return null;

  const tierStyle = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Confetti Animation */}
      {showConfetti && mounted && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
          numberOfPieces={500}
          recycle={false}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
        />
      )}

      {/* Modal Content - Responsive */}
      <div className="relative max-w-[90vw] sm:max-w-md md:max-w-lg w-full mx-4 animate-scale-in">
        {/* Close Button - Responsive Size */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 z-10 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-1.5 sm:p-2 shadow-lg transition"
          title="Tutup"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Card Container */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 sm:border-4 border-emerald-400">
          {/* Header Section with Gradient - Responsive Padding */}
          <div className={`bg-gradient-to-r ${tierStyle.bg} py-4 sm:py-6 md:py-8 px-4 sm:px-6 text-center relative overflow-hidden`}>
            {/* Animated Stars Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              {[...Array(20)].map((_, i) => (
                <Sparkles
                  key={i}
                  size={12}
                  className="absolute animate-twinkle sm:w-4 sm:h-4"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <Award size={32} className="mx-auto mb-2 text-white drop-shadow-lg sm:w-12 sm:h-12" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2 drop-shadow-lg">
                🎉 BADGE UNLOCKED! 🎉
              </h2>
              <p className="text-white/90 text-xs sm:text-sm font-medium">
                {TIER_LABELS[badge.tier]}
              </p>
            </div>
          </div>

          {/* Badge Display Section - Responsive Padding */}
          <div className="py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 text-center">
            {/* Badge Icon dengan Glow Effect - Responsive Size */}
            <div className={`inline-block mb-4 sm:mb-6 relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${tierStyle.bg} blur-xl sm:blur-2xl opacity-60 scale-110 animate-pulse`}></div>
              <div className={`relative text-5xl sm:text-6xl md:text-8xl animate-bounce-slow bg-gradient-to-br from-white to-gray-100 rounded-full p-4 sm:p-5 md:p-6 border-2 sm:border-4 ${tierStyle.border} shadow-2xl ${tierStyle.glow}`}>
                {badge.icon}
              </div>
            </div>

            {/* Badge Info - Responsive Text */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 mb-2 sm:mb-3 px-2">
              {badge.name}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed px-2">
              {badge.description}
            </p>

            {/* Category Tag - Responsive */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Star size={14} className="sm:w-4 sm:h-4" />
              {badge.category.toUpperCase()}
            </div>

            {/* Action Button - Responsive */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-sm sm:text-base shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              Mantap! Lanjutkan 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
