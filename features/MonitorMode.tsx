import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { ConnectionStatus, PEER_CONFIG } from '../types';
import { scanFrame } from '../services/ScannerService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanLine, Volume2, VolumeX, ArrowLeft, Moon, Mic, Music2, Eye, EyeOff } from 'lucide-react';
import { requestWakeLock } from '../utils/wakeLock';

interface MonitorModeProps {
  onBack: () => void;
}

export const MonitorMode: React.FC<MonitorModeProps> = ({ onBack }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [dimMode, setDimMode] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  // References
  const videoPreviewRef = useRef<HTMLVideoElement>(null); // For scanning
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // For viewing baby
  const canvasRef = useRef<HTMLCanvasElement>(null); // For QR processing
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<MediaConnection | null>(null);
  const animationFrameRef = useRef<number>(0);

  // 1. Setup Scanning Logic
  useEffect(() => {
    let scanStream: MediaStream;

    const startScanning = async () => {
      if (!isScanning) return;
      
      try {
        scanStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = scanStream;
          // Wait for video to be ready before scanning frames
          videoPreviewRef.current.onloadedmetadata = () => {
            requestAnimationFrame(tick);
          };
        }
      } catch (err) {
        console.error("Scanner init failed", err);
        setStatus(ConnectionStatus.ERROR);
      }
    };

    const tick = () => {
      if (!videoPreviewRef.current || !canvasRef.current || !isScanning) return;

      const code = scanFrame(videoPreviewRef.current, canvasRef.current);
      if (code) {
        console.log("QR Found:", code);
        handleCodeFound(code);
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isScanning) {
      startScanning();
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      scanStream?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  // 2. Connect to Peer
  const handleCodeFound = async (targetPeerId: string) => {
    setIsScanning(false);
    setStatus(ConnectionStatus.CONNECTING);
    requestWakeLock();

    // Init local audio (microphone) for talk-back feature
    // We get the stream now, but keep track disabled (muted) until button press
    let micStream: MediaStream;
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getAudioTracks().forEach(track => track.enabled = false); // Start muted
        setLocalAudioStream(micStream);
    } catch (e) {
        console.warn("Microphone access denied or not available. Talk back will be disabled.", e);
        micStream = new MediaStream(); // Fallback empty stream
    }

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', () => {
      console.log("Monitor Peer Open. Connecting to:", targetPeerId);
      // We pass our mic stream (muted) so the channel is open
      const call = peer.call(targetPeerId, micStream); 
      connRef.current = call;

      call.on('stream', (stream) => {
        console.log("Received Remote Stream");
        setRemoteStream(stream);
        setStatus(ConnectionStatus.CONNECTED);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            // Ensure audio plays (browsers often block auto-audio)
            remoteVideoRef.current.play().catch(e => console.error("Auto-play blocked", e));
        }
      });

      call.on('close', () => {
        setStatus(ConnectionStatus.DISCONNECTED);
      });

      call.on('error', (err) => {
        console.error("Call error", err);
        setStatus(ConnectionStatus.ERROR);
      });
    });

    peer.on('error', (err) => {
      console.error("Peer error", err);
      setStatus(ConnectionStatus.ERROR);
    });
  };

  const handleRetry = () => {
      window.location.reload();
  };

  const startTalking = () => {
      if (localAudioStream) {
          localAudioStream.getAudioTracks().forEach(t => t.enabled = true);
          setIsTalking(true);
      }
  };

  const stopTalking = () => {
      if (localAudioStream) {
          localAudioStream.getAudioTracks().forEach(t => t.enabled = false);
          setIsTalking(false);
      }
  };

  return (
    <div className={`h-full flex flex-col relative transition-colors duration-1000 ${dimMode ? 'bg-black' : 'bg-dark-900'}`}>
      
      {/* 1. Scanner View */}
      {isScanning && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col">
          <div className="relative flex-1">
             <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-60" />
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-64 h-64 border-4 border-brand-500 rounded-2xl relative shadow-[0_0_100px_rgba(14,165,233,0.3)]">
                     <div className="absolute top-0 left-0 w-full h-1 bg-brand-400 animate-[pulse_2s_infinite]" />
                     <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 w-12 h-12 animate-bounce" />
                 </div>
             </div>
             {/* Hidden canvas for processing */}
             <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-8 bg-dark-900 text-center rounded-t-3xl -mt-6 relative z-20">
              <h2 className="text-2xl font-bold mb-2">Scan Camera QR</h2>
              <p className="text-slate-400 mb-6">Point this device at the code shown on the Baby Camera device.</p>
              <button onClick={onBack} className="text-slate-500 font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* 2. Monitor View */}
      {!isScanning && (
        <>
            <LoadingOverlay status={status} onRetry={handleRetry} />
            
            {/* Main Video Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    muted={isMuted}
                    className={`
                        w-full h-full object-contain transition-all duration-500 
                        ${dimMode ? 'opacity-30' : 'opacity-100'}
                        ${isNightVision ? 'brightness-150 contrast-125 grayscale' : ''}
                    `} 
                />
                
                {/* Fallback visual for Audio Only mode (when camera disables video) */}
                <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-dark-800">
                    <Music2 size={64} className="text-slate-600 mb-4" />
                    <p className="text-slate-500">Audio Stream Active</p>
                </div>

                {/* Night Mode Overlay */}
                {dimMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Moon className="text-white/20 w-32 h-32" />
                    </div>
                )}
                
                {/* Night Vision Indicator */}
                {isNightVision && !dimMode && (
                    <div className="absolute top-4 right-4 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 flex items-center gap-2">
                        <Eye size={12} />
                        Night Vision
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={`p-6 transition-opacity duration-500 ${dimMode ? 'opacity-20 hover:opacity-100' : 'opacity-100 bg-dark-900'}`}>
                
                {/* Talk Button - Prominent */}
                <div className="flex justify-center mb-6">
                    <button 
                        onMouseDown={startTalking}
                        onMouseUp={stopTalking}
                        onTouchStart={startTalking}
                        onTouchEnd={stopTalking}
                        disabled={!localAudioStream}
                        className={`
                            relative w-full max-w-xs h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                            ${isTalking 
                                ? 'bg-brand-500 text-white scale-95 shadow-inner' 
                                : 'bg-slate-800 text-slate-300 shadow-lg shadow-black/20 hover:bg-slate-700'
                            }
                            ${!localAudioStream ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                    >
                        {isTalking && (
                            <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-500 opacity-20"></span>
                        )}
                        <Mic className={isTalking ? 'animate-pulse' : ''} />
                        {isTalking ? 'Talking...' : 'Hold to Talk'}
                    </button>
                </div>

                {/* Bottom Row Controls */}
                <div className="grid grid-cols-4 gap-3">
                    <button 
                        onClick={onBack} 
                        className="p-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <button 
                        onClick={() => setIsNightVision(!isNightVision)}
                        className={`p-4 rounded-xl flex items-center justify-center transition ${isNightVision ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                        {isNightVision ? <Eye size={24} /> : <EyeOff size={24} />}
                    </button>

                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className={`p-4 rounded-xl flex items-center justify-center transition ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>

                    <button 
                        onClick={() => setDimMode(!dimMode)} 
                        className={`p-4 rounded-xl transition flex items-center justify-center ${dimMode ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                        <Moon size={24} />
                    </button>
                </div>

                {!dimMode && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">
                           {status === ConnectionStatus.CONNECTED ? 'Encrypted Connection Active' : 'Connecting...'}
                        </p>
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};