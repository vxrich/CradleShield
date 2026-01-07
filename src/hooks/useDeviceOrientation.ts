import { useEffect, useState } from 'react';

type Orientation = 'portrait' | 'landscape';

const getOrientation = (): Orientation => {
  if (typeof window === 'undefined') {
    return 'portrait';
  }

  const screenOrientation = window.screen?.orientation?.type;
  if (screenOrientation) {
    return screenOrientation.startsWith('landscape') ? 'landscape' : 'portrait';
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
};

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(() => getOrientation());

  useEffect(() => {
    const handleChange = () => setOrientation(getOrientation());

    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
  };
};
