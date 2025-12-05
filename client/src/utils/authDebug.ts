// Auth Debug Utility
// Add this to help debug authentication issues

export const debugAuth = () => {
  // Check localStorage
  const persistRoot = localStorage.getItem('persist:root');
  
  if (persistRoot) {
    try {
      const parsed = JSON.parse(persistRoot);
      const authState = parsed.auth ? JSON.parse(parsed.auth) : null;
      
      console.group('🔐 Auth Debug Info');
      console.log('Auth State:', authState);
      console.log('Has Token:', !!authState?.token);
      console.log('Has Refresh Token:', !!authState?.refreshToken);
      console.log('User:', authState?.user);
      console.log('Is Authenticated:', authState?.isAuthenticated);
      
      if (authState?.token) {
        // Decode JWT to check expiration
        try {
          const tokenParts = authState.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const isExpired = exp < now;
            const timeLeft = Math.floor((exp - now) / 1000 / 60); // minutes
            
            console.log('Token Expiry:', new Date(exp).toLocaleString());
            console.log('Is Expired:', isExpired);
            console.log('Time Left:', isExpired ? 'EXPIRED' : `${timeLeft} minutes`);
          }
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }
      
      console.groupEnd();
      
      return authState;
    } catch (e) {
      console.error('Failed to parse auth state:', e);
    }
  } else {
    console.warn('🔐 No persisted auth state found');
  }
  
  return null;
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
