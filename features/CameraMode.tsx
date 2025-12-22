import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, Monitor, Volume2, Moon, Lock } from 'lucide-react';
import { ConnectionStatus } from '../types';
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
    toggleVideo
  } = useCameraLink();

  const [isEcoMode, setIsEcoMode] = useState(false);
  const restart = () => window.location.reload();

  return (
    <div className="h-full flex flex-col bg-black relative">
      <LoadingOverlay status={status} onRetry={restart} />
      <audio ref={incomingAudioRef} autoPlay />

      {isEcoMode && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsEcoMode(false)}>
          <div className="text-dark-800 flex flex-col items-center animate-pulse opacity-20">
            <Lock size={48} className="mb-4" />
            <p className="text-sm">Tap to wake screen</p>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`} />
        
        {!isVideoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800">
                <Volume2 size={64} className="text-brand-500 mb-4 animate-pulse" />
                <p className="text-white font-medium">Audio Only Mode</p>
            </div>
        )}

        {status === ConnectionStatus.WAITING_FOR_PEER && peerId && (
          <div className="absolute inset-0 bg-dark-900/95 flex flex-col items-center justify-center p-8 z-10">
            <div className="bg-white p-4 rounded-2xl mb-6"><QRCodeSVG value={peerId} size={200} /></div>
            <h2 className="text-2xl font-bold mb-2">Scan with Monitor</h2>
          </div>
        )}
      </div>

      <div className="bg-dark-900 p-6 pb-8 rounded-t-3xl z-20">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-sm text-slate-300">{status === ConnectionStatus.CONNECTED ? 'Streaming Live' : 'Waiting...'}</span>
            </div>
            <button onClick={() => setIsEcoMode(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-brand-500 text-xs font-bold"><Moon size={14} /> Eco Mode</button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button onClick={toggleMute} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}><Mic /> <span className="text-xs">Mic</span></button>
          <button onClick={toggleVideo} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${!isVideoEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800 text-white'}`}>{!isVideoEnabled ? <VideoOff /> : <Video />} <span className="text-xs">Video</span></button>
          <button onClick={restart} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 text-white"><RotateCcw /> <span className="text-xs">Reset</span></button>
          <button onClick={onBack} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 text-slate-400"><Monitor size={20} /> <span className="text-xs">Back</span></button>
        </div>
      </div>
    </div>
  );
};