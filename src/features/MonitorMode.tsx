import React, { useEffect, useRef, useState } from 'react';
import { ConnectionStatus } from '../types';
import { useP2PConnection } from '../hooks/useP2PConnection';
import { scanFrame } from '../services/ScannerService';
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
import { requestWakeLock } from '../utils/wakeLock';

interface MonitorModeProps {
  onBack: () => void;
}

export const MonitorMode: React.FC<MonitorModeProps> = ({ onBack }) => {
  const {
    status,
    remoteStream,
    initLocalMedia,
    initLocalAudio,
    localAudioStream,
    callPeer,
    startTalking,
    stopTalking,
    setStatus,
  } = useP2PConnection();
  const [isScanning, setIsScanning] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [dimMode, setDimMode] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);

  // References
  const videoPreviewRef = useRef<HTMLVideoElement>(null); // For scanning
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // For viewing baby
  const incomingAudioRef = useRef<HTMLAudioElement>(null); // For talk-back audio playback
  const canvasRef = useRef<HTMLCanvasElement>(null); // For QR processing
  const animationFrameRef = useRef<number>(0);
  const [remoteHasVideo, setRemoteHasVideo] = useState<boolean | null>(null);

  // 1. Setup Scanning Logic
  useEffect(() => {
    let scanStream: MediaStream | null = null;

    const startScanning = async () => {
      if (!isScanning) return;

      try {
        // Use the hook to acquire local video for scanning so media handling is centralized
        scanStream = await initLocalMedia({ video: { facingMode: 'environment' } });

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = scanStream;
          // Wait for video to be ready before scanning frames
          videoPreviewRef.current.onloadedmetadata = () => {
            requestAnimationFrame(tick);
          };
        }
      } catch (err) {
        console.error('Scanner init failed', err);
        setStatus(ConnectionStatus.ERROR);
      }
    };

    const tick = () => {
      if (!videoPreviewRef.current || !canvasRef.current || !isScanning) return;

      const code = scanFrame(videoPreviewRef.current, canvasRef.current);
      if (code) {
        console.log('QR Found:', code);
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
      // If we started a dedicated scan stream, stop its tracks when scanning stops
      scanStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  // 2. Connect to Peer
  const handleCodeFound = async (targetPeerId: string) => {
    setIsScanning(false);
    setStatus(ConnectionStatus.CONNECTING);
    requestWakeLock();

    // Init local audio (microphone) for talk-back feature using the hook
    // We get the stream now, but keep tracks disabled (muted) until button press
    let micStream: MediaStream;
    try {
      micStream = await initLocalAudio();
    } catch (e) {
      console.warn('Microphone access denied or not available. Talk back will be disabled.', e);
      micStream = new MediaStream(); // Fallback empty stream
    }

    // Ask the hook to create a call to the camera (pass micStream to avoid races)
    setStatus(ConnectionStatus.CONNECTING);
    callPeer(targetPeerId, micStream);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Proxy talk controls to the hook and keep local UI state for toggles
  const onStartTalking = () => {
    startTalking();
    setIsTalking(true);
  };

  const onStopTalking = () => {
    stopTalking();
    setIsTalking(false);
  };

  console.log('remote video ref ==>', remoteVideoRef);

  // Attach remote stream to the preview element and a hidden audio element when it becomes available
  useEffect(() => {
    if (!remoteStream) {
      setRemoteHasVideo(null);
      return;
    }

    const hasVideo = remoteStream.getVideoTracks().length > 0;
    setRemoteHasVideo(hasVideo);

    // Attach to video element (mute the video element to satisfy autoplay policies)
    if (remoteVideoRef.current) {
      try {
        remoteVideoRef.current.muted = true; // ensures autoplay is allowed
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((e) => console.warn('Video play blocked', e));
      } catch (e) {
        console.error('Failed to attach remote stream to video', e);
      }
    }

    // Attach audio to a separate element so we can control audio muting independently
    if (incomingAudioRef.current) {
      try {
        incomingAudioRef.current.srcObject = remoteStream;
        incomingAudioRef.current.muted = isMuted;
        incomingAudioRef.current.play().catch((e) => console.warn('Audio play blocked', e));
      } catch (e) {
        console.error('Failed to attach remote stream to audio', e);
      }
    }

    // Log tracks to help debug black screen issues
    console.log(
      'Remote stream tracks:',
      remoteStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled }))
    );

    // If we expect video but video element reports no frames after a short delay, try re-attaching the srcObject
    if (hasVideo && remoteVideoRef.current) {
      const checkTimer = setTimeout(() => {
        const videoEl = remoteVideoRef.current!;
        const hasFrames =
          videoEl &&
          (videoEl as HTMLVideoElement).videoWidth > 0 &&
          (videoEl as HTMLVideoElement).videoHeight > 0;
        if (!hasFrames) {
          console.warn('No video frames detected, attempting to reattach remote stream');
          try {
            videoEl.srcObject = null;
            setTimeout(() => {
              videoEl.srcObject = remoteStream;
              videoEl.play().catch((e) => console.warn('Re-play blocked', e));
            }, 150);
          } catch (e) {
            console.error('Reattach failed', e);
          }
        }
      }, 700);

      return () => clearTimeout(checkTimer);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStream, isMuted]);

  // Sync mute toggle with the audio element
  useEffect(() => {
    if (incomingAudioRef.current) incomingAudioRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      className={`relative flex h-full flex-col transition-colors duration-1000 ${dimMode ? 'bg-black' : 'bg-dark-900'}`}
    >
      {/* 1. Scanner View or Monitor mode*/}
      {isScanning ? (
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
              <div className="border-brand-500 relative h-64 w-64 rounded-2xl border-4 shadow-[0_0_100px_rgba(14,165,233,0.3)]">
                <div className="bg-brand-400 absolute top-0 left-0 h-1 w-full animate-[pulse_2s_infinite]" />
                <ScanLine className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-bounce text-white/50" />
              </div>
            </div>
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="bg-dark-900 relative z-20 -mt-6 rounded-t-3xl p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">Scan Camera QR</h2>
            <p className="mb-6 text-slate-400">
              Point this device at the code shown on the Baby Camera device.
            </p>
            <button onClick={onBack} className="font-medium text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <LoadingOverlay status={status} onRetry={handleRetry} />

          {/* Main Video Area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={
                true
              } /* keep video muted so autoplay is allowed; audio is handled by a separate element */
              className={`h-full w-full object-contain transition-all duration-500 ${dimMode ? 'opacity-30' : 'opacity-100'} ${isNightVision ? 'brightness-150 contrast-125 grayscale' : ''} `}
            />

            {/* Hidden audio element to control talk-back playback */}
            <audio ref={incomingAudioRef} autoPlay className="hidden" />

            {/* Fallback visual for Audio Only mode (when camera disables video) */}
            {remoteHasVideo === false && (
              <div className="bg-dark-800 absolute inset-0 -z-10 flex flex-col items-center justify-center">
                <Music2 size={64} className="mb-4 text-slate-600" />
                <p className="text-slate-500">Audio Only Mode — no video track</p>
              </div>
            )}

            {remoteHasVideo === true && (
              <div className="absolute top-4 left-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-slate-200">
                Video Stream Active
              </div>
            )}

            {/* Night Mode Overlay */}
            {dimMode && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Moon className="h-32 w-32 text-white/20" />
              </div>
            )}

            {/* Night Vision Indicator */}
            {isNightVision && !dimMode && (
              <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold text-green-500">
                <Eye size={12} />
                Night Vision
              </div>
            )}
          </div>

          {/* Controls */}
          <div
            className={`p-6 transition-opacity duration-500 ${dimMode ? 'opacity-20 hover:opacity-100' : 'bg-dark-900 opacity-100'}`}
          >
            {/* Talk Button - Prominent */}
            <div className="mb-6 flex justify-center">
              <button
                onMouseDown={onStartTalking}
                onMouseUp={onStopTalking}
                onTouchStart={onStartTalking}
                onTouchEnd={onStopTalking}
                disabled={!localAudioStream}
                className={`relative flex h-16 w-full max-w-xs items-center justify-center gap-3 rounded-2xl text-lg font-bold transition-all ${
                  isTalking
                    ? 'bg-brand-500 scale-95 text-white shadow-inner'
                    : 'bg-slate-800 text-slate-300 shadow-lg shadow-black/20 hover:bg-slate-700'
                } ${!localAudioStream ? 'cursor-not-allowed opacity-50' : 'active:scale-95'} `}
              >
                {isTalking && (
                  <span className="bg-brand-500 absolute inset-0 animate-ping rounded-2xl opacity-20"></span>
                )}
                <Mic className={isTalking ? 'animate-pulse' : ''} />
                {isTalking ? 'Talking...' : 'Hold to Talk'}
              </button>
            </div>

            {/* Bottom Row Controls */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center rounded-xl bg-slate-800 p-4 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft size={24} />
              </button>

              <button
                onClick={() => setIsNightVision(!isNightVision)}
                className={`flex items-center justify-center rounded-xl p-4 transition ${isNightVision ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                {isNightVision ? <Eye size={24} /> : <EyeOff size={24} />}
              </button>

              <button
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  // user gesture — ensure audio playback if unmuting
                  try {
                    if (incomingAudioRef.current) {
                      incomingAudioRef.current.muted = next;
                      if (!next) incomingAudioRef.current.play().catch(() => {});
                    }
                  } catch (e) {
                    console.warn('Unable to toggle audio element', e);
                  }
                }}
                className={`flex items-center justify-center rounded-xl p-4 transition ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-white'}`}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <button
                onClick={() => setDimMode(!dimMode)}
                className={`flex items-center justify-center rounded-xl p-4 transition ${dimMode ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                <Moon size={24} />
              </button>
            </div>

            {!dimMode && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  {status === ConnectionStatus.CONNECTED
                    ? 'Encrypted Connection Active'
                    : 'Connecting...'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
