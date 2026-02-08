import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 staleTime: 0 (즉시 stale)
      staleTime: 0,
      // 기본 gcTime (이전 cacheTime): 5분
      gcTime: 1000 * 60 * 5,
      // 네트워크 오류 시 재시도 횟수
      retry: 1,
      // 재시도 간격
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // refetchOnWindowFocus: false, // 필요시 활성화
    },
    mutations: {
      // mutation 재시도 횟수
      retry: 0,
    },
  },
});
