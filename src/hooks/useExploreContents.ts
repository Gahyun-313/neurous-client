/**
 * 탐색 화면 콘텐츠 무한 스크롤 커스텀 훅
 *
 * useInfiniteQuery를 사용해 페이지 기반 무한 스크롤을 구현함.
 * 다음 페이지 존재 여부를 서버 응답의 메타 필드로 판단하며,
 * 메타가 없는 경우 수신 데이터 수로 마지막 페이지를 추론함.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchExploreContents, ExploreResponse } from '../api/contentApi';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

/**
 * 탐색 화면 React Query 키 팩토리
 *
 * category별로 독립적인 캐시를 유지함.
 * category가 바뀌면 별도 쿼리로 관리되어 이전 카테고리 캐시는 그대로 보존됨.
 *
 * @example
 * exploreKeys.list()           // 전체 탐색
 * exploreKeys.list('ECONOMY')  // 경제 카테고리
 */
export const exploreKeys = {
  all: ['explore'] as const,
  list: (category?: string) => [...exploreKeys.all, { category }] as const,
};

// ─────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────

/** 한 번에 가져올 콘텐츠 수 */
const DEFAULT_PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────────────────────

/**
 * 탐색 화면 콘텐츠 무한 스크롤 훅
 *
 * [페이지네이션 방식]
 * - 첫 페이지: 0 (0-base)
 * - 스크롤 끝에 도달하면 fetchNextPage() 호출
 * - getNextPageParam이 undefined를 반환하면 더 이상 요청 안 함
 *
 * [다음 페이지 판단 우선순위 — getNextPageParam]
 * 1. last === true          → 서버가 마지막 페이지임을 명시한 경우 (최우선)
 * 2. totalPages 있음        → page + 1 < totalPages이면 다음 페이지 존재
 * 3. 메타 없음(구버전 API)  → 수신 데이터 수 < size이면 마지막 페이지로 추론
 *
 * @param category  카테고리 코드 (없으면 전체 조회)
 * @returns         React Query의 useInfiniteQuery 반환값
 *                  - data.pages  : 페이지별 ExploreResponse 배열
 *                  - fetchNextPage : 다음 페이지 요청 함수
 *                  - hasNextPage   : 다음 페이지 존재 여부
 */
export const useExploreContents = (category?: string) => {
  return useInfiniteQuery<ExploreResponse, Error>({
    queryKey: exploreKeys.list(category),

    initialPageParam: 0 as number, // 첫 페이지는 0 (0-base)

    queryFn: ({ pageParam }) => {
      console.log(
        `[React Query] 호출 시작 - Category: ${
          category ?? '전체'
        }, page: ${pageParam}`,
      );

      return fetchExploreContents({
        category,
        page: pageParam as number,
        size: DEFAULT_PAGE_SIZE,
      });
    },

    /**
     * 다음 페이지 파라미터 결정 함수
     *
     * undefined 반환 시 hasNextPage = false가 되어 추가 요청 중단.
     * 서버 응답 구조에 따라 세 가지 방식으로 분기함.
     */
    getNextPageParam: lastPage => {
      // 1) 서버가 last=true를 명시한 경우 → 최우선으로 신뢰
      if (lastPage?.last === true) return undefined;

      // 2) totalPages가 있는 경우 → 다음 페이지 번호가 범위 내인지 확인
      if (typeof lastPage?.totalPages === 'number') {
        const next = (lastPage.page ?? 0) + 1;
        return next < lastPage.totalPages ? next : undefined;
      }

      // 3) 페이지 메타가 없는 구버전 API → 수신 데이터 수로 마지막 페이지 추론
      //    받은 항목 수 < 요청한 size이면 마지막 페이지로 간주
      const count = lastPage?.contents?.length ?? 0;
      const pageSize = lastPage?.size ?? DEFAULT_PAGE_SIZE;
      const isLastByCount = count < pageSize;

      return isLastByCount ? undefined : (lastPage.page ?? 0) + 1;
    },

    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
  });
};
