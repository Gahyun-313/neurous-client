import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSearchContents, ContentResponse } from '../api/contentApi';

// Query Keys 관리
export const searchKeys = {
  all: ['search'] as const,
  list: (keyword: string) => [...searchKeys.all, { keyword }] as const,
};

interface UseSearchContentsProps {
  keyword: string;
  enabled?: boolean; // 실시간 검색 시 입력값이 있을 때만 실행하기 위해 추가
}

/**
 * 컨텐츠 검색 무한 스크롤 훅
 */
export const useSearchContents = ({
  keyword,
  enabled = true,
}: UseSearchContentsProps) => {
  return useInfiniteQuery<ContentResponse[], Error>({
    // 키워드가 바뀔 때마다 새로운 검색을 수행하도록 queryKey에 keyword 포함
    queryKey: searchKeys.list(keyword),

    initialPageParam: 0,

    // API 호출 함수
    queryFn: ({ pageParam }) =>
      fetchSearchContents({
        keyword,
        page: Number(pageParam),
      }),

    // enabled 옵션: keyword가 없으면 API를 호출하지 않도록 제어
    enabled: enabled && keyword.trim().length > 0,

    // 다음 페이지 번호 결정 로직
    getNextPageParam: (lastPage, allPages) => {
      // 서버에서 가져온 데이터가 없거나 10개 미만이면 마지막 페이지로 간주
      // (보통 서버에서 한 페이지에 10개씩 준다고 가정할 때)
      if (!lastPage || lastPage.length < 10) {
        return undefined;
      }
      return allPages.length; // 다음 페이지 번호 (0, 1, 2...)
    },

    staleTime: 1000 * 60 * 1, // 검색 결과는 1분간 신선하다고 판단
  });
};
