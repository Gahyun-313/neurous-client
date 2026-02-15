/**
 * 회원 탈퇴 API 모듈
 *
 * 소셜 로그인 계정 연동 해제 및 서버 측 유저 데이터 삭제를 처리함.
 * 탈퇴 완료 후 클라이언트 로컬 데이터 삭제는 authService에서 담당.
 */
import client from './client';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 회원 탈퇴 요청 바디 타입
 *
 * 소셜 로그인 제공자별로 탈퇴 처리 방식이 다름:
 * - Google / Kakao / Naver: providerAccessToken 전달
 * - Apple: appleAuthorizationCode 전달
 * - 소셜 연동 해제 없이 탈퇴: unlinkSocial = false
 *
 * @property unlinkSocial            소셜 계정 연동 해제 여부
 * @property providerAccessToken     Google/Kakao/Naver 소셜 토큰 (선택)
 * @property appleAuthorizationCode  Apple 인증 코드 (선택)
 */
export interface WithdrawRequestBody {
  unlinkSocial: boolean;
  providerAccessToken?: string; // GOOGLE / KAKAO / NAVER
  appleAuthorizationCode?: string; // APPLE
}

/**
 * 회원 탈퇴 API 응답 타입
 *
 * @property status   HTTP 상태 코드
 * @property message  처리 결과 메시지
 * @property data     처리 결과 문자열 (예: "탈퇴 완료")
 */
export interface WithdrawResponse {
  status: number;
  message: string;
  data: string;
}

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 회원 탈퇴 API 호출
 *
 * [엔드포인트] DELETE /api/user/withdraw?userId={userId}
 *
 * [처리 순서]
 * 1. body의 undefined 필드를 null로 변환
 *    (undefined는 직렬화 시 필드 자체가 누락되어 서버가 인식 못할 수 있음)
 * 2. userId를 query string으로, 탈퇴 정보를 body에 담아 DELETE 요청
 * 3. 서버가 소셜 연동 해제 + 유저 데이터 삭제 처리
 *
 * ⚠️ 서버 측 처리만 담당함.
 *    로컬 AsyncStorage 토큰 삭제 및 로그인 화면 이동은
 *    authService의 탈퇴 처리 흐름에서 수행함.
 *
 * ⚠️ Axios의 DELETE 요청은 기본적으로 body를 무시하므로
 *    { data: requestBody } 옵션으로 명시적으로 전달해야 함.
 *
 * @param userId  탈퇴할 유저 ID
 * @param body    소셜 연동 해제 여부 및 제공자별 토큰/코드
 * @returns       탈퇴 처리 결과
 * @throws        네트워크 오류 또는 서버 에러 시 에러
 */
export const withdrawUser = async (
  userId: number,
  body: WithdrawRequestBody,
): Promise<WithdrawResponse> => {
  try {
    // undefined를 null로 변환해 서버가 필드 존재를 인식하도록 함
    const requestBody = {
      unlinkSocial: body.unlinkSocial,
      providerAccessToken:
        body.providerAccessToken !== undefined
          ? body.providerAccessToken
          : null,
      appleAuthorizationCode:
        body.appleAuthorizationCode !== undefined
          ? body.appleAuthorizationCode
          : null,
    };

    console.log('[회원탈퇴 API] 요청:', {
      userId,
      body: requestBody,
    });

    // DELETE 요청에 body를 포함하려면 Axios의 { data: ... } 옵션 사용
    const response = await client.delete<WithdrawResponse>(
      `/api/user/withdraw?userId=${userId}`,
      { data: requestBody },
    );

    console.log(
      '[회원탈퇴 API] 응답 성공:',
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error: any) {
    console.error('[회원탈퇴 API] 에러:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};
