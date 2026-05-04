import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cameraStore } from '../stores/cameraStore';
import { inferenceApi } from '../api/inference';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { landmarkUtils } from '../utils/landmarkUtils';

interface UseWordModeOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export const useWordMode = (options: UseWordModeOptions = {}) => {
  const { enabled = true } = options;
  const lastSendRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const queryClient = useQueryClient();

  const SEND_INTERVAL_MS = 300; // Send every ~15 frames at 30fps (50% overlap)

  const sendWordPrediction = useCallback(
    async (buffer: [number, number, number][][]) => {
      if (!enabled || isLoadingRef.current || buffer.length !== 30) return;

      const now = Date.now();
      if (now - lastSendRef.current < SEND_INTERVAL_MS) {
        return;
      }

      lastSendRef.current = now;
      isLoadingRef.current = true;

      try {
        const response = await inferenceApi.predictWord({
          sequence: buffer,
        });

        cameraStore.getState().setPrediction(response);

        // Invalidate history query
        queryClient.invalidateQueries({ queryKey: ['inference-history'] });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        console.error('Word prediction error:', err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [enabled, queryClient, options]
  );

  const handleLandmarksDetected = useCallback(
    (landmarks: NormalizedLandmark[]) => {
    if (!enabled) return;

    if (!landmarkUtils.isValidLandmarks(landmarks)) {
      console.warn("[useWordMode] ⏭ Invalid landmarks, frame dropped");
      return;
    }

    const frame = landmarkUtils.landmarksToArray(landmarks);
    cameraStore.getState().pushFrame(frame);

    const buffer = cameraStore.getState().frameBuffer;
  // 🔍 ADD:
    console.log("[useWordMode] Buffer:", buffer.length, "/ 30");

    if (buffer.length === 30) {
      console.log("[useWordMode] ✅ Buffer full — sending word prediction");
      sendWordPrediction(buffer);
    }
    },
    [enabled, sendWordPrediction]
  );

  const clearAndReset = useCallback(() => {
    lastSendRef.current = 0;
    isLoadingRef.current = false;
    cameraStore.getState().clearBuffer();
    cameraStore.getState().clearPrediction();
  }, []);

  return { handleLandmarksDetected, clearAndReset };
};
