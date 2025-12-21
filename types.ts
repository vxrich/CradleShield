export enum AppMode {
  SELECTION = 'SELECTION',
  CAMERA = 'CAMERA',
  MONITOR = 'MONITOR',
}

export enum ConnectionStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  WAITING_FOR_PEER = 'WAITING_FOR_PEER', // Camera waiting for scan
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface PeerError {
  type: string;
  message: string;
}

// Configuration for PeerJS
export const PEER_CONFIG = {
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
  },
};