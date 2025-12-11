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

      {/* Modal Content */}
      <div className="relative max-w-lg w-full mx-4 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-2 shadow-lg transition"
          title="Tutup"
        >
          <X size={24} />
        </button>

        {/* Card Container */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-emerald-400">
          {/* Header Section with Gradient */}
          <div className={`bg-gradient-to-r ${tierStyle.bg} py-8 px-6 text-center relative overflow-hidden`}>
            {/* Animated Stars Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
              {[...Array(20)].map((_, i) => (
                <Sparkles
                  key={i}
                  size={16}
                  className="absolute animate-twinkle"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <Award size={48} className="mx-auto mb-3 text-white drop-shadow-lg" />
              <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                🎉 BADGE UNLOCKED! 🎉
              </h2>
              <p className="text-white/90 text-sm font-medium">
                {TIER_LABELS[badge.tier]}
              </p>
            </div>
          </div>

          {/* Badge Display Section */}
          <div className="py-10 px-8 text-center">
            {/* Badge Icon dengan Glow Effect */}
            <div className={`inline-block mb-6 relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${tierStyle.bg} blur-2xl opacity-60 scale-110 animate-pulse`}></div>
              <div className={`relative text-8xl animate-bounce-slow bg-gradient-to-br from-white to-gray-100 rounded-full p-6 border-4 ${tierStyle.border} shadow-2xl ${tierStyle.glow}`}>
                {badge.icon}
              </div>
            </div>

            {/* Badge Info */}
            <h3 className="text-3xl font-black text-gray-800 mb-3">
              {badge.name}
            </h3>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              {badge.description}
            </p>

            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star size={16} />
              {badge.category.toUpperCase()}
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              Mantap! Lanjutkan 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
