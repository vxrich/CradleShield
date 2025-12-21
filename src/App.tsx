import { Camera, Monitor, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./components/Button";
import { CameraMode } from "./features/CameraMode";
import { MonitorMode } from "./features/MonitorMode";
import { AppMode } from "./types";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SELECTION);

  const SelectionScreen = () => (
    <div className="min-h-screen bg-dark-900 p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-500">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          Baby<span className="text-brand-500">Guard</span>
        </h1>
        <p className="text-slate-400 text-lg">
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

      <p className="mt-12 text-xs text-slate-600 text-center max-w-xs">
        Ensure both devices are connected to the internet. <br />
        Works over WiFi and 4G/5G.
      </p>
    </div>
  );

  console.log("MODE ==>", mode)

  return (
    <div className="h-[100dvh] w-full overflow-hidden text-white font-sans antialiased selection:bg-brand-500/30">
      {mode === AppMode.SELECTION && <SelectionScreen />}
      {mode === AppMode.CAMERA && (
        <CameraMode onBack={() => setMode(AppMode.SELECTION)} />
      )}
      {mode === AppMode.MONITOR && (
        <MonitorMode onBack={() => setMode(AppMode.SELECTION)} />
      )}
    </div>
  );
};

export default App;
