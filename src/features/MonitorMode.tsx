import React, { useState } from 'react';
import { ConnectionStatus } from '../../types';
import { LoadingOverlay } from '../components/LoadingOverlay';
import {
  ScanLine,
  Volume2,
  VolumeX,
  ArrowLeft,
  Moon,
  Mic,
  Music2,
  Eye,
  EyeOff,
} from 'lucide-react';
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
  const [isTalking, setIsTalking] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  const handleTalkStart = () => {
    setIsTalking(true);
    startTalking();
  };
  const handleTalkEnd = () => {
    setIsTalking(false);
    stopTalking();
  };

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
          <div className="bg-dark-900 z-20 -mt-6 rounded-t-3xl p-8 text-center">
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

          <div className={`p-6 ${dimMode ? 'opacity-20' : 'bg-dark-900'}`}>
            <div className="mb-6 flex justify-center">
              <button
                onMouseDown={handleTalkStart}
                onMouseUp={handleTalkEnd}
                onTouchStart={handleTalkStart}
                onTouchEnd={handleTalkEnd}
                className={`flex h-16 w-full max-w-xs items-center justify-center gap-3 rounded-2xl font-bold transition-all ${isTalking ? 'bg-brand-500 scale-95 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                {isTalking && (
                  <span className="bg-brand-500 absolute inset-0 animate-ping rounded-2xl opacity-20"></span>
                )}
                <Mic /> {isTalking ? 'Talking...' : 'Hold to Talk'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center rounded-xl bg-slate-800 p-4 text-slate-300"
              >
                <ArrowLeft />
              </button>
              <button
                onClick={() => setIsNightVision(!isNightVision)}
                className={`flex items-center justify-center rounded-xl p-4 transition ${isNightVision ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                {isNightVision ? <Eye /> : <EyeOff />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center justify-center rounded-xl p-4 transition ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </button>
              <button
                onClick={() => setDimMode(!dimMode)}
                className={`flex items-center justify-center rounded-xl p-4 transition ${dimMode ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                <Moon />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
