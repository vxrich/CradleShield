import { useState, useEffect, useRef } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { ConnectionStatus, PEER_CONFIG } from '../../types';
import { requestWakeLock } from '../utils/wakeLock';

export const useCameraLink = () => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.INITIALIZING);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const incomingAudioRef = useRef<HTMLAudioElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<MediaConnection | null>(null);

  useEffect(() => {
    let localStream: MediaStream;
    let wakeLock: WakeLockSentinel | null = null;

    const init = async () => {
      try {
        // Garantiamo che video e audio siano catturati subito
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        setStream(localStream);
        if (videoRef.current) videoRef.current.srcObject = localStream;

        wakeLock = await requestWakeLock();

        const peer = new Peer(PEER_CONFIG);
        peerRef.current = peer;

        peer.on('open', (id) => {
          setPeerId(id);
          setStatus(ConnectionStatus.WAITING_FOR_PEER);
        });

        peer.on('call', (call) => {
          console.log('Ricevuta chiamata dal monitor...');
          setStatus(ConnectionStatus.CONNECTING);

          // Rispondiamo con lo stream A/V completo
          call.answer(localStream);
          connectionRef.current = call;

          call.on('stream', (remoteStream) => {
            if (incomingAudioRef.current) {
              incomingAudioRef.current.srcObject = remoteStream;
              incomingAudioRef.current.play().catch(console.error);
            }
          });

          call.on('close', () => setStatus(ConnectionStatus.DISCONNECTED));
          setTimeout(() => setStatus(ConnectionStatus.CONNECTED), 1000);
        });

        peer.on('error', (err) => {
          console.error(err);
          setStatus(ConnectionStatus.ERROR);
        });
      } catch (err) {
        console.error(err);
        setStatus(ConnectionStatus.ERROR);
      }
    };

    init();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      peerRef.current?.destroy();
      wakeLock?.release();
    };
  }, []);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoEnabled));
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return {
    peerId,
    status,
    stream,
    isMuted,
    isVideoEnabled,
    videoRef,
    incomingAudioRef,
    toggleMute,
    toggleVideo,
  };
};
