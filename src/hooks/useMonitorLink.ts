import { useState, useEffect, useRef } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { ConnectionStatus, PEER_CONFIG } from '../../types';
import { scanFrame } from '../services/ScannerService';
import { requestWakeLock } from '../utils/wakeLock';
import { ensureAVPermissions } from '../utils/ensureAVPermissions';

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
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  const animationFrameRef = useRef<number>(0);
  const fakeVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let scanStream: MediaStream;
    const startScanning = async () => {
      if (!isScanning) return;
      try {
        // Request permissions first on native platforms
        const allowed = await ensureAVPermissions();
        if (!allowed) throw new Error('Camera permission denied');

        scanStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = scanStream;
          videoPreviewRef.current.onloadedmetadata = () => requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error(err);
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
      console.log('Gathering media devices...', await navigator.mediaDevices.enumerateDevices());

      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getAudioTracks().forEach((track) => (track.enabled = false));
      setLocalAudioStream(micStream);
    } catch (e) {
      micStream = new MediaStream();
    }

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', () => {
      // If there is no video track, add a tiny enabled placeholder so the SDP includes a video m-line.

      if (micStream.getVideoTracks().length === 0) {
        try {
          const canvas = document.createElement('canvas') as HTMLCanvasElement;
          canvas.width = 1;
          canvas.height = 1;
          const fakeStream = canvas.captureStream();
          const [fakeVideoTrack] = fakeStream.getVideoTracks();
          if (fakeVideoTrack) {
            // Keep the track enabled to improve negotiation reliability across browsers
            fakeVideoTrack.enabled = true;
            micStream.addTrack(fakeVideoTrack);
            fakeVideoTrackRef.current = fakeVideoTrack;
            console.log('Added placeholder video track to outgoing stream', fakeVideoTrack);
          }
        } catch (e) {
          console.warn('Unable to create placeholder video track', e);
        }
      }

      const call = peer.call(targetPeerId, micStream);
      connRef.current = call;

      // Try to capture underlying RTCRtpSenders so we can control audio sending
      try {
        const pc: RTCPeerConnection | undefined = (call as any).peerConnection;
        if (pc && pc.getSenders) {
          const senders = pc.getSenders();
          audioSenderRef.current = senders.find((s) => s.track && s.track.kind === 'audio') || null;
          console.log('Captured monitor audio RTCRtpSender', !!audioSenderRef.current);
        }
      } catch (e) {
        console.warn('Unable to capture RTCRtpSenders on monitor side', e);
      }

      //Ricezione dello stream A/V remoto
      call.on('stream', (stream) => {
        console.log('Receiving remote A/V stream...', stream);
        console.log('Remote video tracks:', stream.getVideoTracks());
        console.log('Remote audio tracks:', stream.getAudioTracks());

        setRemoteStream(stream);
        setStatus(ConnectionStatus.CONNECTED);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(console.error);
        }
        call.answer(micStream);
      });

      call.on('close', () => {
        setStatus(ConnectionStatus.DISCONNECTED);
        audioSenderRef.current = null;
        // Cleanup placeholder video track if present
        try {
          if (fakeVideoTrackRef.current) {
            fakeVideoTrackRef.current.stop();
            micStream.removeTrack(fakeVideoTrackRef.current);
            fakeVideoTrackRef.current = null;
          }
        } catch (e) {
          console.warn('Error while cleaning up fake video track', e);
        }
      });
    });

    peer.on('error', () => setStatus(ConnectionStatus.ERROR));
  };

  const startTalking = async () => {
    if (!localAudioStream) return;
    const audioTrack = localAudioStream.getAudioTracks()[0] || null;
    const sender = audioSenderRef.current;

    if (sender && typeof sender.replaceTrack === 'function') {
      try {
        await sender.replaceTrack(audioTrack);
      } catch (e) {
        console.warn(
          'replaceTrack failed for monitor audio sender, falling back to enabled toggle',
          e
        );
        if (audioTrack) audioTrack.enabled = true;
      }
    } else {
      localAudioStream.getAudioTracks().forEach((t) => (t.enabled = true));
    }
  };

  const stopTalking = async () => {
    if (!localAudioStream) return;
    const sender = audioSenderRef.current;

    if (sender && typeof sender.replaceTrack === 'function') {
      try {
        await sender.replaceTrack(null);
      } catch (e) {
        console.warn(
          'replaceTrack failed for monitor audio sender, falling back to enabled toggle',
          e
        );
        localAudioStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
    } else {
      localAudioStream.getAudioTracks().forEach((t) => (t.enabled = false));
    }
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
