'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import BadgeRewardModal from '@/components/BadgeRewardModal';

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const [currentBadge, setCurrentBadge] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);

  // --- PERBAIKAN URL ---
  // Gunakan variabel environment, kalau tidak ada baru pakai localhost
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const showBadge = useCallback((badge) => {
    if (currentBadge) {
      setBadgeQueue(prev => [...prev, badge]);
    } else {
      setCurrentBadge(badge);
    }
  }, [currentBadge]);

  const showBadges = useCallback((badges) => {
    if (badges && badges.length > 0) {
      if (currentBadge) {
        setBadgeQueue(prev => [...prev, ...badges]);
      } else {
        setCurrentBadge(badges[0]);
        if (badges.length > 1) {
          setBadgeQueue(badges.slice(1));
        }
      }
    }
  }, [currentBadge]);

  const handleClose = useCallback(() => {
    if (badgeQueue.length > 0) {
      setCurrentBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    } else {
      setCurrentBadge(null);
    }
  }, [badgeQueue]);

  // Check for new badges
  const checkBadges = useCallback(async (userId) => {
    try {
      // Gunakan API_URL yang sudah didefinisikan di atas
      const response = await fetch(`${API_URL}/badges/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.hasNewBadges && data.newBadges.length > 0) {
        showBadges(data.newBadges);
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking badges:', error);
      return { hasNewBadges: false, newBadges: [] };
    }
  }, [showBadges, API_URL]); // Masukkan API_URL ke dependency

  return (
    <BadgeContext.Provider value={{ showBadge, showBadges, checkBadges }}>
      {children}
      {currentBadge && <BadgeRewardModal badge={currentBadge} onClose={handleClose} />}
    </BadgeContext.Provider>
  );
}

export function useBadge() {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadge must be used within BadgeProvider');
  }
  return context;
}