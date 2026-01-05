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
  const remoteAudioStreamRef = useRef<MediaStream | null>(null);
  const trackStateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let localStream: MediaStream;
    let wakeLock: WakeLockSentinel | null = null;

    const init = async () => {
      try {
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
          setPeerId(id);
          setStatus(ConnectionStatus.WAITING_FOR_PEER);
        });

        peer.on('call', (conn) => {
          setStatus(ConnectionStatus.CONNECTING);

          // Rispondiamo con lo stream A/V completo
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
            }
          } catch (e) {
            console.warn('Unable to capture RTCRtpSenders', e);
          }

          conn.on('stream', (remoteStream) => {
            // Salva lo stream per riferimento futuro
            remoteAudioStreamRef.current = remoteStream;

            if (incomingAudioRef.current) {
              const audioElement = incomingAudioRef.current;

              // Pulisci solo lo srcObject, NON fermare i track (gestiti da PeerJS)
              if (audioElement.srcObject) {
                audioElement.srcObject = null;
              }

              // Imposta il nuovo stream
              audioElement.srcObject = remoteStream;

              // Assicurati che l'elemento audio sia configurato correttamente
              audioElement.volume = 1.0;
              audioElement.muted = false;

              // Gestisci il play in modo sicuro
              const handlePlay = async () => {
                try {
                  await audioElement.play();
                } catch (error: any) {
                  if (error.name !== 'AbortError') {
                    console.warn('Error playing incoming audio:', error);
                    // Prova di nuovo dopo un breve delay
                    setTimeout(() => {
                      audioElement.play().catch(console.error);
                    }, 100);
                  }
                }
              };

              // Listener per quando vengono aggiunti nuovi track allo stream
              const handleTrackAdded = (event: MediaStreamTrackEvent) => {
                const track = event.track;
                if (track.kind === 'audio') {
                  handlePlay();
                }
              };

              // Listener per quando i track cambiano stato
              const handleTrackEnabled = () => {
                const audioTracks = remoteStream.getAudioTracks();
                const enabledTracks = audioTracks.filter((t) => t.enabled);
                if (enabledTracks.length > 0) {
                  handlePlay();
                }
              };

              // Aggiungi listener per i nuovi track
              remoteStream.addEventListener('addtrack', handleTrackAdded);

              // Monitora i track esistenti per cambiamenti di stato
              // Usa un polling più frequente per verificare quando i track vengono abilitati
              let lastEnabledState = remoteStream.getAudioTracks().map((t) => t.enabled);

              // Pulisci l'interval precedente se esiste
              if (trackStateCheckIntervalRef.current) {
                clearInterval(trackStateCheckIntervalRef.current);
              }

              trackStateCheckIntervalRef.current = setInterval(() => {
                const audioTracks = remoteStream.getAudioTracks();
                const currentEnabledState = audioTracks.map((t) => t.enabled);
                const hasNewEnabledTrack = currentEnabledState.some(
                  (enabled, index) => enabled && !lastEnabledState[index]
                );
                const hasEnabledTracks = audioTracks.some((t) => t.enabled);

                if (hasNewEnabledTrack) {
                  // Prova a riprodurre più volte per assicurarsi che funzioni
                  handlePlay();
                  setTimeout(handlePlay, 100);
                  setTimeout(handlePlay, 300);
                }

                // Verifica anche lo stato dell'elemento audio
                if (audioElement.paused && hasEnabledTracks) {
                  handlePlay();
                }

                lastEnabledState = currentEnabledState;
              }, 100); // Polling più frequente (ogni 100ms invece di 200ms)

              // Prova a fare play quando l'audio è pronto
              if (audioElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
                handlePlay();
              } else {
                const onLoadedMetadata = () => {
                  handlePlay();
                  audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                };
                audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
              }

              // Prova anche quando l'audio può essere riprodotto
              const onCanPlay = () => {
                handlePlay();
                audioElement.removeEventListener('canplay', onCanPlay);
              };
              audioElement.addEventListener('canplay', onCanPlay);

              // Listener per quando l'audio inizia effettivamente a riprodurre
              audioElement.addEventListener('playing', () => {
                // Audio is playing successfully
              });
            }
          });

          conn.on('close', () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            audioSenderRef.current = null;
            videoSenderRef.current = null;

            // Pulisci l'interval di monitoraggio dei track
            if (trackStateCheckIntervalRef.current) {
              clearInterval(trackStateCheckIntervalRef.current);
              trackStateCheckIntervalRef.current = null;
            }

            // Pulisci lo stream remoto
            remoteAudioStreamRef.current = null;
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
