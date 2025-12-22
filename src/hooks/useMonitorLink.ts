import { useState, useEffect, useRef } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { ConnectionStatus, PEER_CONFIG } from '../../types';
import { scanFrame } from '../services/ScannerService';
import { requestWakeLock } from '../utils/wakeLock';

export const useMonitorLink = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<MediaConnection | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    let scanStream: MediaStream;
    const startScanning = async () => {
      if (!isScanning) return;
      try {
        scanStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = scanStream;
          videoPreviewRef.current.onloadedmetadata = () => requestAnimationFrame(tick);
        }
      } catch (err) {
        setStatus(ConnectionStatus.ERROR);
      }
    };

    const tick = () => {
      if (!videoPreviewRef.current || !canvasRef.current || !isScanning) return;
      const code = scanFrame(videoPreviewRef.current, canvasRef.current);
      if (code) handleCodeFound(code);
      else animationFrameRef.current = requestAnimationFrame(tick);
    };

    startScanning();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      scanStream?.getTracks().forEach((t) => t.stop());
    };
  }, [isScanning]);

  const handleCodeFound = async (targetPeerId: string) => {
    setIsScanning(false);
    setStatus(ConnectionStatus.CONNECTING);
    requestWakeLock();

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getAudioTracks().forEach((track) => (track.enabled = false));
      setLocalAudioStream(micStream);
    } catch (e) {
      micStream = new MediaStream();
    }

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', () => {
      const call = peer.call(targetPeerId, micStream);
      connRef.current = call;

      call.on('stream', (stream) => {
        setRemoteStream(stream);
        setStatus(ConnectionStatus.CONNECTED);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(console.error);
        }
      });

      call.on('close', () => setStatus(ConnectionStatus.DISCONNECTED));
    });

    peer.on('error', () => setStatus(ConnectionStatus.ERROR));
  };

  const startTalking = () => {
    if (localAudioStream) localAudioStream.getAudioTracks().forEach((t) => (t.enabled = true));
  };

  const stopTalking = () => {
    if (localAudioStream) localAudioStream.getAudioTracks().forEach((t) => (t.enabled = false));
  };

  return {
    status,
    remoteStream,
    isScanning,
    videoPreviewRef,
    remoteVideoRef,
    canvasRef,
    startTalking,
    stopTalking,
    localAudioStream,
  };
};
