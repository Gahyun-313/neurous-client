/**
 * 미션 관련 API 함수
 */

import client from './client';
import { getUserInfo } from '../services/authService';
import { getImageUrl } from '../utils/imageUtils';

/**
 * 오늘의 미션 화면 컨텐츠
 */
export interface MissionContent {
  contentId: number;
  contentTile: string;
  contentImg: string;
  contentCategory: string;
  contentDate: string;
}

/**
 * 오늘의 미션
 */
export interface MissionToday {
  missionType: string;
  title: string;
  currentProgress: number;
  targetGoal: number;
  isCompleted: boolean;
  isLocked: boolean;
}

/**
 * 오늘의 미션 화면 응답
 */
export interface MissionTodayResponse {
  contents: MissionContent[];
  missions: MissionToday[];
}

/**
 * 오늘의 미션 화면 API 응답
 */
export interface MissionTodayApiResponse {
  status: number;
  message: string;
  data: MissionTodayResponse;
}

/**
 * 오늘의 미션 화면 조회
 * @param userId 사용자 ID (query parameter)
 * @returns Promise<MissionTodayApiResponse>
 */
export const fetchMissionToday = async (
  userId: number,
): Promise<MissionTodayApiResponse> => {
  try {
    const response = await client.get<MissionTodayApiResponse>(
      `/api/mission/today?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[오늘의 미션 API] 에러:', error);
    if (error.response) {
      console.error('[오늘의 미션 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * MissionToday를 Mission으로 변환
 */
export const convertMissionTodayToMission = (
  missionToday: MissionToday,
  index: number,
): any => {
  return {
    id: index + 1, // 임시 ID (missionType을 기반으로 할 수도 있음)
    title: missionToday.title,
    current: missionToday.currentProgress,
    total: missionToday.targetGoal,
    status: missionToday.isCompleted
      ? '완료'
      : missionToday.isLocked
      ? null
      : '진행 중',
  };
};

/**
 * MissionContent를 ArticleCard가 사용할 수 있는 형식으로 변환
 * contentId는 URL에서 추출하거나 임시로 인덱스 사용
 */
export const convertMissionContentToArticle = (
  content: MissionContent,
  index: number,
): {
  id: number;
  title: string;
  category: string;
  readTime: string;
  date: string;
  imageUrl: string;
  contentId: number;
} => {
  const categoryMap: Record<string, string> = {
    LIFE_CULTURE: '생활/문화',
    SOCIETY: '사회',
    ECONOMY: '경제',
    POLITICS: '정치',
    IT_SCIENCE: 'IT/과학',
    WORLD: '세계',
  };

  return {
    id: index, // 임시 ID
    title: content.contentTile,
    category: categoryMap[content.contentCategory] || content.contentCategory,
    readTime: '5분', // 기본값 (실제 읽기 시간이 있다면 사용)
    date: content.contentDate,
    imageUrl: getImageUrl(content.contentImg),
    contentId: content.contentId,
  };
};

/**
 * 오늘의 미션 목록 조회 (기존 - 하위 호환성 유지)
 * @returns Promise<Mission[]>
 */
export const fetchMissions = async (): Promise<any[]> => {
  // 서버 API 호출 시도
  try {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      throw new Error('사용자 정보가 없습니다');
    }

    const response = await client.get<any[]>(
      `/api/content/today/userId=${userInfo.userId}`,
    );
    return response.data;
  } catch (error) {
    console.error('미션 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 미션 조회
 * @param missionId 미션 ID
 * @returns Promise<Mission | null>
 */
export const fetchMissionById = async (
  missionId: number,
): Promise<any | null> => {
  try {
    // 서버 API 호출
    const response = await client.get<any>(`/missions/${missionId}`);
    return response.data;
  } catch (error) {
    console.error('미션 조회 실패:', error);
    return null;
  }
};

/**
 * 미션 진행도 업데이트
 */
export const updateMissionProgress = async (
  _missionId: number,
  _current: number,
): Promise<any> => {
  // TODO: 미션 진행도 업데이트 API 구현
  throw new Error('Not implemented');
  // try {
  //   // 서버 API 호출
  //   const response = await client.patch<Mission>(`/missions/${missionId}`, {
  //     current,
  //   });
  //   return response.data;
  // } catch (error) {
  //   console.error('미션 진행도 업데이트 실패, 더미 데이터 사용:', error);
  //   // 서버 연결 실패 시 자동으로 더미 데이터 반환
  //   await delay(200);
  //   const mission = mockMissions.find(m => m.id === missionId);
  //   if (!mission) {
  //     throw new Error('Mission not found');
  //   }
  //   const updatedMission = { ...mission, current };
  //   return updatedMission;
  // }
};

/**
 * 글 상세 정보 - Content
 */
export interface ContentDetail {
  contentId: number;
  title: string;
  content: string;
  contentCategory: string;
  categoryName: string;
  contentDate: string;
  hits: number;
  imageUrl: string;
}

/**
 * 글 상세 정보 API 응답
 */
export interface ContentDetailResponse {
  status: number;
  message: string;
  data: ContentDetail;
}

/**
 * 글 상세 정보 조회
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<ContentDetailResponse>
 */
export const fetchContentDetail = async (
  userId: number,
  contentId: number,
): Promise<ContentDetailResponse> => {
  try {
    console.log(
      `[글 상세 API] 요청: /api/content/${contentId}?userId=${userId}`,
    );

    const response = await client.get<ContentDetailResponse>(
      `/api/content/${contentId}?userId=${userId}`,
    );
    
    // 이미지 URL 변환
    if (response.data.data?.imageUrl) {
      response.data.data.imageUrl = getImageUrl(response.data.data.imageUrl);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[글 상세 API] 에러:', error);
    if (error.response) {
      console.error('[글 상세 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 글 접근 권한 확인 응답
 */
export interface ContentAccessResponse {
  accessType: string; // "POINT_USE" 등
  title: string;
  message: string;
  currentPoints: number;
  requiredPoints: number;
  lackOfPoints: number;
  rewardPoints: number;
  readable: boolean;
}

/**
 * 글 접근 권한 확인 API 응답
 */
export interface ContentAccessApiResponse {
  status: number;
  message: string;
  data: ContentAccessResponse;
}

/**
 * 글 접근 권한 확인
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<ContentAccessApiResponse>
 */
export const fetchContentAccess = async (
  userId: number,
  contentId: number,
): Promise<ContentAccessApiResponse> => {
  try {
    const response = await client.get<ContentAccessApiResponse>(
      `/api/content/${contentId}/access?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[글 접근 권한 API] 에러:', error);
    if (error.response) {
      console.error('[글 접근 권한 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 포인트로 컨텐츠 구매 API 응답
 */
export interface PurchaseContentResponse {
  status: number;
  message: string;
  data: string;
}

/**
 * 포인트로 컨텐츠 구매
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<PurchaseContentResponse>
 */
export const purchaseContentWithPoint = async (
  userId: number,
  contentId: number,
): Promise<PurchaseContentResponse> => {
  try {
    const response = await client.post<PurchaseContentResponse>(
      `/api/content/${contentId}/purchase/point?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[포인트 구매 API] 에러:', error);
    if (error.response) {
      console.error('[포인트 구매 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 광고 시청으로 컨텐츠 구매
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<PurchaseContentResponse>
 */
export const purchaseContentWithAd = async (
  userId: number,
  contentId: number,
): Promise<PurchaseContentResponse> => {
  try {
    const response = await client.post<PurchaseContentResponse>(
      `/api/content/${contentId}/purchase/ad?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[광고 구매 API] 에러:', error);
    if (error.response) {
      console.error('[광고 구매 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 완독 여부 체크 - LevelUpInfo
 */
export interface LevelUpInfo {
  title: string;
  message: string;
  profileUrl: string;
  levelCode: string;
  characterName: string;
}

/**
 * 완독 여부 체크 응답
 */
export interface ReadStatusResponse {
  levelUpInfo?: LevelUpInfo;
  completed: boolean;
  levelUp: boolean;
}

/**
 * 완독 여부 체크 API 응답
 */
export interface ReadStatusApiResponse {
  status: number;
  message: string;
  data: ReadStatusResponse;
}

/**
 * 완독 여부 체크
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @param staySeconds 체류 시간 (초)
 * @param isCompleted 완독 여부
 * @returns Promise<ReadStatusApiResponse>
 */
export const checkReadStatus = async (
  userId: number,
  contentId: number,
  staySeconds: number,
  isCompleted: boolean,
): Promise<ReadStatusApiResponse> => {
  try {
    const response = await client.post<ReadStatusApiResponse>(
      `/api/content/${contentId}/read-status?userId=${userId}`,
      {
        staySeconds,
        isCompleted,
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('[완독 체크 API] 에러:', error);
    if (error.response) {
      console.error('[완독 체크 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 난이도 전송 API 응답
 */
export interface SubmitDifficultyResponse {
  status: number;
  message: string;
  data: string;
}

/**
 * 난이도 전송
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @param difficulty 난이도 (EASY, MEDIUM, HARD) (query parameter)
 * @returns Promise<SubmitDifficultyResponse>
 */
export const submitDifficulty = async (
  userId: number,
  contentId: number,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
): Promise<SubmitDifficultyResponse> => {
  try {
    const response = await client.post<SubmitDifficultyResponse>(
      `/api/content/${contentId}/difficulty?userId=${userId}&difficulty=${difficulty}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[난이도 전송 API] 에러:', error);
    if (error.response) {
      console.error('[난이도 전송 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 퀴즈 조회 - Content
 */
export interface QuizContent {
  contentId: number;
  title: string;
  content: string;
  contentDate: string;
  contentCategory: string;
  contentLevel: string;
  imageUrl: string;
  batchTime: string;
  hits: number;
}

/**
 * 퀴즈 조회 - Choice
 */
export interface QuizChoice {
  quizChoiceId: number;
  choiceNo: number;
  choiceText: string;
  quiz: string;
  correct: boolean;
}

/**
 * 퀴즈 조회 응답
 */
export interface QuizResponse {
  quizId: number;
  quizNum: number;
  content: QuizContent;
  quizContent: string; // question -> quizContent로 수정
  quizDiff: string;
  quizCategory: string;
  choices: QuizChoice[];
}

/**
 * 퀴즈 조회 API 응답
 */
export interface QuizApiResponse {
  status: number;
  message: string;
  data: QuizResponse;
}

/**
 * 퀴즈 조회
 * @param userId 사용자 ID (query parameter)
 * @param contentId 컨텐츠 ID (path parameter)
 * @returns Promise<QuizApiResponse>
 */
export const fetchQuiz = async (
  userId: number,
  contentId: number,
): Promise<QuizApiResponse> => {
  try {
    const response = await client.get<QuizApiResponse>(
      `/api/quiz/${contentId}?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[퀴즈 조회 API] 에러:', error);
    if (error.response) {
      console.error('[퀴즈 조회 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

/**
 * 퀴즈 제출 - Request Body
 */
export interface SubmitQuizRequest {
  quizId: number;
  selectedNo: number;
  readContentId: number;
}

/**
 * 퀴즈 제출 - Quiz Result Response
 */
export interface QuizResultResponse {
  quizId: number;
  selectedNo: number;
  isAnswerCorrect: boolean;
  correctChoiceNo: number;
  correctChoiceText: string;
}

/**
 * 퀴즈 제출 - Reward Response
 */
export interface RewardResponse {
  earnedPoint: number;
  earnedExp: number;
}

/**
 * 퀴즈 제출 - User Level Information
 */
export interface UserLevelInformation {
  title: string;
  message: string;
  profileUrl: string;
  levelCode: string;
  characterName: string;
}

/**
 * 퀴즈 제출 - Data Response
 */
export interface SubmitQuizData {
  quizResultResponse: QuizResultResponse;
  rewardResponse: RewardResponse;
  userLevelInformation?: UserLevelInformation;
}

/**
 * 퀴즈 제출 - API Response
 */
export interface SubmitQuizApiResponse {
  status: number;
  message: string;
  data: SubmitQuizData;
}

/**
 * 퀴즈 정답 제출
 * @param userId 사용자 ID (query parameter)
 * @param requestBody 퀴즈 제출 요청 데이터
 * @returns Promise<SubmitQuizApiResponse>
 */
export const submitQuiz = async (
  userId: number,
  requestBody: SubmitQuizRequest,
): Promise<SubmitQuizApiResponse> => {
  try {
    const response = await client.post<SubmitQuizApiResponse>(
      `/api/quiz/submit?userId=${userId}`,
      requestBody,
    );
    return response.data;
  } catch (error: any) {
    console.error('[퀴즈 제출 API] 에러:', error);
    if (error.response) {
      console.error('[퀴즈 제출 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};
