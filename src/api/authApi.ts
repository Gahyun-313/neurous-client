/**
 * 인증 관련 API
 */
import client from './client';
import { SocialLoginProvider } from '../services/socialLoginService';

export interface LoginRequest {
  accessToken: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    userInfo?: {
      userId: number;
      name?: string;
      email?: string;
      profileImage?: string;
    };
    newUser?: boolean;
  };
  token?: string; // 하위 호환성
  refreshToken?: string; // 하위 호환성
  user?: {
    id: string;
    email?: string;
    name?: string;
    profileImage?: string;
  };
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  // data 래퍼가 있는 경우
  status?: number;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  // 직접 토큰이 오는 경우
  accessToken?: string;
  refreshToken?: string;
  // 하위 호환성을 위한 필드
  success?: boolean;
  token?: string;
}

/**
 * 소셜 로그인 API 호출
 * @param provider 소셜 로그인 제공자 (google, kakao, naver, apple) - URL 경로에 포함
 * @param loginData 로그인 데이터 (accessToken, email, name, profileImage 등) - Body에 포함
 */
export const loginWithProvider = async (
  provider: SocialLoginProvider,
  loginData: LoginRequest,
): Promise<LoginResponse> => {
  try {
    // Provider 및 요청 데이터 로그
    const response = await client.post<LoginResponse>(
      `/api/auth/login/${provider}`,
      loginData,
    );

    console.log(
      '[로그인 API] 응답 성공:',
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error: any) {
    console.error('로그인 API 에러:', error);

    // 탈퇴 후 재가입용 로그 추가
    console.error('[로그인 API] 서버 응답:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });


    throw error;
  }
};
/**
 * 토큰 갱신 API 호출
 * @param refreshTokenValue 갱신 토큰
 */
export const refreshToken = async (
  refreshTokenValue: string,
): Promise<RefreshTokenResponse> => {
  try {
    if (__DEV__) {
      console.log('[토큰 갱신 API] 요청 시작');
    }
    const response = await client.post<RefreshTokenResponse>(
      '/api/auth/refresh',
      { refreshToken: refreshTokenValue },
    );

    if (__DEV__) {
      console.log(
        '[토큰 갱신 API] 응답 성공:',
        JSON.stringify(response.data, null, 2),
      );
    }

    return response.data;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[토큰 갱신 API] 에러:', error);

      if (error.response) {
        console.error('[토큰 갱신 API] 서버 응답:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });

        // 500 에러에 대한 상세 정보
        if (error.response.status === 500) {
          console.error(
            '[토큰 갱신 API] 서버 내부 오류 (500) - 서버 측 문제입니다',
          );
        }
      } else if (error.request) {
        console.error(
          '[토큰 갱신 API] 네트워크 오류 - 서버에 연결할 수 없습니다',
        );
      }
    }
    throw error;
  }
};

/**
 * 서버 로그아웃 API 호출
 *
 * - 서버가 refreshToken 무효화/세션 정리 등을 할 수 있음
 * - 클라이언트는 로그아웃 시 로컬 토큰/유저정보도 함께 삭제해야 함(authService.logout에서 처리)
 *
 * @param userId 현재 로그인된 사용자 ID
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export const logoutFromServer = async (
  userId: number,
): Promise<LogoutResponse> => {
  try {
    // body는 없는 엔드포인트라 null로 보냄
    // query는 params로 전달
    const response = await client.post<LogoutResponse>(
      '/api/auth/logout',
      null,
      { params: { userId } },
    );

    if (__DEV__) {
      console.log(
        '[로그아웃 API] 응답 성공:',
        JSON.stringify(response.data, null, 2),
      );
    }

    return response.data;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[로그아웃 API] 에러:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
    }
    throw error;
  }
};
