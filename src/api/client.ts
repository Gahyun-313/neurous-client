import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getAuthToken,
  getRefreshToken,
  saveAuthToken,
  saveRefreshToken,
} from '../services/authService';
import { refreshToken } from './authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '../store/onboardingStore';
import { IS_PRODUCTION } from '../config/adConfig';
import { DEV_URL, PROD_URL } from '../config/api';

const client = axios.create({
  baseURL: IS_PRODUCTION ? PROD_URL : DEV_URL,
  timeout: 10000, // 10초 타임아웃 (네트워크가 느릴 때 무한 대기 방지)
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log('baseURL:', client.defaults.baseURL);
console.log('IS_PRODUCTION:', IS_PRODUCTION);
// 토큰 재발급 중인지 확인하는 플래그 (무한 루프 방지)
let isRefreshing = false;

// 3. 요청 인터셉터 (Request Interceptor)
// 요청을 보내기 직전에 실행됩니다. (주로 토큰 넣을 때 사용)
client.interceptors.request.use(
  async config => {
    // refresh API 호출 시에는 Authorization 헤더를 제거
    if (config.url?.includes('/api/auth/refresh')) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
    } else {
      // AsyncStorage에서 토큰을 가져와서 헤더에 추가
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 개발 모드에서 요청 로깅
    if (__DEV__) {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[API 요청] ${config.method?.toUpperCase()} ${fullUrl}`);
      if (config.params) {
        console.log('[요청 파라미터]:', config.params);
      }
      if (config.data) {
        console.log('[요청 데이터]:', JSON.stringify(config.data, null, 2));
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return config;
  },
  error => {
    // 개발 모드에서 요청 에러 로깅
    if (__DEV__) {
      console.error('[API 요청 에러]:', error);
    }
    return Promise.reject(error);
  },
);

// 4. 응답 인터셉터 (Response Interceptor)
client.interceptors.response.use(
  response => {
    // 개발 모드에서 응답 로깅
    if (__DEV__) {
      const fullUrl = `${response.config.baseURL}${response.config.url}`;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(
        `[API 응답] ${response.config.method?.toUpperCase()} ${fullUrl}`,
      );
      console.log('[응답 데이터]:', JSON.stringify(response.data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
        })
      | undefined;

    // 401/403 에러 발생 시 토큰 재발급 시도
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // 토큰 재발급 API 자체가 401/403을 반환하면 무한 루프 방지
      if (originalRequest.url?.includes('/api/auth/refresh')) {
        // 재발급 API 자체가 실패하면 토큰 삭제 및 온보딩 상태 초기화
        await AsyncStorage.multiRemove([
          '@auth_token',
          '@refresh_token',
          '@user_info',
        ]);
        // 온보딩 상태 초기화 (로그인 화면으로 이동하기 위해)
        await AsyncStorage.setItem('@onboarding_completed', 'false');
        await AsyncStorage.setItem('@onboarding_step', 'login');
        // Zustand store도 업데이트하여 RootNavigator가 감지하도록 함
        useOnboardingStore.getState().resetOnboarding();

        return Promise.reject(error);
      }

      // 이미 재발급 중이면 에러 반환 (동시 요청은 각자 처리)
      if (isRefreshing) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = await getRefreshToken();
        if (!refreshTokenValue) {
          isRefreshing = false;
          // 리프레시 토큰이 없으면 로그아웃 처리
          await AsyncStorage.multiRemove([
            '@auth_token',
            '@refresh_token',
            '@user_info',
          ]);
          await AsyncStorage.setItem('@onboarding_completed', 'false');
          await AsyncStorage.setItem('@onboarding_step', 'login');
          useOnboardingStore.getState().resetOnboarding();
          return Promise.reject(error);
        }

        // 토큰 재발급 API 호출
        const refreshResponse = await refreshToken(refreshTokenValue);
        // data 래퍼가 있으면 data에서, 없으면 직접 접근 (하위 호환성)
        const newAccessToken =
          refreshResponse.data?.accessToken || refreshResponse.accessToken;

        if (!newAccessToken) {
          throw new Error('토큰 재발급 응답에 accessToken이 없습니다');
        }

        // 새 토큰 저장
        await saveAuthToken(newAccessToken);
        const newRefreshToken =
          refreshResponse.data?.refreshToken || refreshResponse.refreshToken;
        if (newRefreshToken) {
          await saveRefreshToken(newRefreshToken);
        }

        // 재발급 성공 시 원래 요청 재시도
        isRefreshing = false;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError: any) {
        isRefreshing = false;

        // 재발급 실패 시 토큰 삭제 및 온보딩 상태 초기화
        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403 ||
          !refreshError.response // 네트워크 에러 등
        ) {
          await AsyncStorage.multiRemove([
            '@auth_token',
            '@refresh_token',
            '@user_info',
          ]);
          // 온보딩 상태 초기화 (로그인 화면으로 이동하기 위해)
          await AsyncStorage.setItem('@onboarding_completed', 'false');
          await AsyncStorage.setItem('@onboarding_step', 'login');
          // Zustand store도 업데이트하여 RootNavigator가 감지하도록 함
          useOnboardingStore.getState().resetOnboarding();
        }

        if (refreshError.response?.status === 500) {
          return Promise.reject(refreshError);
        }

        return Promise.reject(error);
      }
    }

    // 개발 모드에서 에러 응답 로깅
    if (__DEV__) {
      const fullUrl = originalRequest
        ? `${originalRequest.baseURL}${originalRequest.url}`
        : '알 수 없음';
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(
        `[API 에러 응답] ${
          originalRequest?.method?.toUpperCase() || 'UNKNOWN'
        } ${fullUrl}`,
      );
      console.error(
        '[에러 상태]:',
        error.response?.status,
        error.response?.statusText,
      );
      if (error.response?.data) {
        console.error(
          '[에러 데이터]:',
          JSON.stringify(error.response.data, null, 2),
        );
      }
      if (error.message) {
        console.error('[에러 메시지]:', error.message);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return Promise.reject(error);
  },
);

export default client;
