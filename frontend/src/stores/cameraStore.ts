import { create } from 'zustand';
import type { PredictionResponse } from '../types/inference';

type CameraStatus = 'idle' | 'ready' | 'detecting' | 'no-hand';
type CameraMode = 'letter' | 'word';

interface Prediction {
  prediction: string;
  confidence: number;
  timestamp: number;
}

interface CameraState {
  mode: CameraMode;
  status: CameraStatus;
  prediction: PredictionResponse | null;
  history: Prediction[];
  frameBuffer: [number, number, number][][];

  setMode: (mode: CameraMode) => void;
  setStatus: (status: CameraStatus) => void;
  setPrediction: (pred: PredictionResponse) => void;
  clearPrediction: () => void;
  pushFrame: (frame: [number, number, number][]) => void;
  clearBuffer: () => void;
  reset: () => void;
}

const initialState = {
  mode: 'letter' as CameraMode,
  status: 'idle' as CameraStatus,
  prediction: null,
  history: [],
  frameBuffer: [],
};

export const cameraStore = create<CameraState>((set) => ({
  ...initialState,

  setMode: (mode: CameraMode) => {
    set((state) => ({
      mode,
      frameBuffer: [], // Clear buffer when mode changes
      prediction: null,
    }));
  },

  setStatus: (status: CameraStatus) => {
    set({ status });
  },

  setPrediction: (pred: PredictionResponse) => {
    set((state) => ({
      prediction: pred,
      history: [
        {
          prediction: pred.prediction,
          confidence: pred.confidence,
          timestamp: Date.now(),
        },
        ...state.history,
      ].slice(0, 5), // Keep last 5
    }));
  },

  clearPrediction: () => {
    set({ prediction: null });
  },

  pushFrame: (frame: [number, number, number][]) => {
    set((state) => {
      const newBuffer = [...state.frameBuffer, frame];
      if (newBuffer.length > 30) {
        newBuffer.shift();
      }
      return { frameBuffer: newBuffer };
    });
  },

  clearBuffer: () => {
    set({ frameBuffer: [] });
  },

  reset: () => {
    set(initialState);
  },
}));
