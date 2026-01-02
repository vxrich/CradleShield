import { Lock, Volume2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { ConnectionStatus } from '../../types';
import { CameraControls } from '../components';
import { useCameraLink } from '../hooks/useCameraLink';

interface CameraModeProps {
  onBack: () => void;
}

export const CameraMode: React.FC<CameraModeProps> = ({ onBack }) => {
  const {
    peerId,
    status,
    isMuted,
    isVideoEnabled,
    videoRef,
    incomingAudioRef,
    toggleMute,
    toggleVideo,
  } = useCameraLink();

  const [isEcoMode, setIsEcoMode] = useState(false);
  const restart = () => window.location.reload();

  return (
    <div className="relative flex h-full bg-black">
      {/* <LoadingOverlay status={status} onRetry={restart} /> */}
      <audio ref={incomingAudioRef} autoPlay playsInline />

      {isEcoMode && (
        <div
          className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-black"
          onClick={() => setIsEcoMode(false)}
        >
          <div className="text-dark-800 flex animate-pulse flex-col items-center opacity-20">
            <Lock size={48} className="mb-4" />
            <p className="text-sm">Tap to wake screen</p>
          </div>
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {videoRef && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {!isVideoEnabled && (
          <div className="bg-dark-800 absolute inset-0 flex flex-col items-center justify-center">
            <Volume2 size={64} className="text-brand-500 mb-4 animate-pulse" />
            <p className="font-medium text-white">Audio Only Mode</p>
          </div>
        )}

        {status === ConnectionStatus.WAITING_FOR_PEER && peerId && (
          <div className="bg-dark-900/95 absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
            <div className="mb-6 rounded-2xl bg-white p-4">
              <QRCodeSVG value={peerId} size={200} />
            </div>
          </div>
        )}
      </div>

      {status === ConnectionStatus.CONNECTED && (
        <CameraControls
          status={status}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onRestart={restart}
          onBack={onBack}
          onEcoModeToggle={() => setIsEcoMode(true)}
        />
      )}
      {status === ConnectionStatus.WAITING_FOR_PEER && (
        <div className="glass3d mx-auto p-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Scan with Monitor</h2>
          <button onClick={onBack} className="mt-4 text-slate-500">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
