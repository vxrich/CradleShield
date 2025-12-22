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
    <div className="absolute inset-0 z-50 bg-dark-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
      {status === ConnectionStatus.ERROR || status === ConnectionStatus.DISCONNECTED ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
            <WifiOff size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
          <p className="text-slate-400 mb-6">The link between devices was interrupted.</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="bg-white text-dark-900 px-6 py-2 rounded-full font-bold hover:bg-slate-200 transition"
            >
              Reconnect
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 size={48} className="text-brand-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-white">
            {status === ConnectionStatus.INITIALIZING && "Initializing Secure Link..."}
            {status === ConnectionStatus.CONNECTING && "Negotiating P2P Connection..."}
            {status === ConnectionStatus.WAITING_FOR_PEER && "Waiting for Monitor..."}
          </h3>
        </div>
      )}
    </div>
  );
};