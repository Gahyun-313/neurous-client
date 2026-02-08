/**
 * 포인트/경험치 히스토리 관련 API 함수
 */

import client from './client';

/**
 * 보상 획득 내역 (Swagger DTO)
 */
export interface PointHistoryDto {
  historyId: number;
  point: number;
  exp: number;
  reason: string;
  createdAt: string; // "2026-01-08T12:49:18.941Z"
}

/**
 * 보상 획득 내역 API 응답
 */
export interface PointHistoryApiResponse {
  status: number;
  message: string;
  data: PointHistoryDto[];
}

/**
 * 보상 획득 내역 조회
 * GET /api/characters/history?userId=...
 * @param userId 사용자 ID (query parameter)
 */
export const fetchPointHistory = async (
  userId: number,
): Promise<PointHistoryApiResponse> => {
  try {
    const response = await client.get<PointHistoryApiResponse>(
      `/api/characters/history?userId=${userId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('[보상 획득 내역 API] 에러:', error);
    if (error.response) {
      console.error('[보상 획득 내역 API] 서버 응답:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};
