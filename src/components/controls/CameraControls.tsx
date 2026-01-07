import { ArrowLeft, Mic, MicOff, Moon, Video, VideoOff } from 'lucide-react';
import React from 'react';
import { ConnectionStatus } from '../../../types';
import { Button } from '../index';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
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
  const { isLandscape } = useDeviceOrientation();

  return (
    <div className={`glass3d ${isLandscape ? 'controls-vertical' : ''}`}>
      <div
        className={`controls-header flex items-center justify-between ${isLandscape ? '' : 'mb-6'}`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'animate-pulse bg-green-500' : 'bg-yellow-500'}`}
          />
          <span className="text-sm text-slate-300">
            {status === ConnectionStatus.CONNECTED ? 'Streaming Live' : 'Waiting...'}
          </span>
        </div>
      </div>

      <div className={`controls-grid ${isLandscape ? '' : 'grid grid-cols-4 gap-4'}`}>
        <Button
          onClick={onBack}
          className="flex-col bg-slate-800/40 p-3 text-slate-400"
          fullWidth={isLandscape}
          icon={<ArrowLeft />}
        >
          <span className="text-xs">Back</span>
        </Button>
        <Button
          onClick={onToggleMute}
          className={`flex-col p-3 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800/40 text-white'}`}
          fullWidth={isLandscape}
          icon={isMuted ? <MicOff /> : <Mic />}
        >
          <span className="text-xs">Mic</span>
        </Button>
        <Button
          onClick={onToggleVideo}
          className={`flex-col p-3 ${!isVideoEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800/40 text-white'}`}
          fullWidth={isLandscape}
          icon={!isVideoEnabled ? <VideoOff /> : <Video />}
        >
          <span className="text-xs">Video</span>
        </Button>
        <Button
          onClick={onEcoModeToggle}
          className="text-brand-500 flex-col bg-slate-800/40 px-3 py-1.5 text-xs font-bold"
          fullWidth={isLandscape}
          icon={<Moon />}
        >
          Eco Mode
        </Button>
      </div>
    </div>
  );
};
