'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import BadgeRewardModal from '@/components/BadgeRewardModal';

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const [currentBadge, setCurrentBadge] = useState(null);
  const [badgeQueue, setBadgeQueue] = useState([]);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);

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

  // OPTIMIZED: Check for new badges dengan debounce & rate limiting
  const checkBadges = useCallback(async (userId) => {
    // Prevent concurrent checks
    if (checkingRef.current) {
      return { hasNewBadges: false, newBadges: [] };
    }

    // Rate limiting: minimum 3 detik antara checks
    const now = Date.now();
    if (now - lastCheckRef.current < 3000) {
      return { hasNewBadges: false, newBadges: [] };
    }

    checkingRef.current = true;
    lastCheckRef.current = now;

    try {
      // Import apiPost dynamically
      const { apiPost } = await import('@/utils/auth');
      
      const data = await apiPost('/badges/check', { userId });
      
      if (data.hasNewBadges && data.newBadges.length > 0) {
        showBadges(data.newBadges);
      }

      return data;
    } catch (error) {
      console.error('❌ Error checking badges:', error);
      return { hasNewBadges: false, newBadges: [] };
    } finally {
      checkingRef.current = false;
    }
  }, [showBadges]);

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