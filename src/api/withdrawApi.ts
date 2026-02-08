/**
 * 회원 탈퇴 관련 API
 */
import client from './client';

export interface WithdrawRequestBody {
  unlinkSocial: boolean;
  providerAccessToken?: string; // GOOGLE/KAKAO/NAVER
  appleAuthorizationCode?: string; // APPLE
}

export interface WithdrawResponse {
  status: number;
  message: string;
  data: string;
}

/**
 * 회원 탈퇴 API 호출
 * DELETE /api/user/withdraw?userId=...
 *
 * @param userId 사용자 ID (query parameter)
 * @param body unlinkSocial / providerAccessToken / appleAuthorizationCode
 */
export const withdrawUser = async (
  userId: number,
  body: WithdrawRequestBody,
): Promise<WithdrawResponse> => {
  try {
    // undefined 값을 null로 변환하여 요청에 포함
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
