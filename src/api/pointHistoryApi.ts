/**
 * 포인트/경험치 획득 내역 API 모듈
 *
 * 유저가 아티클 읽기, 퀴즈 제출 등으로 획득한
 * 포인트 및 경험치 내역을 조회하는 API 함수 정의
 */

import client from './client';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 보상 획득 내역 아이템 타입 (Swagger DTO 기준)
 *
 * @property historyId  내역 고유 ID
 * @property point      해당 내역에서 획득한 포인트
 * @property exp        해당 내역에서 획득한 경험치
 * @property reason     획득 사유 (예: "아티클 읽기 완료")
 * @property createdAt  획득 일시 (ISO 8601, 예: "2026-01-08T12:49:18.941Z")
 */
export interface PointHistoryDto {
  historyId: number;
  point: number;
  exp: number;
  reason: string;
  createdAt: string;
}

/**
 * 보상 획득 내역 API 응답 타입
 *
 * @property status   HTTP 상태 코드
 * @property message  안내 메시지
 * @property data     획득 내역 배열 (최신순)
 */
export interface PointHistoryApiResponse {
  status: number;
  message: string;
  data: PointHistoryDto[];
}

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 보상 획득 내역 조회
 *
 * [엔드포인트] GET /api/characters/history?userId={userId}
 *
 * 유저의 포인트 및 경험치 획득 이력 전체를 반환함.
 * 마이페이지 내역 화면에서 사용.
 *
 * @param userId  현재 로그인된 유저 ID
 * @returns       포인트/경험치 획득 내역 배열
 * @throws        네트워크 오류 또는 서버 에러 시 에러
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
