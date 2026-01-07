import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vxrich.babyguard',
  appName: 'BabyGuard',
  webDir: 'dist',
  // NOTE: Do NOT set `server.url` here if you want the native wrapper to
  // load built local files from `dist` (production mode). During development
  // you can set `server.url` to your Vite dev server (e.g. "http://10.0.0.1:5173")
  // to enable live reload, but that makes the wrapper point to a remote URL.
};

export default config;
