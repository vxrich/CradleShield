import React from 'react';
import { ConnectionStatus } from '../../../types';
import { Moon, Mic, Video, VideoOff, RotateCcw, Monitor } from 'lucide-react';
import './controls.css';

interface CameraControlsProps {
  status: ConnectionStatus;
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onRestart: () => void;
  onBack: () => void;
  onEcoModeToggle: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  status,
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onRestart,
  onBack,
  onEcoModeToggle,
}) => {
  return (
    <div className="glass3d mx-auto w-full max-w-2xl rounded-t-3xl p-6 pb-8">
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
          onClick={onEcoModeToggle}
          className="text-brand-500 flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-1.5 text-xs font-bold"
        >
          <Moon size={14} /> Eco Mode
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={onToggleMute}
          className={`flex flex-col items-center gap-2 rounded-xl p-3 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800/40 text-white'}`}
        >
          <Mic /> <span className="text-xs">Mic</span>
        </button>
        <button
          onClick={onToggleVideo}
          className={`flex flex-col items-center gap-2 rounded-xl p-3 ${!isVideoEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800/40 text-white'}`}
        >
          {!isVideoEnabled ? <VideoOff /> : <Video />} <span className="text-xs">Video</span>
        </button>
        <button
          onClick={onRestart}
          className="flex flex-col items-center gap-2 rounded-xl bg-slate-800/40 p-3 text-white"
        >
          <RotateCcw /> <span className="text-xs">Reset</span>
        </button>
        <button
          onClick={onBack}
          className="flex flex-col items-center gap-2 rounded-xl bg-slate-800/40 p-3 text-slate-400"
        >
          <Monitor size={20} /> <span className="text-xs">Back</span>
        </button>
      </div>
    </div>
  );
};
