import { useInfiniteQuery } from '@tanstack/react-query';
import { inferenceApi } from '../api/inference';
import type { SessionLog } from '../types/inference';

interface UseInferenceHistoryOptions {
  modelType?: 'letter' | 'word';
  pageSize?: number;
  enabled?: boolean;
}

export const useInferenceHistory = ({
  modelType,
  pageSize = 20,
  enabled = true,
}: UseInferenceHistoryOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['inference-history', { modelType }],
    queryFn: ({ pageParam = 1 }) =>
      inferenceApi.getHistory(pageParam, pageSize, modelType),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled,
  });
};
