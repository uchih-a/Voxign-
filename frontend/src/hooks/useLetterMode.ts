import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cameraStore } from '../stores/cameraStore';
import { inferenceApi } from '../api/inference';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { landmarkUtils } from '../utils/landmarkUtils';

interface UseLetterModeOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export const useLetterMode = (options: UseLetterModeOptions = {}) => {
  const { enabled = true } = options;
  const lastCallTimeRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const queryClient = useQueryClient();

  // --- POSE STABILIZER ---
  const predictionBufferRef = useRef<string[]>([]);
  
  // Require 3 identical backend predictions in a row before updating the UI
  const REQUIRED_CONSECUTIVE_MATCHES = 3; 

  // Lowered from 300ms to 150ms so the 3 required frames are captured quickly (~450ms total)
  const DEBOUNCE_MS = 150;

  const sendPrediction = useCallback(
    async (landmarks: NormalizedLandmark[]) => {
      // 1. Check if we are active or already processing
      if (!enabled || isLoadingRef.current) {
        return;
      }

      // 2. Validate landmarks
      if (!landmarks || !landmarkUtils.isValidLandmarks(landmarks)) {
        // If the hand disappears from the frame, clear the buffer 
        // so an old, half-finished pose doesn't carry over
        predictionBufferRef.current = [];
        return;
      }

      // 3. Debounce to prevent flooding the backend
      const now = Date.now();
      if (now - lastCallTimeRef.current < DEBOUNCE_MS) {
        return;
      }

      lastCallTimeRef.current = now;
      isLoadingRef.current = true;

      try {
        const landmarkArray = landmarkUtils.landmarksToArray(landmarks);

        // Fetch prediction from backend
        const response = await inferenceApi.predictLetter({
          landmarks: landmarkArray,
        });

        const currentPrediction = response.prediction;

        // Add the new prediction to the end of our buffer
        predictionBufferRef.current.push(currentPrediction);

        // Keep the buffer strictly at our required length
        if (predictionBufferRef.current.length > REQUIRED_CONSECUTIVE_MATCHES) {
          predictionBufferRef.current.shift();
        }

        // Check if the buffer is full AND every item in it is the exact same letter
        const isPoseHeld =
          predictionBufferRef.current.length === REQUIRED_CONSECUTIVE_MATCHES &&
          predictionBufferRef.current.every((p) => p === currentPrediction);

        if (isPoseHeld) {
          // 🎉 Pose is stable! Update the UI Store.
          cameraStore.getState().setPrediction(response);
          queryClient.invalidateQueries({ queryKey: ['inference-history'] });
          
          // Clear the buffer after a successful read so it requires 
          // a fresh hold before triggering the exact same letter again
          predictionBufferRef.current = [];
        }

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        console.error('Letter prediction error:', err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [enabled, queryClient] // Options removed to prevent re-creation every render
  );

  const clearAndReset = useCallback(() => {
    lastCallTimeRef.current = 0;
    isLoadingRef.current = false;
    predictionBufferRef.current = []; // Ensure buffer clears on reset
    cameraStore.getState().clearPrediction();
  }, []);

  return { sendPrediction, clearAndReset };
};