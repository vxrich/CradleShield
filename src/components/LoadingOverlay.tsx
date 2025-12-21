import React from 'react';
import { ConnectionStatus } from '../types';
import { Loader2, WifiOff } from 'lucide-react';

interface LoadingOverlayProps {
  status: ConnectionStatus;
  onRetry?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, onRetry }) => {
  if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.IDLE) return null;

  return (
    <div className="bg-dark-900/90 absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
      {status === ConnectionStatus.ERROR || status === ConnectionStatus.DISCONNECTED ? (
        <div className="animate-in fade-in zoom-in flex flex-col items-center duration-300">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500">
            <WifiOff size={32} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">Connection Lost</h3>
          <p className="mb-6 text-slate-400">The link between devices was interrupted.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-dark-900 rounded-full bg-white px-6 py-2 font-bold transition hover:bg-slate-200"
            >
              Reconnect
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 size={48} className="text-brand-500 mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-white">
            {status === ConnectionStatus.INITIALIZING && 'Initializing Secure Link...'}
            {status === ConnectionStatus.CONNECTING && 'Negotiating P2P Connection...'}
            {status === ConnectionStatus.WAITING_FOR_PEER && 'Waiting for Monitor...'}
          </h3>
        </div>
      )}
    </div>
  );
};
