/**
 * 인증 관련 API 모듈
 *
 * 소셜 로그인, 토큰 갱신, 로그아웃 등 인증에 필요한
 * 모든 서버 API 호출 함수 정의
 *
 * [흐름 요약]
 * 소셜 로그인 → loginWithProvider → 서버에서 JWT 발급
 * 토큰 만료   → refreshToken     → 새 accessToken 재발급
 * 로그아웃    → logoutFromServer → 서버 측 refreshToken 무효화
 */
import client from './client';
import { SocialLoginProvider } from '../services/socialLoginService';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 소셜 로그인 요청 바디 타입
 *
 * 소셜 로그인 제공자(Google, Kakao 등)로부터 받은 정보를
 * 서버로 전달할 때 사용함
 *
 * @property accessToken   소셜 로그인 제공자에서 발급한 액세스 토큰 (필수)
 * @property email         사용자 이메일 (제공자가 지원할 경우 전달)
 * @property name          사용자 이름 (제공자가 지원할 경우 전달)
 * @property profileImage  사용자 프로필 이미지 URL (제공자가 지원할 경우 전달)
 */
export interface LoginRequest {
  accessToken: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

/**
 * 소셜 로그인 응답 타입
 *
 * 서버 응답 구조가 여러 버전에 걸쳐 변경될 수 있어
 * data 래퍼 방식과 직접 반환 방식을 모두 허용함
 *
 * [권장 응답 구조] data 래퍼 방식
 * {
 *   success: true,
 *   data: {
 *     accessToken, refreshToken, userInfo, newUser
 *   }
 * }
 *
 * @property success        요청 성공 여부
 * @property data           서버 응답 데이터 (권장 구조)
 * @property data.accessToken   발급된 JWT 액세스 토큰
 * @property data.refreshToken  발급된 JWT 리프레시 토큰
 * @property data.userInfo      로그인한 사용자 정보
 * @property data.newUser       최초 가입 여부 (true면 신규 유저 → 온보딩 화면으로 이동)
 * @property token          [하위 호환] 구버전 서버가 직접 반환하는 토큰
 * @property refreshToken   [하위 호환] 구버전 서버가 직접 반환하는 리프레시 토큰
 * @property user           [하위 호환] 구버전 서버가 직접 반환하는 유저 정보
 * @property message        에러 메시지 또는 안내 문구
 */
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
    newUser?: boolean; // true: 신규 가입 유저 → 온보딩 처리 필요
  };
  token?: string; // 하위 호환성 (구버전 서버 응답)
  refreshToken?: string; // 하위 호환성 (구버전 서버 응답)
  user?: {
    id: string;
    email?: string;
    name?: string;
    profileImage?: string;
  };
  message?: string;
}

/**
 * 토큰 갱신 요청 바디 타입
 *
 * @property refreshToken  현재 저장된 리프레시 토큰
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 토큰 갱신 응답 타입
 *
 * 서버 응답 구조가 두 가지 형태로 올 수 있어 모두 허용함
 *
 * [형태 1] data 래퍼 방식 (권장)
 * { status: 200, data: { accessToken, refreshToken } }
 *
 * [형태 2] 직접 반환 방식
 * { accessToken, refreshToken }
 *
 * → client.ts의 Axios 인터셉터에서 두 형태 모두 처리함
 *
 * @property status         HTTP 상태 코드 (data 래퍼 방식)
 * @property message        에러 메시지 또는 안내 문구
 * @property data           갱신된 토큰 데이터 (data 래퍼 방식)
 * @property accessToken    갱신된 액세스 토큰 (직접 반환 방식)
 * @property refreshToken   갱신된 리프레시 토큰 (직접 반환 방식)
 * @property success        [하위 호환] 성공 여부
 * @property token          [하위 호환] 구버전 서버가 반환하는 토큰 필드명
 */
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

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 소셜 로그인 API 호출
 *
 * [엔드포인트] POST /api/auth/login/:provider
 *
 * [처리 순서]
 * 1. 소셜 SDK로 받은 accessToken 및 유저 정보를 body에 담아 전송
 * 2. 서버가 소셜 토큰을 검증하고 자체 JWT(accessToken + refreshToken) 발급
 * 3. 응답의 newUser 값에 따라 온보딩 여부 결정
 *
 * @param provider  소셜 로그인 제공자 — URL 경로에 삽입됨
 *                  예: 'google' → /api/auth/login/google
 * @param loginData 소셜 SDK에서 받은 토큰 및 유저 정보 — Request Body로 전송
 * @returns         서버 발급 JWT 토큰 및 유저 정보 포함 응답
 * @throws          네트워크 오류 또는 서버 인증 실패 시 에러
 */
