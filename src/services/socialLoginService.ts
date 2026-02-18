/**
 * 소셜 로그인 통합 서비스 (socialLoginService.ts)
 *
 * Google, Kakao, Naver, Apple 네 가지 소셜 로그인 제공자를 통합 관리한다.
 *
 * 처리 흐름 (모든 제공자 공통):
 *   1. 소셜 SDK로 로그인 → 소셜 액세스 토큰 획득
 *   2. Google/Apple은 Firebase Auth로 중간 인증 (idToken 발급)
 *   3. 서버 API 호출 (/api/auth/login/provider) → 서버 JWT 토큰 발급
 *   4. 서버 토큰 + 사용자 정보 + 소셜 토큰을 AsyncStorage에 저장
 *   5. newUser 플래그 반환 (신규/기존 사용자 구분)
 *
 * 제공자별 특이사항:
 *   - Google : Firebase Auth 필수, idToken을 서버로 전송
 *   - Apple  : Firebase Auth 필수, authorizationCode를 별도 저장 (탈퇴 시 필요)
 *   - Kakao  : 직접 SDK 연동, accessToken을 서버로 전송
 *   - Naver  : 직접 SDK 연동, 타임아웃 처리로 취소 감지 (SDK 버그 우회)
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  login as kakaoLogin,
  getProfile as getKakaoProfile,
  logout as kakaoLogout,
} from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { GOOGLE_CONFIG, NAVER_CONFIG } from '../config/socialLoginConfig';
import appleAuth from '@invertase/react-native-apple-authentication';
import {
  getAuth,
  GoogleAuthProvider,
  AppleAuthProvider,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { loginWithProvider } from '../api/authApi';
import { saveAuthToken, saveRefreshToken, saveUserInfo } from './authService';

// 소셜 로그인 제공자 타입
export type SocialLoginProvider = 'GOOGLE' | 'KAKAO' | 'NAVER' | 'APPLE';

/**
 * 소셜 로그인 결과 인터페이스
 *
 * @property success     - 로그인 성공 여부
 * @property provider    - 로그인 제공자
 * @property accessToken - 소셜 액세스 토큰 (Google/Apple은 idToken)
 * @property userInfo    - 소셜에서 가져온 사용자 정보
 * @property newUser     - 신규 사용자 여부 (서버에서 반환)
 * @property error       - 실패 시 에러 메시지
 */
export interface SocialLoginResult {
  success: boolean;
  provider: SocialLoginProvider;
  accessToken?: string;
  userInfo?: {
    id: string;
    email?: string;
    name?: string;
    profileImage?: string;
  };
  newUser?: boolean; // 신규 사용자 여부
  error?: string;
}

// ────────────────────────────────────────────────────────────────────────────────────────────
// 구글 로그인
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * [구글 로그인 초기화]
 * Google Sign-In SDK를 초기화한다.
 *
 * webClientId: Firebase 콘솔에서 발급받은 OAuth 클라이언트 ID
 * offlineAccess: 리프레시 토큰 획득 활성화 (장기 세션 유지용)
 *
 * 앱 시작 시 한 번만 호출하면 되며, LoginScreen의 useEffect에서 실행된다.
 */
export const initializeGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId,
      offlineAccess: true,
    });
  } catch (error) {
    console.warn('구글 로그인 초기화 실패:', error);
  }
};

/**
 * Google 소셜 로그인을 수행한다.
 *
 * 처리 흐름:
 *   1. GoogleSignin.signIn() → 사용자 계정 선택 화면 표시
 *   2. getTokens()로 idToken과 accessToken 획득
 *   3. Firebase Auth로 idToken 검증 및 Firebase 사용자 생성
 *   4. 서버 API 호출 (loginWithProvider) → 서버 JWT 발급
 *   5. 서버 토큰, 사용자 정보, 소셜 accessToken을 AsyncStorage에 저장
 *
 * @returns SocialLoginResult (success, newUser, userInfo 등)
 */
