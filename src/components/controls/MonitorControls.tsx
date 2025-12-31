import { ArrowLeft, Eye, EyeOff, Mic, Moon, Volume2, VolumeX } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../index';
import './controls.css';

interface MonitorControlsProps {
  onBack: () => void;
  isNightVision: boolean;
  onToggleNightVision: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  dimMode: boolean;
  onToggleDimMode: () => void;
  startTalking: () => void;
  stopTalking: () => void;
}

export const MonitorControls: React.FC<MonitorControlsProps> = ({
  onBack,
  isNightVision,
  onToggleNightVision,
  isMuted,
  onToggleMute,
  dimMode,
  onToggleDimMode,
  startTalking,
  stopTalking,
}) => {
  const [isTalking, setIsTalking] = useState(false);

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
      className={`glass3d mx-auto w-full max-w-2xl rounded-t-3xl p-6 pb-8 ${dimMode ? 'opacity-20' : ''}`}
    >
      <Button
        onMouseDown={handleTalkStart}
        onMouseUp={handleTalkEnd}
        onTouchStart={handleTalkStart}
        onTouchEnd={handleTalkEnd}
        className={`mb-2 bg-slate-800/40 p-3 text-white ${isTalking ? '' : ''}`}
        fullWidth
        icon={<Mic />}
      >
        {isTalking ? 'Talking...' : 'Hold to Talk'}
      </Button>
      <div className="grid grid-cols-4 gap-4">
        <Button
          onClick={onBack}
          icon={<ArrowLeft />}
          className="flex-col bg-slate-800/40 p-3 text-white"
        >
          <span className="text-xs">Back</span>
        </Button>
        <Button
          onClick={onToggleNightVision}
          className={`flex-col p-3 ${isNightVision ? 'bg-brand-500 text-white' : 'bg-slate-800/40 text-white'}`}
          icon={isNightVision ? <Eye /> : <EyeOff />}
        >
          <span className="text-xs">Night vision</span>
        </Button>
        <Button
          onClick={onToggleMute}
          className={`flex-col p-3 ${isMuted ? 'bg-brand-500 text-white' : 'bg-slate-800/40 text-white'}`}
          icon={isMuted ? <VolumeX /> : <Volume2 />}
        >
          <span className="text-xs">Mute</span>
        </Button>
        <Button
          onClick={onToggleDimMode}
          className={`flex-col p-3 ${dimMode ? 'bg-brand-500 text-white' : 'bg-slate-800/40 text-white'}`}
          icon={<Moon />}
        >
          <span className="text-xs">Dim mode</span>
        </Button>
      </div>
    </div>
  );
};