export const loginWithProvider = async (
  provider: SocialLoginProvider,
  loginData: LoginRequest,
): Promise<LoginResponse> => {
  try {
    const response = await client.post<LoginResponse>(
      `/api/auth/login/${provider}`, // provider가 URL 경로에 삽입됨 (e.g. /google, /kakao)
      loginData, // 소셜 토큰 + 유저 정보를 body로 전송
    );

    console.log(
      '[로그인 API] 응답 성공:',
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error: any) {
    console.error('로그인 API 에러:', error);

    // 탈퇴 후 재가입 등 예외 상황 디버깅용 상세 로그
    // (status 401: 이미 탈퇴한 계정, 403: 접근 거부 등)
    console.error('[로그인 API] 서버 응답:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });

    // 에러를 그대로 상위(authService)로 전파해 처리 위임
    throw error;
  }
};

/**
 * 토큰 갱신 API 호출
 *
 * [엔드포인트] POST /api/auth/refresh
 *
 * [처리 순서]
 * 1. 저장된 refreshToken을 body에 담아 전송
 * 2. 서버가 refreshToken 유효성 검증 후 새 토큰 쌍 발급
 * 3. 응답에서 새 accessToken + refreshToken 추출해 저장
 *
 * ⚠️ 주로 client.ts의 Axios 인터셉터에서 자동 호출됨
 *    accessToken 만료(401) 감지 → 이 함수 자동 실행 → 원래 요청 재시도
 *
 * @param refreshTokenValue  AsyncStorage에 저장된 리프레시 토큰
 * @returns                  새로 발급된 accessToken + refreshToken 포함 응답
 * @throws                   refreshToken 만료/유효하지 않은 경우 에러 (→ 로그아웃 처리)
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
      { refreshToken: refreshTokenValue }, // refreshToken을 body로 전송
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
        // 서버가 응답을 반환한 경우 (4xx, 5xx)
        console.error('[토큰 갱신 API] 서버 응답:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });

        // 500: 서버 내부 오류 → 서버 팀에 문의 필요
        if (error.response.status === 500) {
          console.error(
            '[토큰 갱신 API] 서버 내부 오류 (500) - 서버 측 문제임',
          );
        }
      } else if (error.request) {
        // 요청은 전송됐지만 서버에서 응답이 없는 경우 (네트워크 단절 등)
        console.error('[토큰 갱신 API] 네트워크 오류 - 서버에 연결할 수 없음');
      }
    }

    // 에러를 상위(client.ts 인터셉터)로 전파
    // → 인터셉터에서 refreshToken 만료로 판단 시 자동 로그아웃 처리
    throw error;
  }
};

/**
 * 로그아웃 응답 타입
 *
 * @property success  로그아웃 성공 여부
 * @property message  안내 메시지 (선택)
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

/**
 * 서버 로그아웃 API 호출
 *
 * [엔드포인트] POST /api/auth/logout?userId={userId}
 *
 * [처리 순서]
 * 1. 서버에 userId를 query string으로 전달
 * 2. 서버가 해당 유저의 refreshToken을 무효화 (DB/Redis에서 삭제)
 * 3. 클라이언트는 로컬에 저장된 토큰 및 유저 정보도 삭제해야 함
 *    → 로컬 정리는 authService.logout()에서 담당
 *
 * ⚠️ body가 없는 엔드포인트라 null을 전달하고,
 *    userId는 query string(params)으로 전송함
 *
 * @param userId  로그아웃할 사용자의 고유 ID
 * @returns       로그아웃 성공 여부 및 메시지
 * @throws        서버 오류 또는 네트워크 오류 시 에러
 */
export const logoutFromServer = async (
  userId: number,
): Promise<LogoutResponse> => {
  try {
    const response = await client.post<LogoutResponse>(
      '/api/auth/logout',
      null, // body 없음 (서버 스펙상 body 불필요)
      { params: { userId } }, // userId를 query string으로 전달: ?userId=123
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

    // 에러를 상위(authService.logout)로 전파
    // → 서버 로그아웃 실패 시에도 로컬 토큰은 반드시 삭제해야 함
    throw error;
  }
};
