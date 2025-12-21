export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      // @ts-ignore - Types might not be fully updated for wakeLock in all envs
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock active');
      return wakeLock;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      return null;
    }
  }
  return null;
};