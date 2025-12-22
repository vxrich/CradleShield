import React, { useState } from 'react';
import { ConnectionStatus } from '../types';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanLine, Volume2, VolumeX, ArrowLeft, Moon, Mic, Music2, Eye, EyeOff } from 'lucide-react';
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
    localAudioStream
  } = useMonitorLink();

  const [isMuted, setIsMuted] = useState(false);
  const [dimMode, setDimMode] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  const handleTalkStart = () => { setIsTalking(true); startTalking(); };
  const handleTalkEnd = () => { setIsTalking(false); stopTalking(); };

  return (
    <div className={`h-full flex flex-col relative transition-colors duration-1000 ${dimMode ? 'bg-black' : 'bg-dark-900'}`}>
      {isScanning && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col">
          <div className="relative flex-1">
             <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-60" />
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-64 h-64 border-4 border-brand-500 rounded-2xl relative shadow-lg">
                     <div className="absolute top-0 left-0 w-full h-1 bg-brand-400 animate-pulse" />
                     <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 w-12 h-12" />
                 </div>
             </div>
             <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-8 bg-dark-900 text-center rounded-t-3xl -mt-6 z-20">
              <h2 className="text-2xl font-bold mb-2 text-white">Scan Camera QR</h2>
              <button onClick={onBack} className="text-slate-500 mt-4">Cancel</button>
          </div>
        </div>
      )}

      {!isScanning && (
        <>
            <LoadingOverlay status={status} onRetry={() => window.location.reload()} />
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline muted={isMuted}
                    className={`w-full h-full object-contain transition-all duration-500 ${dimMode ? 'opacity-30' : 'opacity-100'} ${isNightVision ? 'brightness-150 contrast-125 grayscale' : ''}`} 
                />
                <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-dark-800">
                    <Music2 size={64} className="text-slate-600 mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Connecting audio feed...</p>
                </div>
                {dimMode && <div className="absolute inset-0 flex items-center justify-center"><Moon className="text-white/20 w-32 h-32" /></div>}
                {isNightVision && !dimMode && <div className="absolute top-4 right-4 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">Night Vision Active</div>}
            </div>

            <div className={`p-6 ${dimMode ? 'opacity-20' : 'bg-dark-900'}`}>
                <div className="flex justify-center mb-6">
                    <button onMouseDown={handleTalkStart} onMouseUp={handleTalkEnd} onTouchStart={handleTalkStart} onTouchEnd={handleTalkEnd}
                        className={`w-full max-w-xs h-16 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${isTalking ? 'bg-brand-500 text-white scale-95' : 'bg-slate-800 text-slate-300'}`}
                    >
                        {isTalking && <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-500 opacity-20"></span>}
                        <Mic /> {isTalking ? 'Talking...' : 'Hold to Talk'}
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <button onClick={onBack} className="p-4 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center"><ArrowLeft /></button>
                    <button onClick={() => setIsNightVision(!isNightVision)} className={`p-4 rounded-xl flex items-center justify-center transition ${isNightVision ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{isNightVision ? <Eye /> : <EyeOff />}</button>
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-xl flex items-center justify-center transition ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}>{isMuted ? <VolumeX /> : <Volume2 />}</button>
                    <button onClick={() => setDimMode(!dimMode)} className={`p-4 rounded-xl flex items-center justify-center transition ${dimMode ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300'}`}><Moon /></button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};