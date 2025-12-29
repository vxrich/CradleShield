import React, { useState } from 'react';
import { ArrowLeft, Moon, Mic, Music2, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
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
    <div className={`glass3d ${dimMode ? 'opacity-20' : ''}`}>
      <div className="talk-area">
        <button
          onMouseDown={handleTalkStart}
          onMouseUp={handleTalkEnd}
          onTouchStart={handleTalkStart}
          onTouchEnd={handleTalkEnd}
          className={`talk-button ${isTalking ? 'talk-button--active' : ''}`}
        >
          {isTalking && (
            <span className="bg-brand-500 absolute inset-0 animate-ping rounded-2xl opacity-20"></span>
          )}
          <Mic /> {isTalking ? 'Talking...' : 'Hold to Talk'}
        </button>
      </div>
      <div className="monitor-grid">
        <button onClick={onBack} className="monitor-button monitor-button--default">
          <ArrowLeft />
        </button>
        <button
          onClick={onToggleNightVision}
          className={`monitor-button ${isNightVision ? 'monitor-button--night-active' : 'monitor-button--default'}`}
        >
          {isNightVision ? <Eye /> : <EyeOff />}
        </button>
        <button
          onClick={onToggleMute}
          className={`monitor-button ${isMuted ? 'monitor-button--mute-active' : 'monitor-button--muted-default'}`}
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
        <button
          onClick={onToggleDimMode}
          className={`monitor-button ${dimMode ? 'monitor-button--dim-active' : 'monitor-button--default'}`}
        >
          <Moon />
        </button>
      </div>
    </div>
  );
};
