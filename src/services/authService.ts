/**
 * 인증 관련 서비스
 * 서버 API 연동 시 이 파일을 수정하여 실제 인증 로직 구현
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecentLogin, RecentLoginInfo } from './authStorageService';
import { signOutSocial, SocialLoginProvider } from './socialLoginService';
import { logoutFromServer } from '../api/authApi';
import { withdrawUser } from '../api/withdrawApi';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAccessToken as getKakaoAccessToken } from '@react-native-seoul/kakao-login';

export interface AuthStatus {
  isAuthenticated: boolean;
  userInfo?: RecentLoginInfo;
}

/**
 * 현재 인증 상태 확인
 * @returns Promise<AuthStatus>
 */
export const checkAuthStatus = async (): Promise<AuthStatus> => {
  try {
    // 1. 로컬 스토리지에서 최근 로그인 정보 확인
    const recentLogin = await getRecentLogin();

    if (!recentLogin) {
      return { isAuthenticated: false };
    }

    // TODO: 서버 API로 토큰 검증 (필요 시 구현)
    // 현재는 API 호출 시 서버가 401/403을 반환하면 client.ts의 인터셉터에서 처리

    // 현재는 로컬 정보만 확인
    return {
      isAuthenticated: true,
      userInfo: recentLogin,
    };
  } catch (error) {
    console.error('인증 상태 확인 중 오류:', error);
    return { isAuthenticated: false };
  }
};

const AUTH_TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_INFO_KEY = '@user_info';

/**
 * 인증 토큰 저장
 * @param token 인증 토큰
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
};

/**
 * 리프레시 토큰 저장
 * @param refreshToken 리프레시 토큰
 */
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('리프레시 토큰 저장 실패:', error);
  }
};

/**
 * 리프레시 토큰 조회
 * @returns Promise<string | null>
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('리프레시 토큰 조회 실패:', error);
    return null;
  }
};

/**
 * 사용자 정보 저장 (provider, loginTime 포함)
 * @param userInfo 사용자 정보
 */
export const saveUserInfo = async (userInfo: {
  userId: number;
  name?: string;
  email?: string;
  profileImage?: string;
  provider?: string;
  loginTime?: number;
  providerAccessToken?: string;
  appleAuthorizationCode?: string;
}): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } catch (error) {
    console.error('사용자 정보 저장 실패:', error);
  }
};

/**
 * 사용자 정보 조회
 * @returns Promise<UserInfo | null>
 */
export const getUserInfo = async (): Promise<{
  userId: number;
  name?: string;
  email?: string;
  profileImage?: string;
  provider?: SocialLoginProvider;
  loginTime?: number;
  providerAccessToken?: string;
  appleAuthorizationCode?: string;
} | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_INFO_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
};

/**
 * 인증 토큰 조회
 * @returns Promise<string | null>
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@auth_token');
  } catch (error) {
    console.error('토큰 조회 실패:', error);
    return null;
  }
};

/**
 * 사용자 정보 삭제 (로그아웃 시)
 */
export const clearUserInfo = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_INFO_KEY);
  } catch (error) {
    console.error('사용자 정보 삭제 실패:', error);
  }
};

/**
 * 로그아웃 - 모든 로그인 정보 및 온보딩 상태 초기화
 * @param provider 소셜 로그인 제공자
 */
export const logout = async (provider?: SocialLoginProvider): Promise<void> => {
  try {
    // 자동로그인은 "로그인 시 저장된 값(@user_info/@auth_token/@refresh_token)"으로 유지됨

    // 0. 현재 저장된 유저정보에서 userId/provider를 확보 (삭제 전)
    const userInfo = await getUserInfo();
    const resolvedProvider = provider ?? userInfo?.provider;
    const userId = userInfo?.userId;

    // 1. 서버 로그아웃 (실패해도 로컬 로그아웃은 진행)
    if (userId) {
      try {
        await logoutFromServer(userId);
      } catch {
        console.warn(
          '[logout] 서버 로그아웃 실패 - 로컬 로그아웃은 계속 진행합니다.',
        );
      }
    }

    // 2. 소셜 로그인 로그아웃 (구글/카카오/네이버)
    if (resolvedProvider) {
      await signOutSocial(resolvedProvider);
    }

    // 3. 로컬 저장값 삭제 (로그아웃 후 자동로그인 방지)
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_INFO_KEY,
    ]);

    console.log('로그아웃 완료');
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    throw error;
  }
};

