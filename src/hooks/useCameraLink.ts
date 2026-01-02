import Peer, { MediaConnection } from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { ConnectionStatus, PEER_CONFIG } from '../../types';
import { ensureAVPermissions } from '../utils/ensureAVPermissions';
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
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);

  useEffect(() => {
    let localStream: MediaStream;
    let wakeLock: WakeLockSentinel | null = null;

    const init = async () => {
      try {
        console.log('Gathering media devices...', await navigator.mediaDevices.enumerateDevices());

        // On native wrappers (Capacitor) we should explicitly request runtime permissions
        // before calling getUserMedia so the WebView has the required access.
        const allowed = await ensureAVPermissions();
        if (!allowed) throw new Error('Camera / microphone permissions denied');

        // Garantiamo che video e audio siano catturati subito
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'environment',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
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

          // Try to capture underlying RTCRtpSenders so we can truly stop sending without renegotiation
          try {
            const pc: RTCPeerConnection | undefined = (conn as any).peerConnection;
            if (pc && pc.getSenders) {
              const senders = pc.getSenders();
              audioSenderRef.current =
                senders.find((s) => s.track && s.track.kind === 'audio') || null;
              videoSenderRef.current =
                senders.find((s) => s.track && s.track.kind === 'video') || null;
              console.log('Captured RTCRtpSenders', {
                audio: !!audioSenderRef.current,
                video: !!videoSenderRef.current,
              });
            }
          } catch (e) {
            console.warn('Unable to capture RTCRtpSenders', e);
          }

          conn.on('stream', (remoteStream) => {
            console.log('Receiving mic remote stream...', remoteStream);
            if (incomingAudioRef.current) {
              incomingAudioRef.current.srcObject = remoteStream;
              incomingAudioRef.current.play().catch(console.error);
            }
          });

          conn.on('close', () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            audioSenderRef.current = null;
            videoSenderRef.current = null;
          });
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

  const toggleMute = async () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0] || null;
    const sender = audioSenderRef.current;

    if (sender && typeof sender.replaceTrack === 'function') {
      try {
        if (!isMuted) {
          await sender.replaceTrack(null);
        } else {
          await sender.replaceTrack(audioTrack);
        }
      } catch (e) {
        console.warn('replaceTrack failed for audio sender, falling back to enabled toggle', e);
        if (audioTrack) audioTrack.enabled = isMuted;
      }
    } else {
      // Fallback to toggling enabled
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
    }

    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0] || null;
    const sender = videoSenderRef.current;

    if (sender && typeof sender.replaceTrack === 'function') {
      try {
        if (isVideoEnabled) {
          await sender.replaceTrack(null);
        } else {
          await sender.replaceTrack(videoTrack);
        }
      } catch (e) {
        console.warn('replaceTrack failed for video sender, falling back to enabled toggle', e);
        if (videoTrack) videoTrack.enabled = !isVideoEnabled;
      }
    } else {
      // Fallback to toggling enabled
      stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoEnabled));
    }

    setIsVideoEnabled(!isVideoEnabled);
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
