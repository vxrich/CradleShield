import React, { useState } from 'react';
import { AppMode } from '../types';
import { CameraMode } from './features/CameraMode';
import { MonitorMode } from './features/MonitorMode';
import { Button } from './components';
import { Camera, Monitor, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SELECTION);

  const SelectionScreen = () => (
    <div className="bg-dark-900 animate-in fade-in zoom-in flex min-h-screen flex-col items-center justify-center p-6 duration-500">
      <div className="mb-12 text-center">
        <div className="bg-brand-500/10 text-brand-500 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
          <ShieldCheck size={40} />
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tight text-white">
          Baby<span className="text-brand-500">Guard</span>
        </h1>
        <p className="text-lg text-slate-400">
          Secure, direct P2P connection. <br />
          No servers. No signups.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Button
          fullWidth
          variant="primary"
          onClick={() => setMode(AppMode.CAMERA)}
          icon={<Camera />}
          className="h-24 text-xl"
        >
          Use as Camera
        </Button>

        <Button
          fullWidth
          variant="secondary"
          onClick={() => setMode(AppMode.MONITOR)}
          icon={<Monitor />}
          className="h-24 text-xl"
        >
          Use as Monitor
        </Button>
      </div>

      <p className="mt-12 max-w-xs text-center text-xs text-slate-600">
        Ensure both devices are connected to the internet. <br />
        Works over WiFi and 4G/5G.
      </p>
    </div>
  );

  return (
    <div className="selection:bg-brand-500/30 h-dvh w-full overflow-hidden font-sans text-white antialiased">
      {mode === AppMode.SELECTION && <SelectionScreen />}
      {mode === AppMode.CAMERA && <CameraMode onBack={() => setMode(AppMode.SELECTION)} />}
      {mode === AppMode.MONITOR && <MonitorMode onBack={() => setMode(AppMode.SELECTION)} />}
    </div>
  );
};

export default App;
