import { Moon, Music2, ScanLine } from 'lucide-react';
import React, { useState } from 'react';
import { LoadingOverlay, MonitorControls } from '../components';
import { useMonitorLink } from '../hooks/useMonitorLink';

interface MonitorModeProps {
  onBack: () => void;
}

export const MonitorMode: React.FC<MonitorModeProps> = ({ onBack }) => {
  const {
    status,
    isScanning,
    videoPreviewRef,
    remoteVideoRef,
    canvasRef,
    startTalking,
    stopTalking,
    localAudioStream,
  } = useMonitorLink();

  const [isMuted, setIsMuted] = useState(false);
  const [dimMode, setDimMode] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  return (
    <div
      className={`relative flex h-full flex-col transition-colors duration-1000 ${dimMode ? 'bg-black' : 'bg-dark-900'}`}
    >
      {isScanning && (
        <div className="absolute inset-0 z-10 flex flex-col bg-black">
          <div className="relative flex-1">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-brand-500 relative h-64 w-64 rounded-2xl border-4 shadow-lg">
                <div className="bg-brand-400 absolute top-0 left-0 h-1 w-full animate-pulse" />
                <ScanLine className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/50" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="glass3d mx-auto p-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">Scan Camera QR</h2>
            <button onClick={onBack} className="mt-4 text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isScanning && (
        <>
          <LoadingOverlay status={status} onRetry={() => window.location.reload()} />
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className={`h-full w-full object-contain transition-all duration-500 ${dimMode ? 'opacity-30' : 'opacity-100'} ${isNightVision ? 'brightness-150 contrast-125 grayscale' : ''}`}
            />
            <div className="bg-dark-800 absolute inset-0 -z-10 flex flex-col items-center justify-center">
              <Music2 size={64} className="mb-4 text-slate-600" />
              <p className="text-sm font-medium text-slate-500">Connecting audio feed...</p>
            </div>
            {dimMode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon className="h-32 w-32 text-white/20" />
              </div>
            )}
            {isNightVision && !dimMode && (
              <div className="absolute top-4 right-4 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold text-green-500">
                Night Vision Active
              </div>
            )}
          </div>

          <MonitorControls
            onBack={onBack}
            isNightVision={isNightVision}
            onToggleNightVision={() => setIsNightVision(!isNightVision)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            dimMode={dimMode}
            onToggleDimMode={() => setDimMode(!dimMode)}
            startTalking={startTalking}
            stopTalking={stopTalking}
          />
        </>
      )}
    </div>
  );
};
