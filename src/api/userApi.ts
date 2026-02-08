/**
 * 사용자 관련 API
 */
import client from './client';
import { InterestCategory } from '../types/interests';
import { LevelCategory } from '../types/interests';

export interface UpdateInterestRequest {
  interests: InterestCategory[];
}

export interface UpdateResponse {
  success: boolean;
  message?: string;
}

/**
 * 마이페이지 콘텐츠 정보
 */
export interface MyPageContent {
  contentId: number;
  title: string;
  category: string;
  readAt: string;
  isQuizCorrect: boolean;
}

/**
 * 마이페이지 데이터
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
 */
export interface MyPageResponse {
  status: number;
  message: string;
  data: MyPageData;
}

/**
 * 읽은 글 데이터
 */
export interface ReadArticlesByDate {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "수요일"
  count: number;
  articles: MyPageContent[];
}
export interface DifficultyInfo {
  key: string;
  level: string;
  description: string;
  timeGuide: string;
}
export interface DifficultyInfoResponse {
  status: number;
  message: string;
  data: DifficultyInfo;
}

/**
 * 관심분야 업데이트 API 호출
 * @param userId 사용자 ID (query parameter)
 * @param interests 선택된 관심분야 목록 (순서대로)
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
 * @returns Promise<MyPageResponse>
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

import { ContentDetail } from './missionApi';

/**
 * 읽은 글 상세 정보 - Content (missionApi의 ContentDetail 재사용)
 */
export type ReadContentDetailContent = ContentDetail;

/**
 * 읽은 글 상세 정보 - Quiz Choice
 */
export interface QuizChoice {
  quizChoiceId: number;
  choiceNo: number;
  choiceText: string;
}

/**
 * 읽은 글 상세 정보 - Quiz
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
 * 읽은 글 상세 정보
 */
export interface ReadContentDetail {
  content: ReadContentDetailContent;
  quiz?: ReadContentDetailQuiz;
}

/**
 * 읽은 글 상세 정보 API 응답
 */
export interface ReadContentDetailResponse {
  status: number;
  message: string;
  data: ReadContentDetail;
}

/**
 * 읽은 글 상세 정보 조회
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<ReadContentDetailResponse>
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