/**
 * 모든 인증 및 온보딩 정보 초기화 (개발/테스트용)
 */
export const clearAllAuthData = async (): Promise<void> => {
  try {
    // 사용자 정보 삭제
    await clearUserInfo();

    // 온보딩 상태 초기화는 onboardingStore.resetOnboarding()에서 처리
    // 이 함수는 authService에서만 처리하므로 여기서는 로그인 정보만 삭제

    console.log('모든 인증 정보 초기화 완료');
  } catch (error) {
    console.error('인증 정보 초기화 중 오류:', error);
  }
};

/**
 * 회원 탈퇴 (소셜 unlink 포함)
 * - 서버 탈퇴 + unlinkSocial=true 요청
 * - 소셜 SDK 로그아웃 시도
 * - 로컬 토큰/유저정보 삭제 (자동로그인 방지)
 */
export const withdraw = async (): Promise<void> => {
  try {
    const userInfo = await getUserInfo();

    const userId = userInfo?.userId;
    const provider = userInfo?.provider;

    if (!userId) {
      throw new Error(
        '유저 정보를 찾을 수 없습니다. 다시 로그인 후 시도해주세요.',
      );
    }
    if (!provider) {
      throw new Error('로그인 제공자(provider) 정보를 찾을 수 없습니다.');
    }

    const isApple = provider === 'APPLE';

    // unlink용 값: 저장값은 backup, 탈퇴 시점에 최신값을 우선 재획득
    let providerAccessToken = userInfo?.providerAccessToken;
    const appleAuthorizationCode = userInfo?.appleAuthorizationCode;

    try {
      if (provider === 'GOOGLE') {
        // 토큰 갱신 안정화
        try {
          await GoogleSignin.signInSilently();
        } catch (e) {
          console.warn('[withdraw][GOOGLE] signInSilently 실패:', e);
        }

        const tokens = await GoogleSignin.getTokens();
        providerAccessToken = tokens?.accessToken ?? providerAccessToken;
      }

      if (provider === 'KAKAO') {
        const tokenInfo: any = await getKakaoAccessToken();

        // 반환 타입 방어 (string / object 모두 대응)
        if (typeof tokenInfo === 'string') {
          providerAccessToken = tokenInfo || providerAccessToken;
        } else {
          providerAccessToken =
            tokenInfo?.accessToken ||
            tokenInfo?.token?.accessToken ||
            tokenInfo?.access_token ||
            providerAccessToken;
        }
      }

      // NAVER: 로그인 때 저장한 accessToken 사용
      // APPLE: 로그인 때 저장한 authorizationCode 사용
    } catch (e) {
      console.warn(
        '[withdraw] unlink 토큰 재획득 실패 - 저장된 값으로 시도합니다.',
        e,
      );
    }

    // unlink 위해 필요한 값이 없으면 에러
    if (!isApple && !providerAccessToken) {
      throw new Error(
        '소셜 연결 끊기에 필요한 providerAccessToken이 없습니다.',
      );
    }

    console.log('[withdraw] 최종 요청 준비:', {
      userId,
      provider,
      unlinkSocial: true,
      hasProviderAccessToken: !!providerAccessToken,
      hasAppleAuthorizationCode: !!appleAuthorizationCode,
    });

    // 1) 서버 탈퇴 + 소셜 unlink
    // undefined 값도 명시적으로 포함하기 위해 null로 변환
    const requestBody: {
      unlinkSocial: boolean;
      providerAccessToken?: string | null;
      appleAuthorizationCode?: string | null;
    } = {
      unlinkSocial: true,
    };

    if (!isApple) {
      requestBody.providerAccessToken = providerAccessToken || null;
    } else {
      requestBody.providerAccessToken = null;
    }

    if (isApple) {
      requestBody.appleAuthorizationCode = appleAuthorizationCode || null;
    } else {
      requestBody.appleAuthorizationCode = null;
    }

    await withdrawUser(userId, requestBody);

    // 2) 소셜 SDK 로그아웃 (실패해도 로컬 정리는 진행)
    try {
      await signOutSocial(provider);
    } catch {
      console.warn(
        '[withdraw] 소셜 로그아웃 실패 - 로컬 정리는 계속 진행합니다.',
      );
    }

    // 3) 로컬 저장값 삭제 (탈퇴 후 자동로그인 방지)
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_INFO_KEY,
    ]);

    console.log('회원 탈퇴 완료');
  } catch (error: any) {
    console.error('[withdraw] 실패:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};
