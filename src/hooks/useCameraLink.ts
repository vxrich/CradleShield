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
        console.log('Gathering media devices...', await navigator.mediaDevices.enumerateDevices());
        // Garantiamo che video e audio siano catturati subito
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // deviceId: '04ed77965f9da94d536ed2286f5033a5b7b6dd5536358ec84ebaa013fd3d067a',
            facingMode: 'environment',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            // deviceId: 'ab0206bd2430e38551120c206cdcc5fc7714b5ab3c06deade6d92dab341d474f',
          },
        });

        setStream(localStream);
        if (videoRef.current) videoRef.current.srcObject = localStream;

        wakeLock = await requestWakeLock();

        const peer = new Peer(PEER_CONFIG);
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log(`Created peer id: ${id}`);
          setPeerId(id);
          setStatus(ConnectionStatus.WAITING_FOR_PEER);
        });

        peer.on('call', (conn) => {
          console.log(`Recevived call from monitor device: ${conn.peer}`);
          setStatus(ConnectionStatus.CONNECTING);

          // Rispondiamo con lo stream A/V completo
          console.log('Sending stream response...', localStream);

          conn.answer(localStream);
          connectionRef.current = conn;

          conn.on('stream', (remoteStream) => {
            console.log('Receiving mic remote stream...', remoteStream);
            if (incomingAudioRef.current) {
              incomingAudioRef.current.srcObject = remoteStream;
              incomingAudioRef.current.play().catch(console.error);
            }
          });

          conn.on('close', () => setStatus(ConnectionStatus.DISCONNECTED));
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
