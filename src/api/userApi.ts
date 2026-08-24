/**
 * 유저 관련 API 모듈
 *
 * 마이페이지 조회, 관심분야/레벨 업데이트, 난이도 정보 조회,
 * 읽은 글 상세 조회 등 유저 정보 관련 서버 API 호출 함수 정의
 */
import client from './client';
import { InterestCategory } from '../types/interests';
import { LevelCategory } from '../types/interests';
import { ContentDetail } from './missionApi';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 관심분야 업데이트 요청 바디 타입
 *
 * @property interests  선택된 관심분야 목록 (순서 반영)
 */
export interface UpdateInterestRequest {
  interests: InterestCategory[];
}

/**
 * 업데이트 API 공통 응답 타입 (레벨/관심분야 업데이트 공통 사용)
 *
 * @property success  처리 성공 여부
 * @property message  안내 메시지 (선택)
 */
export interface UpdateResponse {
  success: boolean;
  message?: string;
}

/**
 * 마이페이지 - 콘텐츠 아이템 타입
 *
 * 유저가 읽은 글 목록의 요소 구조
 *
 * @property contentId     콘텐츠 고유 ID
 * @property title         글 제목
 * @property category      카테고리 이름
 * @property readAt        읽은 일시
 * @property isQuizCorrect 퀴즈 정답 여부
 */
export interface MyPageContent {
  contentId: number;
  title: string;
  category: string;
  readAt: string;
  isQuizCorrect: boolean;
}

/**
 * 마이페이지 데이터 타입
 *
 * @property profileImgUrl  프로필 이미지 URL
 * @property name           유저 이름
 * @property email          유저 이메일
 * @property interests      선택된 관심분야 목록
 * @property level          현재 레벨
 * @property weeklyCount    이번 주 읽은 글 수
 * @property contents       읽은 글 목록
 */
export interface MyPageData {
  profileImgUrl: string;
  name: string;
  email: string;
  interests: InterestCategory[];
  level: LevelCategory;
  weeklyCount: number;
  contents: MyPageContent[];
}

/**
 * 마이페이지 API 응답 타입
 *
 * @property status   HTTP 상태 코드
 * @property message  안내 메시지
 * @property data     마이페이지 데이터
 */
export interface MyPageResponse {
  status: number;
  message: string;
  data: MyPageData;
}

/**
 * 날짜별 읽은 글 그룹 타입
 *
 * 마이페이지에서 날짜별로 그룹핑된 읽은 글 목록
 *
 * @property date       날짜 (YYYY-MM-DD)
 * @property dayOfWeek  요일 한글 표기 (예: "수요일")
 * @property count      해당 날짜에 읽은 글 수
 * @property articles   해당 날짜의 읽은 글 목록
 */
export interface ReadArticlesByDate {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "수요일"
  count: number;
  articles: MyPageContent[];
}

/**
 * 난이도 정보 타입
 *
 * @property key         난이도 코드 (예: "EASY")
 * @property level       난이도 이름 (예: "쉬움")
 * @property description 난이도 설명
 * @property timeGuide   예상 읽기 시간 안내
 */
export interface DifficultyInfo {
  key: string;
  level: string;
  description: string;
  timeGuide: string;
}

/**
 * 난이도 정보 API 응답 타입
 *
 * @property status   HTTP 상태 코드
 * @property message  안내 메시지
 * @property data     난이도 정보
 */
export interface DifficultyInfoResponse {
  status: number;
  message: string;
  data: DifficultyInfo;
}

/**
 * 읽은 글 상세 정보 - Content 타입 (missionApi의 ContentDetail 재사용)
 */
export type ReadContentDetailContent = ContentDetail;

/**
 * 읽은 글 상세 정보 - 퀴즈 선택지 타입
 *
 * @property quizChoiceId  선택지 고유 ID
 * @property choiceNo      선택지 번호
 * @property choiceText    선택지 텍스트
 */
export interface QuizChoice {
  quizChoiceId: number;
  choiceNo: number;
  choiceText: string;
}

/**
 * 읽은 글 상세 정보 - 퀴즈 풀이 내역 타입
 *
 * 유저가 이미 풀었던 퀴즈 데이터를 포함함.
 *
 * @property quizId          퀴즈 고유 ID
 * @property contentId       연결된 콘텐츠 ID
 * @property quizContent     퀴즈 질문 텍스트
 * @property choices         선택지 배열
 * @property selectedNo      유저가 선택한 답안 번호
 * @property correctChoiceNo 정답 번호
 * @property correct         정답 여부
 * @property solvedAt        풀이 일시 (ISO 8601, 예: "2026-01-02T07:29:23.532Z")
 */
export interface ReadContentDetailQuiz {
  quizId: number;
  contentId: number;
  quizContent: string; // 질문
  choices: QuizChoice[];
  selectedNo: number; // 선택한 답안 번호
  correctChoiceNo: number; // 정답 번호
  correct: boolean; // 정답 여부
  solvedAt: string; // "2026-01-02T07:29:23.532Z"
}

