import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  onError?: (error: Error) => void;
  onPermissionDenied?: () => void;
}

export const useCamera = (options: UseWebSocketOptions = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element ref not set');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      return new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          videoRef.current?.removeEventListener('canplay', handleCanPlay);
          resolve();
        };

        const handleError = (error: Event) => {
          videoRef.current?.removeEventListener('error', handleError);
          reject(error);
        };

        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('error', handleError);

        // Timeout fallback
        setTimeout(() => {
          videoRef.current?.removeEventListener('canplay', handleCanPlay);
          videoRef.current?.removeEventListener('error', handleError);
          reject(new Error('Camera startup timeout'));
        }, 5000);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (err.name === 'NotAllowedError') {
        options.onPermissionDenied?.();
      }

      options.onError?.(err);
      throw err;
    }
  }, [options]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, streamRef, startCamera, stopCamera };
};
