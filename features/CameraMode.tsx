import React, { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { Mic, MicOff, Video, VideoOff, RotateCcw, Monitor, Volume2, Moon, Lock } from 'lucide-react';
import { ConnectionStatus, PEER_CONFIG } from '../types';
import { Button } from '../components/Button';
import { requestWakeLock } from '../utils/wakeLock';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface CameraModeProps {
  onBack: () => void;
}

export const CameraMode: React.FC<CameraModeProps> = ({ onBack }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.INITIALIZING);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isEcoMode, setIsEcoMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const incomingAudioRef = useRef<HTMLAudioElement>(null); // For parent's voice
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<MediaConnection | null>(null);

  // Initialize Media and Peer
  useEffect(() => {
    let localStream: MediaStream;
    let wakeLock: WakeLockSentinel | null = null;

    const init = async () => {
      try {
        // 1. Get User Media
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        // 2. Request Wake Lock
        wakeLock = await requestWakeLock();

        // 3. Initialize Peer
        const peer = new Peer(PEER_CONFIG);
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log('My Peer ID:', id);
          setPeerId(id);
          setStatus(ConnectionStatus.WAITING_FOR_PEER);
        });

        peer.on('call', (call) => {
          console.log('Incoming call...');
          setStatus(ConnectionStatus.CONNECTING);
          
          // Answer the call with our A/V stream
          call.answer(localStream);
          connectionRef.current = call;

          // Receive audio from Monitor (Talk Back feature)
          call.on('stream', (remoteStream) => {
             console.log("Receiving audio from monitor");
             if (incomingAudioRef.current) {
               incomingAudioRef.current.srcObject = remoteStream;
               incomingAudioRef.current.play().catch(e => console.error("Audio play failed", e));
             }
          });

          call.on('close', () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            connectionRef.current = null;
          });

          // Wait a moment to confirm stability
          setTimeout(() => setStatus(ConnectionStatus.CONNECTED), 1000);
        });

        peer.on('error', (err) => {
          console.error(err);
          setStatus(ConnectionStatus.ERROR);
        });

        peer.on('disconnected', () => {
           if (status !== ConnectionStatus.CONNECTED) {
               setStatus(ConnectionStatus.DISCONNECTED);
           }
        });

      } catch (err) {
        console.error("Failed to init camera mode", err);
        setStatus(ConnectionStatus.ERROR);
      }
    };

    init();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
      wakeLock?.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      // We toggle the track enabled state instead of stopping it to keep connection alive
      stream.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const restart = () => {
      window.location.reload();
  };

  return (
    <div className="h-full flex flex-col bg-black relative">
      <LoadingOverlay status={status} onRetry={restart} />
      
      {/* Hidden Audio Element for Talk Back */}
      <audio ref={incomingAudioRef} autoPlay />

      {/* ECO MODE OVERLAY (Simulate Screen Off) */}
      {isEcoMode && (
        <div 
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer touch-manipulation"
          onClick={() => setIsEcoMode(false)}
        >
          <div className="text-dark-800 flex flex-col items-center animate-pulse">
            <Lock size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium opacity-20 select-none">Tap to wake screen</p>
            <p className="text-xs mt-8 opacity-10 select-none">Monitoring Active</p>
          </div>
        </div>
      )}

      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          muted // Always mute local preview to prevent feedback
          playsInline 
          className={`w-full h-full object-cover transition-opacity ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Privacy/Audio Only overlay */}
        {!isVideoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800 text-slate-500 animate-in fade-in duration-300">
                <Volume2 size={64} className="text-brand-500 mb-4 animate-pulse" />
                <p className="text-white font-medium">Audio Only Mode</p>
                <p className="text-sm text-slate-400">Streaming audio to monitor...</p>
            </div>
        )}

        {/* QR Code Overlay - Only show when waiting */}
        {status === ConnectionStatus.WAITING_FOR_PEER && peerId && (
          <div className="absolute inset-0 bg-dark-900/95 flex flex-col items-center justify-center p-8 z-10">
            <div className="bg-white p-4 rounded-2xl shadow-2xl mb-6">
              <QRCodeSVG value={peerId} size={200} level="L" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Scan with Monitor</h2>
            <p className="text-slate-400 text-center text-sm">
              Point the other device at this code to pair safely.
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-dark-900 p-6 pb-8 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-sm font-medium text-slate-300">
                    {status === ConnectionStatus.CONNECTED ? 'Live Streaming' : 'Ready to Pair'}
                </span>
            </div>
            <button 
              onClick={() => setIsEcoMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-500 text-xs font-bold transition-colors"
            >
              <Moon size={14} />
              <span>Eco Mode</span>
            </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button 
            onClick={toggleMute}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}
          >
            {isMuted ? <MicOff /> : <Mic />}
            <span className="text-xs">Mic</span>
          </button>

          <button 
            onClick={toggleVideo}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition ${!isVideoEnabled ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            {!isVideoEnabled ? <VideoOff /> : <Video />}
            <span className="text-xs">{!isVideoEnabled ? 'Audio Only' : 'Video On'}</span>
          </button>

           <button 
            onClick={restart}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 text-white active:bg-slate-700"
          >
            <RotateCcw />
            <span className="text-xs">Reset</span>
          </button>
           
           <button 
            onClick={onBack}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800 text-slate-400 active:bg-slate-700"
          >
            <Monitor size={20} />
            <span className="text-xs">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};