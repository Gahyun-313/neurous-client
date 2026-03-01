/**
 * 콘텐츠 탐색 API 모듈
 *
 * 탐색 화면의 콘텐츠 목록 조회를 담당함.
 * 서버 응답이 Spring Page 형식과 커스텀 형식 두 가지로 올 수 있어
 * 두 구조를 통일된 ExploreResponse 형태로 매핑해 반환함.
 */
import client from './client';
import { getUserInfo } from '../services/authService';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 콘텐츠 목록 아이템 타입
 *
 * 탐색(ExploreResponse.contents) 배열의 요소 구조
 *
 * @property contentId     콘텐츠 고유 ID
 * @property title         글 제목
 * @property categoryName  카테고리 이름 (예: "경제")
 * @property imgUrl        썸네일 이미지 URL
 * @property hits          조회수
 * @property readingTime   예상 읽기 시간 (분)
 * @property publishedDate 발행일
 */
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
 * 탐색 목록 API 응답 타입 (page/size 기반 페이지네이션)
 *
 * 서버 응답 구조가 두 가지 형태로 올 수 있어 모두 허용함:
 * - Spring Page 형식: content / number / last / totalPages
 * - 커스텀 형식: contents / page
 *
 * → fetchExploreContents 내부에서 두 형식을 통일된 구조로 매핑함.
 *
 * @property contents       콘텐츠 목록 (매핑 후 통일 필드명)
 * @property page           현재 페이지 번호 (0-base)
 * @property size           페이지당 항목 수
 * @property totalPages     전체 페이지 수 (선택)
 * @property last           마지막 페이지 여부 (선택)
 * @property totalElements  전체 항목 수 (선택)
 * @property nextBatchTime  [구버전] 다음 배치 시간 (선택)
 * @property updatedContent [구버전] 콘텐츠 업데이트 여부 (선택)
 */
export interface ExploreResponse {
  contents: ContentResponse[];

  // paging meta
  page: number; // 0-base
  size: number;
  totalPages?: number;
  last?: boolean;
  totalElements?: number;

  // 구버전 필드 (남아있을 수도 있어 optional)
  nextBatchTime?: string | null;
  updatedContent?: boolean;
}

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 탐색 목록 조회
 *
 * [엔드포인트]
 * - 전체:     GET /api/content/explore
 * - 카테고리: GET /api/content/explore/:category
 *
 * [처리 순서]
 * 1. AsyncStorage에서 userId 조회
 * 2. category 유무에 따라 URL 분기
 * 3. 서버 응답의 data 래퍼 유무 및
 *    Spring Page / 커스텀 필드 차이를 통일된 ExploreResponse로 매핑
 *
 * [필드 매핑 규칙]
 * - 리스트: contents(커스텀) / content(Spring Page) → contents
 * - 페이지: page(커스텀) / number(Spring Page) → page
 *
 * @param params.category  카테고리 코드 (없으면 전체 조회)
 * @param params.page      페이지 번호 (0-base, 기본값: 0)
 * @param params.size      페이지당 항목 수 (기본값: 10)
 * @returns                매핑된 콘텐츠 목록 및 페이지 메타
 * @throws                 유저 정보 없음 / 네트워크 오류 시 에러
 */
export const fetchExploreContents = async (params: {
  category?: string;
  page?: number;
  size?: number;
}): Promise<ExploreResponse> => {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      console.warn('[API Fetch] 사용자 정보 없음 - 로그인이 필요함');
      throw new Error('사용자 정보가 없음');
    }

    const page = params.page ?? 0;
    const size = params.size ?? 10;

    // category가 있으면 경로에 포함, 없으면 전체 탐색 URL 사용
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

    // data 래퍼 유무 모두 대응
    const raw = response.data?.data ?? response.data;

    // 리스트 필드: contents(커스텀) / content(Spring Page)
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

      // 구버전 필드 — 값이 있으면 보존, 없으면 기본값
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
