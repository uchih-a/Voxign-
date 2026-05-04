import { client } from './client'; 
import type {
  LetterRequest,
  WordRequest,
  PredictionResponse,
  SessionLog,
} from '../types/inference';
import type { PaginatedResponse } from '../types/api';

export const inferenceApi = {
  predictLetter: async (request: LetterRequest): Promise<PredictionResponse> => {

      console.log("[inference.ts] predictLetter payload:");
  console.log("  landmarks count:", request.landmarks.length, "(expected 21)");
  console.log("  first point:", request.landmarks[0]);
  console.log("  all triples?", request.landmarks.every(l => l.length === 3));
  console.log("  any NaN?", request.landmarks.flat().some(v => isNaN(v)));
  
    const response = await client.post<PredictionResponse>(
      '/inference/letter',
      request
    );
    return response.data;
  },

  predictWord: async (request: WordRequest): Promise<PredictionResponse> => {
      console.log("[inference.ts] predictWord payload:");
  console.log("  frame count:", request.sequence.length, "(expected 30)");
  console.log("  landmarks per frame:", request.sequence[0]?.length, "(expected 21)");
  console.log("  first point frame[0][0]:", request.sequence[0]?.[0]);
  
    const response = await client.post<PredictionResponse>(
      '/inference/word',
      request
    );
    return response.data;
  },

  getHistory: async (
    page: number = 1,
    pageSize: number = 20,
    modelType?: 'letter' | 'word'
  ): Promise<PaginatedResponse<SessionLog>> => {
    const response = await client.get<PaginatedResponse<SessionLog>>(
      '/inference/history',
      {
        params: {
          page,
          page_size: pageSize,
          ...(modelType && { model_type: modelType }),
        },
      }
    );
    return response.data;
  },

  getUserHistory: async (
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<SessionLog>> => {
    const response = await client.get<PaginatedResponse<SessionLog>>(
      `/inference/history/${userId}`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return response.data;
  },

  checkHealth: async (): Promise<{ status: string }> => {
    const response = await client.get<{ status: string }>('/health');
    return response.data;
  },
};
