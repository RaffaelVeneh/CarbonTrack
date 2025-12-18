// Helper function untuk mendapatkan user data dari localStorage
// Support both new JWT system (userData) and legacy system (user)
// Untuk data non-sensitif seperti username, email, island_health

export const getUserFromStorage = () => {
  if (typeof window === 'undefined') return null;
  
  // Try new JWT system first
  const newUserData = localStorage.getItem('userData');
  if (newUserData) {
    try {
      return JSON.parse(newUserData);
    } catch (error) {
      console.error('Invalid userData in localStorage:', error);
    }
  }
  
  // Fallback to legacy system
  const legacyUser = localStorage.getItem('user');
  if (legacyUser) {
    try {
      return JSON.parse(legacyUser);
    } catch (error) {
      console.error('Invalid user in localStorage:', error);
    }
  }
  
  return null;
};

// Update user data in localStorage (support both systems for now)
export const updateUserInStorage = (userData) => {
  if (typeof window === 'undefined') return;
  
  const userStr = JSON.stringify(userData);
  
  // Update both keys for backward compatibility
  localStorage.setItem('userData', userStr);
  localStorage.setItem('user', userStr);
};
