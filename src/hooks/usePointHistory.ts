/**
 * 포인트/경험치 획득 내역 React Query 커스텀 훅
 *
 * fetchPointHistory 응답을 PointHistoryScreen이 사용하는
 * PointHistoryItem 형태로 변환해 반환함.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchPointHistory } from '../api/pointHistoryApi';
import { getUserInfo } from '../services/authService';
import type { PointHistoryItem } from '../data/mock/characterData';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

/**
 * 포인트 내역 관련 React Query 키 팩토리
 */
export const pointHistoryKeys = {
  all: ['pointHistory'] as const,
  lists: () => [...pointHistoryKeys.all, 'list'] as const,
};

// ─────────────────────────────────────────────────────────────
// 커스텀 훅
// ─────────────────────────────────────────────────────────────

/**
 * 보상 획득 내역 조회 훅
 *
 * [응답 변환]
 * 서버 응답(PointHistoryDto)을 PointHistoryScreen이 기대하는
 * PointHistoryItem 구조로 매핑함:
 * - historyId → id, transactionId (PointHistoryScreen의 트랜잭션 기준 1아이템 구조)
 * - exp       → xpDelta
 * - point     → ptDelta
 * - reason    → title
 *
 * @returns  items — PointHistoryItem 배열
 */
export const usePointHistory = () => {
  return useQuery<{ items: PointHistoryItem[] }, Error>({
    queryKey: pointHistoryKeys.lists(),
    queryFn: async () => {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('사용자 정보가 없음');
      }

      const response = await fetchPointHistory(userInfo.userId);

      // 서버 PointHistoryDto → 화면용 PointHistoryItem 변환
      // historyId를 transactionId로 사용 (PointHistoryScreen 구조 유지)
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
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });
};
