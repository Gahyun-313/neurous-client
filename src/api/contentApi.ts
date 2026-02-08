import client from './client';
import { getUserInfo } from '../services/authService';

export interface ContentResponse {
  contentId: number;
  title: string;
  categoryName: string;
  imgUrl: string;
  hits: number;
  readingTime: number;
  publishedDate: string;
}

/**
 * 탐색 응답 (page/size 기반)
 * - 서버가 Spring Page(content/number/last/totalPages)로 내려줄 수도 있고
 * - 기존처럼 contents로 내려줄 수도 있어 둘 다 매핑해서 통일 반환
 */
export interface ExploreResponse {
  contents: ContentResponse[];

  // paging meta
  page: number; // 0-base
  size: number;
  totalPages?: number;
  last?: boolean;
  totalElements?: number;

  // 구버전 필드(남아있을 수도 있어 optional)
  nextBatchTime?: string | null;
  updatedContent?: boolean;
}

/** [GET] 탐색 목록 조회 */
export const fetchExploreContents = async (params: {
  category?: string;
  page?: number;
  size?: number;
}): Promise<ExploreResponse> => {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      console.warn('[API Fetch] 사용자 정보 없음 - 로그인이 필요합니다.');
      throw new Error('사용자 정보가 없습니다');
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;

    const url = params.category
      ? `/api/content/explore/${params.category}`
      : '/api/content/explore';

    console.log(
      `[API Request] URL: ${url} | page: ${page} | size: ${size} | Category: ${
        params.category || '전체'
      }`,
    );

    const response = await client.get<any>(url, {
      params: {
        userId: userInfo.userId,
        page,
        size,
      },
    });

    // data 래핑/비래핑 모두 대응
    const raw = response.data?.data ?? response.data;

    // 리스트 필드: contents(구형) / content(Spring Page)
    const list: ContentResponse[] = (raw?.contents ??
      raw?.content ??
      []) as any;

    // 페이지 필드: page(커스텀) / number(Spring Page)
    const mapped: ExploreResponse = {
      contents: list,
      page: (raw?.page ?? raw?.number ?? page) as number,
      size: (raw?.size ?? size) as number,
      totalPages: raw?.totalPages,
      last: raw?.last,
      totalElements: raw?.totalElements,

      // 혹시 남아있으면 보존
      nextBatchTime: raw?.nextBatchTime ?? null,
      updatedContent: raw?.updatedContent ?? undefined,
    };

    console.log('[API Response Success]:', {
      contentCount: mapped.contents?.length,
      firstItem: mapped.contents?.[0],
      page: mapped.page,
      size: mapped.size,
      totalPages: mapped.totalPages,
      last: mapped.last,
    });

    return mapped;
  } catch (error: any) {
    console.error('[API Response Error]:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      config: error.config?.url,
    });
    throw error;
  }
};