/**
 * 읽은 글 상세 정보 타입
 *
 * @property content  글 상세 데이터
 * @property quiz     퀴즈 풀이 내역 (퀴즈를 풀지 않았으면 undefined)
 */
export interface ReadContentDetail {
  content: ReadContentDetailContent;
  quiz?: ReadContentDetailQuiz;
}

/**
 * 읽은 글 상세 조회 API 응답 타입
 */
export interface ReadContentDetailResponse {
  status: number;
  message: string;
  data: ReadContentDetail;
}

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 유저 레벨 업데이트
 *
 * [엔드포인트] PATCH /api/user/update/level?userId={userId}
 *
 * 온보딩 또는 마이페이지에서 유저가 선택한 레벨을 서버에 저장함.
 *
 * @param userId  현재 로그인된 유저 ID
 * @param level   선택한 레벨 (LevelCategory)
 * @returns       업데이트 성공 여부
 * @throws        네트워크 오류 또는 서버 에러 시 에러
 */
export const updateUserLevel = async (
  userId: number,
  level: LevelCategory,
): Promise<UpdateResponse> => {
  try {
    const response = await client.patch<UpdateResponse>(
      `/api/user/update/level?userId=${userId}`,
      { level },
    );
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * 유저 관심분야 업데이트
 *
 * [엔드포인트] PATCH /api/user/update/interest?userId={userId}
 *
 * 온보딩 또는 마이페이지에서 유저가 선택한 관심분야를 서버에 저장함.
 * 콘텐츠 추천 알고리즘에 반영됨.
 *
 * @param userId     현재 로그인된 유저 ID
 * @param interests  선택된 관심분야 목록 (순서 반영)
 * @returns          업데이트 성공 여부
 * @throws           네트워크 오류 또는 서버 에러 시 에러
 */
export const updateUserInterests = async (
  userId: number,
  interests: InterestCategory[],
): Promise<UpdateResponse> => {
  try {
    const response = await client.patch<UpdateResponse>(
      `/api/user/update/interest?userId=${userId}`,
      { interests },
    );
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    console.error('[관심분야 업데이트 API] 에러:', error);
    if (error.response) {
      console.error('[관심분야 업데이트 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 마이페이지 정보 조회
 *
 * [엔드포인트] GET /api/mypage?date={startDate}
 *
 * 유저 프로필, 관심분야, 레벨, 주간 읽기 수, 읽은 글 목록을 반환함.
 * date 파라미터는 읽은 글 목록의 기준 시작 날짜.
 *
 * @param startDate  조회 기준 시작 날짜 (YYYY-MM-DD)
 * @returns          마이페이지 전체 데이터
 * @throws           네트워크 오류 또는 서버 에러 시 에러
 */
export const fetchMyPage = async (
  startDate: string,
): Promise<MyPageResponse> => {
  try {
    console.log('[마이페이지 API] 요청 시작');

    const response = await client.get<MyPageResponse>(
      `/api/mypage?date=${startDate}`,
    );

    console.log(
      '[마이페이지 API] 응답 성공:',
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error: any) {
    console.error('[마이페이지 API] 에러:', error);
    if (error.response) {
      console.error('[마이페이지 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 난이도 정보 조회
 *
 * [엔드포인트] GET /api/levels/:level
 *
 * 특정 레벨의 설명, 읽기 시간 가이드 등 메타 정보를 조회함.
 * 온보딩 레벨 선택 화면이나 설정 화면에서 사용.
 *
 * @param level  조회할 레벨 (LevelCategory)
 * @returns      해당 레벨의 난이도 정보
 * @throws       네트워크 오류 또는 서버 에러 시 에러
 */
export const fetchDifficultyInfo = async (
  level: LevelCategory,
): Promise<DifficultyInfoResponse> => {
  try {
    const response = await client.get<DifficultyInfoResponse>(
      `/api/levels/${level}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[난이도 정보 API] 에러:', error);
    if (error.response) {
      console.error('[난이도 정보 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 읽은 글 상세 정보 조회
 *
 * [엔드포인트] GET /api/content/:contentId/read?userId={userId}
 *
 * 유저가 이미 읽은 글의 상세 내용과 퀴즈 풀이 내역을 함께 반환함.
 * 마이페이지에서 읽은 글 목록 클릭 시 호출.
 *
 * @param userId     현재 로그인된 유저 ID
 * @param contentId  조회할 콘텐츠 ID
 * @returns          글 상세 + 퀴즈 풀이 내역 (퀴즈 미풀이 시 quiz는 undefined)
 * @throws           네트워크 오류 또는 서버 에러 시 에러
 */
export const fetchReadContentDetail = async (
  userId: number,
  contentId: number,
): Promise<ReadContentDetailResponse> => {
  try {
    const response = await client.get<ReadContentDetailResponse>(
      `/api/content/${contentId}/read?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[읽은 글 상세 API] 에러:', error);
    if (error.response) {
      console.error('[읽은 글 상세 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};
