export type ModelType = 'letter' | 'word';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface LetterRequest {
  landmarks: [number, number, number][];
}

export interface WordRequest {
  sequence: [number, number, number][][];
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  scores: Record<string, number>;
  session_id: string;
}

export interface SessionLog {
  id: string;
  model_type: ModelType;
  prediction: string;
  confidence: number;
  raw_scores: Record<string, number>;
  created_at: string;
}
