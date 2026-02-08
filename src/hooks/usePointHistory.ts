/**
 * 포인트/경험치 히스토리 React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { fetchPointHistory } from '../api/pointHistoryApi';
import { getUserInfo } from '../services/authService';
import type { PointHistoryItem } from '../data/mock/characterData';

// Query Keys
export const pointHistoryKeys = {
  all: ['pointHistory'] as const,
  lists: () => [...pointHistoryKeys.all, 'list'] as const,
};

/**
 * 보상 획득 내역 조회
 * - getUserInfo()에서 userId 꺼내서 호출
 */
export const usePointHistory = () => {
  return useQuery<{ items: PointHistoryItem[] }, Error>({
    queryKey: pointHistoryKeys.lists(),
    queryFn: async () => {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('사용자 정보가 없습니다');
      }

      const response = await fetchPointHistory(userInfo.userId);

      /**
       * 백엔드 응답 historyId를 transactionId로 사용
       * (PointHistoryScreen의 "트랜잭션 기준 1아이템" 구조 유지용)
       */
      const items: PointHistoryItem[] = (response.data ?? []).map(it => ({
        id: String(it.historyId),
        transactionId: String(it.historyId),
        xpDelta: it.exp ?? 0,
        ptDelta: it.point ?? 0,
        title: it.reason ?? '',
        createdAt: it.createdAt,
      }));

      return { items };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
