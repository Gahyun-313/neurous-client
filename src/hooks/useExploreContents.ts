import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchExploreContents, ExploreResponse } from '../api/contentApi';

export const exploreKeys = {
  all: ['explore'] as const,
  list: (category?: string) => [...exploreKeys.all, { category }] as const,
};

const DEFAULT_PAGE_SIZE = 10;

export const useExploreContents = (category?: string) => {
  return useInfiniteQuery<ExploreResponse, Error>({
    queryKey: exploreKeys.list(category),

    // page 기반: 첫 페이지는 0
    initialPageParam: 0 as number,

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

    getNextPageParam: lastPage => {
      // 1) 서버가 last=true를 주면 그걸 최우선으로 신뢰
      if (lastPage?.last === true) return undefined;

      // 2) totalPages가 있으면 page+1이 totalPages 미만일 때만 다음 페이지
      if (typeof lastPage?.totalPages === 'number') {
        const next = (lastPage.page ?? 0) + 1;
        return next < lastPage.totalPages ? next : undefined;
      }

      // 3) 메타가 없으면 "이번에 받은 데이터가 size보다 적으면 마지막"으로 판단
      const count = lastPage?.contents?.length ?? 0;
      const pageSize = lastPage?.size ?? DEFAULT_PAGE_SIZE;
      const isLastByCount = count < pageSize;

      return isLastByCount ? undefined : (lastPage.page ?? 0) + 1;
    },

    staleTime: 1000 * 60 * 1,
  });
};
