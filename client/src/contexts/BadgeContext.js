'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import BadgeRewardModal from '@/components/BadgeRewardModal';

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const [currentBadge, setCurrentBadge] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);

  // Show badge modal
  const showBadge = useCallback((badge) => {
    if (currentBadge) {
      // Jika sudah ada badge yang tampil, queue badge baru
      setBadgeQueue(prev => [...prev, badge]);
    } else {
      setCurrentBadge(badge);
    }
  }, [currentBadge]);

  // Show multiple badges (queue them)
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

  // Close current badge and show next in queue
  const handleClose = useCallback(() => {
    if (badgeQueue.length > 0) {
      // Show next badge from queue
      setCurrentBadge(badgeQueue[0]);
      setBadgeQueue(prev => prev.slice(1));
    } else {
      setCurrentBadge(null);
    }
  }, [badgeQueue]);

  // Check for new badges (dipanggil setelah mission claim atau activity log)
  const checkBadges = useCallback(async (userId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/badges/check`, {
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
  }, [showBadges]);

  return (
    <BadgeContext.Provider value={{ showBadge, showBadges, checkBadges }}>
      {children}
      {currentBadge && <BadgeRewardModal badge={currentBadge} onClose={handleClose} />}
    </BadgeContext.Provider>
  );
}

// Hook untuk akses badge context
export function useBadge() {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadge must be used within BadgeProvider');
  }
  return context;
}
