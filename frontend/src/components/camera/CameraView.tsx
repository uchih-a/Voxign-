import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface CameraViewProps {
  onReady?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  className?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onReady,
  videoRef,
  className,
}) => {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
      });
      onReady?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onReady, videoRef]);

  return (
    <video
      ref={videoRef}
      className={cn(
        'w-full h-full object-cover',
        'transform scale-x-[-1]',
        className
      )}
      playsInline
      muted
      autoPlay
      aria-label="Camera feed for hand gesture recognition"
    />
  );
};
