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

  // Gestisci il cambio di remoteStream con un useEffect dedicato
  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;

    const videoElement = remoteVideoRef.current;

    // Imposta lo stream
    videoElement.srcObject = remoteStream;

    // Gestisci il play in modo sicuro
    const handlePlay = async () => {
      try {
        await videoElement.play();
      } catch (error: any) {
        // AbortError è normale quando viene interrotto da un nuovo load
        if (error.name !== 'AbortError') {
          console.warn('Error playing remote video:', error);
        }
      }
    };

    // Prova a fare play quando il video è pronto
    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handlePlay();
    } else {
      const onLoadedMetadata = () => {
        handlePlay();
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
    }

    // Cleanup: rimuovi solo lo srcObject, non fermare i track (gestiti da PeerJS)
    return () => {
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [remoteStream]);

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

    // Crea lo stream audio locale (solo per il monitor, non per la chiamata)
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getAudioTracks().forEach((track) => (track.enabled = false));
      setLocalAudioStream(micStream);
    } catch (e) {
      console.warn('Failed to get microphone stream', e);
      micStream = new MediaStream();
      setLocalAudioStream(micStream);
    }

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', async () => {
      // Crea uno stream separato per la chiamata WebRTC
      // Questo stream contiene solo l'audio (e un fake video se necessario)
      const callStream = new MediaStream();

      // Aggiungi l'audio track allo stream della chiamata
      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          callStream.addTrack(track);
        });
      }

      // Aggiungi un fake video track solo se necessario per la negoziazione SDP
      // Questo è necessario per alcuni browser che richiedono una m-line video nell'SDP
      if (callStream.getVideoTracks().length === 0) {
        try {
          const canvas = document.createElement('canvas') as HTMLCanvasElement;
          canvas.width = 1;
          canvas.height = 1;
          const fakeStream = canvas.captureStream(0); // 0 fps per minimizzare overhead
          const [fakeVideoTrack] = fakeStream.getVideoTracks();
          if (fakeVideoTrack) {
            fakeVideoTrack.enabled = true;
            callStream.addTrack(fakeVideoTrack);
            fakeVideoTrackRef.current = fakeVideoTrack;
          }
        } catch (e) {
          console.warn('Unable to create placeholder video track', e);
        }
      }

      const call = peer.call(targetPeerId, callStream);
      connRef.current = call;

      // Cattura i RTCRtpSenders per controllare l'invio dell'audio
      // Aspetta che la connessione sia stabilita prima di catturare i senders
      const captureSenders = async () => {
        try {
          const pc: RTCPeerConnection | undefined = (call as any).peerConnection;
          if (pc && pc.getSenders) {
            const senders = pc.getSenders();
            audioSenderRef.current =
              senders.find((s) => s.track && s.track.kind === 'audio') || null;

            // Disabilita il track inizialmente (non vogliamo inviare finché non si preme "Hold to Talk")
            if (audioTracks.length > 0) {
              audioTracks.forEach((track) => {
                track.enabled = false;
              });
            }
          }
        } catch (e) {
          console.warn('Unable to capture RTCRtpSenders on monitor side', e);
        }
      };

      // Prova a catturare i senders immediatamente
      captureSenders();

      // Prova anche dopo un breve delay per assicurarsi che la connessione sia stabilita
      setTimeout(captureSenders, 500);

      // Ricezione dello stream A/V remoto dalla camera
      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        setStatus(ConnectionStatus.CONNECTED);
      });

      call.on('close', () => {
        setStatus(ConnectionStatus.DISCONNECTED);
        audioSenderRef.current = null;

        // Cleanup del fake video track
        try {
          if (fakeVideoTrackRef.current) {
            fakeVideoTrackRef.current.stop();
            if (callStream.getVideoTracks().includes(fakeVideoTrackRef.current)) {
              callStream.removeTrack(fakeVideoTrackRef.current);
            }
            fakeVideoTrackRef.current = null;
          }
        } catch (e) {
          console.warn('Error while cleaning up fake video track', e);
        }
      });
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setStatus(ConnectionStatus.ERROR);
    });
  };

  const startTalking = async () => {
    if (!localAudioStream) {
      console.warn('startTalking: localAudioStream is null');
      return;
    }
    const audioTrack = localAudioStream.getAudioTracks()[0] || null;
    if (!audioTrack) {
      console.warn('startTalking: no audio track found');
      return;
    }

    const sender = audioSenderRef.current;

    // Abilita sempre il track
    audioTrack.enabled = true;

    if (sender && typeof sender.replaceTrack === 'function') {
      try {
        // Se il track non è nel sender, aggiungilo
        if (sender.track !== audioTrack) {
          await sender.replaceTrack(audioTrack);
        }
      } catch (e) {
        console.warn(
          'replaceTrack failed for monitor audio sender, track is enabled but may not be sending',
          e
        );
      }
    }
  };

  const stopTalking = async () => {
    if (!localAudioStream) {
      console.warn('stopTalking: localAudioStream is null');
      return;
    }
    const audioTrack = localAudioStream.getAudioTracks()[0] || null;
    if (!audioTrack) {
      console.warn('stopTalking: no audio track found');
      return;
    }

    // Disabilita il track per fermare l'invio
    audioTrack.enabled = false;
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
