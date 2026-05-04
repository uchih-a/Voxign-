import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';

interface UseHandLandmarkerOptions {
  onLandmarksDetected?: (landmarks: NormalizedLandmark[]) => void;
  onNoHand?: () => void;
  onError?: (error: Error) => void;
}

const waitForVideoDimensions = (
  videoElement: HTMLVideoElement,
  timeoutMs = 10000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      videoElement.removeEventListener('loadeddata', onReady);
      videoElement.removeEventListener('canplay', onReady);
      reject(new Error('Video timed out waiting for dimensions'));
    }, timeoutMs);

    const onReady = () => {
      if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        clearTimeout(timeout);
        videoElement.removeEventListener('loadeddata', onReady);
        videoElement.removeEventListener('canplay', onReady);
        resolve();
      }
    };

    videoElement.addEventListener('loadeddata', onReady);
    videoElement.addEventListener('canplay', onReady);
  });
};

export const useHandLandmarker = (options: UseHandLandmarkerOptions = {}) => {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onLandmarksDetectedRef = useRef(options.onLandmarksDetected);
  const onNoHandRef = useRef(options.onNoHand);
  const onErrorRef = useRef(options.onError);

  // Keep refs fresh every render — no deps array is correct here
  useEffect(() => {
    onLandmarksDetectedRef.current = options.onLandmarksDetected;
    onNoHandRef.current = options.onNoHand;
    onErrorRef.current = options.onError;
  });

  // Initialize HandLandmarker once on mount
  // ✅ Remove isInitializingRef — let the cleanup handle Strict Mode's
  //    double-invoke by closing the landmarker and re-init cleanly
  useEffect(() => {
    let isMounted = true;
    let localLandmarker: HandLandmarker | null = null;

    const initializeLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          import.meta.env.VITE_MEDIAPIPE_WASM_URL ||
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        localLandmarker = landmarker;

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        } else {
          // Strict Mode unmounted us before async completed — clean up
          landmarker.close();
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (isMounted) {
          setError(e);
          onErrorRef.current?.(e);
        }
      }
    };

    initializeLandmarker();

    return () => {
      isMounted = false;
      // Close whatever was created (handles Strict Mode remount)
      if (localLandmarker) {
        localLandmarker.close();
        localLandmarker = null;
      }
      landmarkerRef.current = null;
      setIsReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startDetection = useCallback(
    async (videoElement: HTMLVideoElement) => {
      try {
        await waitForVideoDimensions(videoElement);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        onErrorRef.current?.(e);
        return;
      }

      const detect = () => {
        if (!landmarkerRef.current || !videoElement) return;

        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
          animationFrameRef.current = requestAnimationFrame(detect);
          return;
        }

        if (videoElement.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoElement.currentTime;
          try {
            const result = landmarkerRef.current.detectForVideo(
              videoElement,
              performance.now()
            );
            console.log("[useHandLandmarker] Raw result.landmarks count:", result.landmarks.length);
            if (result.landmarks.length > 0) {
                onLandmarksDetectedRef.current?.(result.landmarks[0]);
                console.log("[useHandLandmarker] First landmark [0]:", result.landmarks[0][0]);
                console.log("[useHandLandmarker] Z range:", 
                    Math.min(...result.landmarks[0].map(l => l.z)).toFixed(4),
                    "→",
                    Math.max(...result.landmarks[0].map(l => l.z)).toFixed(4)
                ); // ← Add closing parenthesis here
            } else {
                onNoHandRef.current?.();
            }
          } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            onErrorRef.current?.(e);
          }
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      animationFrameRef.current = requestAnimationFrame(detect);
    },
    []
  );

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const closeLandmarker = useCallback(() => {
    stopDetection();
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
  }, [stopDetection]);

  useEffect(() => {
    return () => {
      closeLandmarker();
    };
  }, [closeLandmarker]);

  return {
    landmarker: landmarkerRef.current,
    isReady,
    error,
    startDetection,
    stopDetection,
    closeLandmarker,
  };
};