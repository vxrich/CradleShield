import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  RotateCcw,
  Monitor,
  Volume2,
  Moon,
  Lock,
} from 'lucide-react';
import { ConnectionStatus } from '../../types';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useCameraLink } from '../hooks/useCameraLink';

interface CameraModeProps {
  onBack: () => void;
}

export const CameraMode: React.FC<CameraModeProps> = ({ onBack }) => {
  const {
    peerId,
    status,
    isMuted,
    isVideoEnabled,
    videoRef,
    incomingAudioRef,
    toggleMute,
    toggleVideo,
  } = useCameraLink();

  const [isEcoMode, setIsEcoMode] = useState(false);
  const restart = () => window.location.reload();

  return (
    <div className="relative flex h-full flex-col bg-black">
      <LoadingOverlay status={status} onRetry={restart} />
      <audio ref={incomingAudioRef} autoPlay />

      {isEcoMode && (
        <div
          className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-black"
          onClick={() => setIsEcoMode(false)}
        >
          <div className="text-dark-800 flex animate-pulse flex-col items-center opacity-20">
            <Lock size={48} className="mb-4" />
            <p className="text-sm">Tap to wake screen</p>
          </div>
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
        />

        {!isVideoEnabled && (
          <div className="bg-dark-800 absolute inset-0 flex flex-col items-center justify-center">
            <Volume2 size={64} className="text-brand-500 mb-4 animate-pulse" />
            <p className="font-medium text-white">Audio Only Mode</p>
          </div>
        )}

        {status === ConnectionStatus.WAITING_FOR_PEER && peerId && (
          <div className="bg-dark-900/95 absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
            <div className="mb-6 rounded-2xl bg-white p-4">
              <QRCodeSVG value={peerId} size={200} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Scan with Monitor</h2>
          </div>
        )}
      </div>

      <div className="bg-dark-900 z-20 rounded-t-3xl p-6 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'animate-pulse bg-green-500' : 'bg-yellow-500'}`}
            />
            <span className="text-sm text-slate-300">
              {status === ConnectionStatus.CONNECTED ? 'Streaming Live' : 'Waiting...'}
            </span>
          </div>
          <button
            onClick={() => setIsEcoMode(true)}
            className="text-brand-500 flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold"
          >
            <Moon size={14} /> Eco Mode
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center gap-2 rounded-xl p-3 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}
          >
            <Mic /> <span className="text-xs">Mic</span>
          </button>
          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center gap-2 rounded-xl p-3 ${!isVideoEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800 text-white'}`}
          >
            {!isVideoEnabled ? <VideoOff /> : <Video />} <span className="text-xs">Video</span>
          </button>
          <button
            onClick={restart}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 p-3 text-white"
          >
            <RotateCcw /> <span className="text-xs">Reset</span>
          </button>
          <button
            onClick={onBack}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 p-3 text-slate-400"
          >
            <Monitor size={20} /> <span className="text-xs">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