export const signInWithGoogle = async (): Promise<SocialLoginResult> => {
  try {
    // 1. Google 계정 선택 화면 표시
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;

    if (!idToken) {
      console.error('Google ID Token이 없습니다. tokens:', tokens);
      throw new Error('Google ID Token이 없습니다.');
    }

    // 2. Firebase Auth로 idToken 검증
    const authInstance = getAuth(getApp());
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(
      authInstance,
      googleCredential,
    );
    const firebaseUser = userCredential.user;

    // 3. 서버 API 호출
    let newUser = true; // 기본값은 true (신규 사용자)

    try {
      const loginResponse = await loginWithProvider('GOOGLE', {
        accessToken: tokens.accessToken,
        // email: firebaseUser.email || undefined,
      });

      // newUser 값 저장
      newUser = loginResponse.data?.newUser ?? true;

      // 4. 서버 응답 데이터 저장
      if (loginResponse.data) {
        if (loginResponse.data.accessToken) {
          await saveAuthToken(loginResponse.data.accessToken);
        }

        if (loginResponse.data.refreshToken) {
          await saveRefreshToken(loginResponse.data.refreshToken);
        }

        // userInfo 저장 (provider, loginTime 포함)
        if (loginResponse.data.userInfo) {
          await saveUserInfo({
            ...loginResponse.data.userInfo,
            provider: 'GOOGLE',
            loginTime: Date.now(),
            providerAccessToken: tokens.accessToken,
          });
        }
      } else if (loginResponse.token) {
        await saveAuthToken(loginResponse.token);
        if (loginResponse.refreshToken) {
          await saveRefreshToken(loginResponse.refreshToken);
        }
        if (loginResponse.user) {
          await saveUserInfo({
            userId: parseInt(loginResponse.user.id, 10) || 0,
            name: loginResponse.user.name,
            email: loginResponse.user.email,
            profileImage: loginResponse.user.profileImage,
          });
        }
      } else {
        console.warn('서버에서 토큰을 받지 못했습니다.');
        console.warn('서버 응답:', JSON.stringify(loginResponse, null, 2));
        console.warn('서버 응답 필드:', Object.keys(loginResponse).join(', '));
      }
    } catch (apiError) {
      console.error('서버 로그인 API 호출 실패:', apiError);
      // 서버 API 실패 시 로그인 자체를 실패로 처리
      // (토큰 없이는 이후 API 호출이 불가능하므로)
      return {
        success: false,
        provider: 'GOOGLE',
        error: '서버 로그인에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      provider: 'GOOGLE',
      accessToken: idToken,
      userInfo: {
        id: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        name: firebaseUser.displayName || undefined,
        profileImage: firebaseUser.photoURL || undefined,
      },
      newUser,
    };
  } catch (error: any) {
    console.error('구글 로그인 에러:', error);
  }
};

/**
 * Google 소셜 로그아웃을 수행한다.
 *
 * GoogleSignin.signOut()과 Firebase Auth의 signOut()을 모두 호출하여
 * 로컬 세션을 완전히 종료한다.
 *
 * 실패해도 에러를 throw하지 않고 로그만 남긴다.
 * (로컬 로그아웃은 authService.logout()에서 별도 처리하므로)
 */
export const signOutGoogle = async (): Promise<void> => {
  try {
    // 로그아웃 전에 Google Sign-In SDK 초기화 확인
    try {
      // 이미 초기화되어 있는지 확인하고, 필요시 재초기화
      initializeGoogleSignIn();
    } catch (initError) {
      console.warn('구글 로그인 초기화 실패 (로그아웃 시도):', initError);
    }

    await GoogleSignin.signOut();
    const authInstance = getAuth(getApp());
    await signOut(authInstance);
  } catch (error) {
    console.error('구글 로그아웃 실패:', error);
    // 에러가 발생해도 계속 진행 (로컬 로그아웃은 완료)
  }
};

// ────────────────────────────────────────────────────────────────────────────────────────────
// 카카오 로그인 (firebase 없이 직접 연동)
// ────────────────────────────────────────────────────────────────────────────────────────────

export const signInWithKakao = async (): Promise<SocialLoginResult> => {
  try {
    const token = await kakaoLogin();
    const profile = await getKakaoProfile();
    const profileData = profile as any;

    const userInfo = {
      id: profileData.id?.toString() || '',
      email: profileData.kakaoAccount?.email || undefined,
      name:
        profileData.kakaoAccount?.profile?.nickname ||
        profileData.nickname ||
        undefined,
      profileImage:
        profileData.kakaoAccount?.profile?.profileImageUrl ||
        profileData.profileImageUrl ||
        undefined,
    };

    // 서버 API 호출
    let newUser = true; // 기본값은 true (신규 사용자)

    try {
      const loginResponse = await loginWithProvider('KAKAO', {
        accessToken: token.accessToken,
      });

      // newUser 값 저장
      newUser = loginResponse.data?.newUser ?? true;

      if (loginResponse.data) {
        if (loginResponse.data.accessToken) {
          await saveAuthToken(loginResponse.data.accessToken);
        }

        if (loginResponse.data.refreshToken) {
          await saveRefreshToken(loginResponse.data.refreshToken);
        }

        if (loginResponse.data.userInfo) {
          await saveUserInfo({
            ...loginResponse.data.userInfo,
            provider: 'KAKAO',
            loginTime: Date.now(),
            providerAccessToken: token.accessToken,
          });
        }
      } else if (loginResponse.token) {
        await saveAuthToken(loginResponse.token);
        if (loginResponse.refreshToken) {
          await saveRefreshToken(loginResponse.refreshToken);
        }
        if (loginResponse.user) {
          await saveUserInfo({
            userId: parseInt(loginResponse.user.id, 10) || 0,
            name: loginResponse.user.name,
            email: loginResponse.user.email,
            profileImage: loginResponse.user.profileImage,
          });
        }
      } else {
        console.warn('서버에서 토큰을 받지 못했습니다.');
        console.warn('서버 응답:', JSON.stringify(loginResponse, null, 2));
        console.warn('서버 응답 필드:', Object.keys(loginResponse).join(', '));
      }
    } catch (apiError) {
      console.error('서버 로그인 API 호출 실패:', apiError);
      // 서버 API 실패 시 에러 반환
      return {
        success: false,
        provider: 'KAKAO',
        error: '서버 로그인에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      provider: 'KAKAO',
      accessToken: token.accessToken,
      userInfo,
      newUser,
    };
  } catch (error: any) {
    console.error('카카오 로그인 에러:', error);
  }
};

// 카카오 로그아웃
export const signOutKakao = async (): Promise<void> => {
  try {
    await kakaoLogout();
  } catch (error) {
    console.error('카카오 로그아웃 실패:', error);
  }
};

// ────────────────────────────────────────────────────────────────────────────────────────────
// 네이버 로그인
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * [네이버 로그인 초기화]
 * Naver 소셜 로그인 SDK를 초기화한다.
 *
 * 앱 시작 시 한 번만 호출하면 되며, LoginScreen의 useEffect에서 실행된다.
 */
export const initializeNaverLogin = () => {
  try {
    if (NaverLogin && typeof NaverLogin.initialize === 'function') {
      NaverLogin.initialize({
        appName: NAVER_CONFIG.appName,
        consumerKey: NAVER_CONFIG.consumerKey,
        consumerSecret: NAVER_CONFIG.consumerSecret,
        serviceUrlSchemeIOS: NAVER_CONFIG.serviceUrlScheme,
      });
    }
  } catch (error) {
    console.warn('네이버 로그인 초기화 실패:', error);
  }
};

/**
 * Naver 소셜 로그인을 수행한다.
 *
 * 중요: Naver SDK의 알려진 버그
 *   - 사용자가 로그인 취소 시 Promise가 완료되지 않고 무한 대기 상태에 빠짐
 *   - 해결: Promise.race()로 5초 타임아웃 설정, 타임아웃 발생 시 취소로 간주
 *
 * 처리 흐름:
 *   1. NaverLogin.login() 호출 (disableNaverAppAuthIOS: true로 앱 전환 방지)
 *   2. 타임아웃과 race → 5초 내 응답 없으면 취소로 처리
 *   3. 성공 시 getProfile()로 사용자 정보 획득
 *   4. 서버 API 호출 → 토큰 저장
 *
 * @returns SocialLoginResult
 */
export const signInWithNaver = async (): Promise<SocialLoginResult> => {
  console.log('[NaverLogin] signInWithNaver 함수 진입'); // 👈 해당 로그 꼭 떠야 함!

  try {
    initializeNaverLogin();

    // 네이버 로그인 요청 (앱 이탈 방지 옵션 필수)
    console.log('[NaverLogin] login() 호출 시작');

    // 취소 시 무한 대기 방지를 위한 타임아웃 추가 (5초)
    // 네이버 로그인 SDK의 알려진 버그: 취소 시 Promise가 완료되지 않음
    const loginPromise = (NaverLogin.login as any)({
      appName: NAVER_CONFIG.appName,
      consumerKey: NAVER_CONFIG.consumerKey,
      consumerSecret: NAVER_CONFIG.consumerSecret,
      serviceUrlSchemeIOS: NAVER_CONFIG.serviceUrlScheme,
      disableNaverAppAuthIOS: true, // 앱이 꺼지지 않도록 하는 필수 옵션
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 5000); // 5초 타임아웃 (취소 시 빠른 응답)
    });

    let result: any;
    try {
      result = (await Promise.race([loginPromise, timeoutPromise])) as any;
    } catch (timeoutError: any) {
      // 타임아웃 에러인 경우 (취소로 간주)
      // 네이버 로그인 SDK 버그: 취소 시 Promise가 완료되지 않아 타임아웃 발생
      if (timeoutError?.message === 'TIMEOUT') {
        console.log('[NaverLogin] 타임아웃 발생 (취소로 간주)');
        return {
          success: false,
          provider: 'NAVER',
          error: '로그인이 취소되었습니다.',
        };
      }
      // 다른 에러는 외부 catch로 전달
      throw timeoutError;
    }

    // result가 없는 경우 처리
    if (!result) {
      console.error('[NaverLogin] result가 undefined입니다.');
      return {
        success: false,
        provider: 'NAVER',
        error: '네이버 로그인 응답이 없습니다.',
      };
    }
    // 4. 성공 처리
    if (result?.isSuccess && result?.successResponse) {
      console.log('[NaverLogin] 로그인 성공');
      const accessToken = result.successResponse.accessToken;
      const profileResult = await NaverLogin.getProfile(accessToken);

      const userInfo = {
        id: profileResult.response?.id || '',
        email: profileResult.response?.email || undefined,
        name: profileResult.response?.name || undefined,
        profileImage: profileResult.response?.profile_image || undefined,
      };

      // 서버 로그인 API 호출
      try {
        const loginResponse = await loginWithProvider('NAVER', {
          accessToken,
          email: userInfo.email,
        });

        // 토큰 저장
        if (loginResponse.data?.accessToken)
          await saveAuthToken(loginResponse.data.accessToken);
        if (loginResponse.data?.refreshToken)
          await saveRefreshToken(loginResponse.data.refreshToken);
        if (loginResponse.data?.userInfo) {
          await saveUserInfo({
            ...loginResponse.data.userInfo,
            provider: 'NAVER',
            loginTime: Date.now(),
            providerAccessToken: accessToken,
          });
        }

        return {
          success: true,
          provider: 'NAVER',
          accessToken,
          userInfo,
          newUser: loginResponse.data?.newUser ?? true,
        };
      } catch (apiError) {
        console.error('서버 로그인 실패:', apiError);
        return { success: false, provider: 'NAVER', error: '서버 연동 실패' };
      }
    }
  } catch (error: any) {
    // 사용자가 취소한 경우 체크
    const errorMessage = (error?.message || '').toLowerCase();
    const errorCode = String(error?.code || '');
    const isCancel =
      errorCode === 'USER_CANCEL' ||
      errorCode === 'CANCELLED' ||
      errorCode === 'E_CANCELLED' ||
      errorMessage.includes('취소') ||
      errorMessage.includes('cancel') ||
      errorMessage.includes('cancelled') ||
      errorMessage === 'timeout'; // 타임아웃도 취소로 간주

    if (isCancel) {
      console.log('[NaverLogin] ✅ 사용자가 로그인을 취소했습니다.');
      return {
        success: false,
        provider: 'NAVER',
        error: '로그인이 취소되었습니다.',
      };
    }
    return {
      success: false,
      provider: 'NAVER',
      error: error?.message || '네이버 로그인 오류',
    };
  }
};

// 네이버 로그아웃
export const signOutNaver = async (): Promise<void> => {
  try {
    await NaverLogin.logout();
  } catch (error) {
    console.error('네이버 로그아웃 실패:', error);
  }
};

// ────────────────────────────────────────────────────────────────────────────────────────────
// 통합 함수
// ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * 제공자별 소셜 로그인 함수를 통합한 래퍼 함수
 *
 * 호출부에서는 provider만 전달하면 되도록 추상화했다.
 *
 * @param provider 로그인 제공자
 * @returns SocialLoginResult
 */
export const signInWithSocial = async (
  provider: SocialLoginProvider,
): Promise<SocialLoginResult> => {
  switch (provider) {
    case 'GOOGLE':
      return signInWithGoogle();
    case 'KAKAO':
      return signInWithKakao();
    case 'NAVER':
      return signInWithNaver();
    case 'APPLE':
      return signInWithApple();
    default:
      return {
        success: false,
        provider,
        error: '지원하지 않는 소셜 로그인입니다',
      };
  }
};

/**
 * [통합 로그아웃 함수]
 *
 * Apple은 별도 로그아웃 API가 없으므로 break만 처리한다.
 *
 * @param provider 로그인 제공자
 */

export const signOutSocial = async (
  provider: SocialLoginProvider,
): Promise<void> => {
  switch (provider) {
    case 'GOOGLE':
      await signOutGoogle();
      break;
    case 'KAKAO':
      await signOutKakao();
      break;
    case 'NAVER':
      await signOutNaver();
      break;
    case 'APPLE':
      break;
  }
};

// ────────────────────────────────────────────────────────────────────────────────────────────
// Apple 로그인 ▶️ 사용하지 않음
// ────────────────────────────────────────────────────────────────────────────────────────────

// 애플 로그인
export const signInWithApple = async (): Promise<SocialLoginResult> => {
  let appleAuthRequestResponse: any = null;
  let identityToken: string | null = null;

  try {
    appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const authorizationCode = appleAuthRequestResponse.authorizationCode;
    identityToken = appleAuthRequestResponse.identityToken;
    const { user } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error('Apple ID Token이 없습니다.');
    }

    if (!user) {
      throw new Error('Apple User ID가 없습니다.');
    }

    const authInstance = getAuth(getApp());
    const appleCredential = AppleAuthProvider.credential(
      identityToken,
      appleAuthRequestResponse.nonce || undefined,
    );

    const userCredential = await signInWithCredential(
      authInstance,
      appleCredential,
    );
    const firebaseUser = userCredential.user;

    const userInfo = {
      id: firebaseUser.uid,
      email: firebaseUser.email || appleAuthRequestResponse.email || undefined,
      name:
        firebaseUser.displayName ||
        appleAuthRequestResponse.fullName?.givenName ||
        undefined,
      profileImage: undefined,
    };

    // 서버 API 호출
    let newUser = true; // 기본값은 true (신규 사용자)

    try {
      const loginResponse = await loginWithProvider('APPLE', {
        accessToken: identityToken,
        email: userInfo.email,
        // name: userInfo.name,
        // profileImage: userInfo.profileImage,
      });

      // newUser 값 저장
      newUser = loginResponse.data?.newUser ?? true;

      // 서버에서 받은 데이터 저장
      if (loginResponse.data) {
        // accessToken 저장
        if (loginResponse.data.accessToken) {
          await saveAuthToken(loginResponse.data.accessToken);
        }

        // refreshToken 저장
        if (loginResponse.data.refreshToken) {
          await saveRefreshToken(loginResponse.data.refreshToken);
        }

        // userInfo 저장
        if (loginResponse.data.userInfo) {
          await saveUserInfo({
            ...loginResponse.data.userInfo,
            provider: 'APPLE',
            loginTime: Date.now(),
            appleAuthorizationCode: authorizationCode || undefined,
          });
        }
      } else if (loginResponse.token) {
        await saveAuthToken(loginResponse.token);
        if (loginResponse.refreshToken) {
          await saveRefreshToken(loginResponse.refreshToken);
        }
        if (loginResponse.user) {
          await saveUserInfo({
            userId: parseInt(loginResponse.user.id, 10) || 0,
            name: loginResponse.user.name,
            email: loginResponse.user.email,
            profileImage: loginResponse.user.profileImage,
          });
        }
      } else {
        console.warn('서버에서 토큰을 받지 못했습니다.');
        console.warn('서버 응답:', JSON.stringify(loginResponse, null, 2));
        console.warn('서버 응답 필드:', Object.keys(loginResponse).join(', '));
      }
    } catch (apiError) {
      console.error('서버 로그인 API 호출 실패:', apiError);
      // 서버 API 실패 시 에러 반환
      return {
        success: false,
        provider: 'APPLE',
        error: '서버 로그인에 실패했습니다. 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      provider: 'APPLE',
      accessToken: identityToken,
      userInfo,
      newUser,
    };
  } catch (err: any) {
    console.error('애플 로그인 에러:', err);
    return {
      success: false,
      provider: 'APPLE',
      error: err.message || '애플 로그인 실패',
    };
  }
};
