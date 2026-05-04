import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { CameraView } from '../components/camera/CameraView';
import { LandmarkOverlay } from '../components/camera/LandmarkOverlay';
import { PredictionPanel } from '../components/camera/PredictionPanel';
import { ModeToggle } from '../components/camera/ModeToggle';
import { StatusPill } from '../components/ui/StatusPill';
import { useCamera } from '../hooks/useCamera';
import { useHandLandmarker } from '../hooks/useHandLandmarker';
import { useLetterMode } from '../hooks/useLetterMode';
import { useWordMode } from '../hooks/useWordMode';
import { cameraStore } from '../stores/cameraStore';
import { GlassCard } from '../components/ui/GlassCard';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export const RecognitionPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const noHandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mode = cameraStore((state) => state.mode);
  const status = cameraStore((state) => state.status);
  const prediction = cameraStore((state) => state.prediction);
  const setStatus = cameraStore((state) => state.setStatus);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);

  // ✅ Single ref from useCamera — will be attached to <video> by CameraView
  const { videoRef, startCamera, stopCamera } = useCamera({
    onError: (error) => {
      setCameraError(error.message);
      setStatus('idle');
    },
    onPermissionDenied: () => {
      setCameraError(
        'Camera access is required for ASL recognition. Please allow camera access in your browser settings.'
      );
      setStatus('idle');
    },
  });

  // MediaPipe hook
  const { isReady: landmarkerReady, startDetection, stopDetection } =
    useHandLandmarker({
      onLandmarksDetected: (detectedLandmarks) => {
        setLandmarks(detectedLandmarks);
        setStatus('detecting');

        if (noHandTimeoutRef.current) {
          clearTimeout(noHandTimeoutRef.current);
          noHandTimeoutRef.current = null;
        }

        noHandTimeoutRef.current = setTimeout(() => {
          setStatus('no-hand');
        }, 500);
      },
      onNoHand: () => {},
      onError: (error) => {
        console.error('Hand detection error:', error);
      },
    });

  // Letter mode hook
  const { sendPrediction: letterSend, clearAndReset: letterClear } =
    useLetterMode({ enabled: mode === 'letter' });

  // Word mode hook
  const { handleLandmarksDetected: wordHandle, clearAndReset: wordClear } =
    useWordMode({ enabled: mode === 'word' });

  // ✅ Initialize camera and detection
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!landmarkerReady) return;

        await startCamera(); // videoRef.current is set here

        if (!videoRef.current) {
          throw new Error('Video element not ready after camera start');
        }

        setStatus('ready');
        startDetection(videoRef.current); // ✅ safe to use now
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();

    return () => {
      stopDetection();
      stopCamera();
      if (noHandTimeoutRef.current) {
        clearTimeout(noHandTimeoutRef.current);
      }
    };
  }, [landmarkerReady, startCamera, stopCamera, startDetection, stopDetection, setStatus]);

  // Route landmarks to mode handler
  useEffect(() => {
    if (!landmarks) return;
    if (mode === 'letter') {
      letterSend(landmarks);
    } else {
      wordHandle(landmarks);
    }
  }, [landmarks, mode, letterSend, wordHandle]);

  // Handle mode changes
  useEffect(() => {
    if (mode === 'letter') {
      wordClear();
    } else {
      letterClear();
    }
  }, [mode, letterClear, wordClear]);

  const handleClearPrediction = () => {
    cameraStore.getState().clearPrediction();
    setLandmarks(null);
  };

  const handleSaveSession = async () => {
    console.log('Session saved');
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-bg-primary flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {/* ✅ videoRef from useCamera attached to <video> here */}
        <CameraView videoRef={videoRef} onReady={() => {}} />

        {/* ✅ Same videoRef passed for canvas sizing */}
        <LandmarkOverlay landmarks={landmarks} videoRef={videoRef} />

        <div className="absolute top-0 inset-x-0 z-30">
          <div className="p-4 flex items-center justify-between">
            <TopBar
              title={mode === 'letter' ? 'Letters' : 'Words'}
              showBackButton={true}
            />
          </div>
          <div className="absolute top-4 right-4">
            <StatusPill status={status} />
          </div>
        </div>

        {cameraError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <GlassCard className="max-w-md p-6 text-center space-y-4">
              <h2 className="font-serif text-xl font-bold text-cream">
                Camera Access Required
              </h2>
              <p className="font-sans text-sm text-cream-muted">{cameraError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-accent text-bg-primary rounded-btn font-medium"
              >
                Retry
              </button>
            </GlassCard>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20">
          <PredictionPanel
            prediction={prediction}
            onClear={handleClearPrediction}
            onSaveSession={handleSaveSession}
          />
        </div>

        <ModeToggle />
      </div>
    </div>
  );
};

// Tell Vite: this module can't be hot-swapped, do a full reload instead
if (import.meta.hot) {
  import.meta.hot.decline();
}