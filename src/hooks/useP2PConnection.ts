import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { ConnectionStatus, PEER_CONFIG } from '../types';

export function useP2PConnection() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.INITIALIZING);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<MediaConnection | null>(null);

  const initLocalMedia = async (constraints: MediaStreamConstraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    return stream;
  };

  const initLocalAudio = async (constraints?: MediaTrackConstraints) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints ?? true });
    // Start muted by default
    stream.getAudioTracks().forEach((t) => (t.enabled = false));
    setLocalAudioStream(stream);
    return stream;
  };

  const setMicEnabled = (enabled: boolean) => {
    if (!localAudioStream) return;
    localAudioStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
  };

  const startTalking = () => setMicEnabled(true);
  const stopTalking = () => setMicEnabled(false);

  const createPeerWithLocalStream = (stream?: MediaStream | null) => {
    if (peerRef.current) return peerRef.current;

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus(ConnectionStatus.WAITING_FOR_PEER);
    });

    peer.on('call', (call) => {
      setStatus(ConnectionStatus.CONNECTING);
      const answerStream = stream ?? localStream ?? localAudioStream;
      if (!answerStream) {
        console.warn('No local stream available to answer incoming call');
        return;
      }

      call.answer(answerStream);
      connRef.current = call;

      call.on('stream', (remote) => {
        setRemoteStream(remote);
      });

      call.on('close', () => {
        setStatus(ConnectionStatus.DISCONNECTED);
        connRef.current = null;
      });

      setTimeout(() => setStatus(ConnectionStatus.CONNECTED), 1000);
    });

    peer.on('error', (err) => {
      console.error('Peer error', err);
      setStatus(ConnectionStatus.ERROR);
    });

    peer.on('disconnected', () => {
      setStatus(ConnectionStatus.DISCONNECTED);
    });

    return peer;
  };

  const callPeer = (targetId: string, stream?: MediaStream | null) => {
    if (!peerRef.current) createPeerWithLocalStream(stream);
    const peer = peerRef.current!;

    const call = peer.call(targetId, stream ?? localAudioStream ?? localStream ?? new MediaStream());
    connRef.current = call;

    call.on('stream', (remote) => {
      setRemoteStream(remote);
      setStatus(ConnectionStatus.CONNECTED);
    });

    call.on('close', () => {
      setStatus(ConnectionStatus.DISCONNECTED);
      connRef.current = null;
    });

    call.on('error', (err) => {
      console.error('Call error', err);
      setStatus(ConnectionStatus.ERROR);
    });

    return call;
  };

  useEffect(() => {
    if (localStream && !peerRef.current) {
      createPeerWithLocalStream(localStream);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      localAudioStream?.getTracks().forEach((t) => t.stop());
      connRef.current?.close();
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    peerId,
    status,
    localStream,
    localAudioStream,
    remoteStream,
    initLocalMedia,
    initLocalAudio,
    setMicEnabled,
    startTalking,
    stopTalking,
    createPeerWithLocalStream,
    callPeer,
    setStatus,
    setLocalStream,
    setRemoteStream,
    setLocalAudioStream,
  } as const;
}
