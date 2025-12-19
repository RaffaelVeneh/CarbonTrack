// Utility to check if user is banned before rendering page content
// Use this in all protected pages for additional security

export const checkBannedStatus = () => {
  if (typeof window === 'undefined') return false;

  // Skip banned check for admin routes (admin has separate session)
  if (window.location.pathname.startsWith('/admin')) return false;

  const userData = localStorage.getItem('userData') || localStorage.getItem('user');
  if (!userData) return false;

  try {
    const user = JSON.parse(userData);
    // If status is banned in cached data, immediately redirect
    if (user.status === 'banned') {
      window.location.href = '/banned';
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking banned status:', error);
    return false;
  }
};

// HOC to protect pages from banned users
export const withBannedCheck = (WrappedComponent) => {
  return function BannedCheckWrapper(props) {
    if (typeof window !== 'undefined') {
      const isBanned = checkBannedStatus();
      if (isBanned) {
        return null; // Will redirect, don't render anything
      }
    }
    return <WrappedComponent {...props} />;
  };
};
