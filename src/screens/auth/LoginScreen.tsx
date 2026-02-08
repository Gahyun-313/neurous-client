import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RouteNames } from '../../../routes';
import { OnboardingStackParamList } from '../../navigation/types';
import { COLORS, scaleWidth } from '../../styles/global';
import { Body_16SB, Heading_16B } from '../../styles/typography';
import {
  signInWithSocial,
  initializeGoogleSignIn,
  initializeNaverLogin,
  SocialLoginProvider,
} from '../../services/socialLoginService';
import {
  getRecentLogin,
  RecentLoginInfo,
} from '../../services/authStorageService';
import { useShowModal } from '../../store/modalStore';
import {
  useOnboardingStore,
  useCompleteOnboarding,
} from '../../store/onboardingStore';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import { useTrackingPermission } from '../../hooks/useTrackingPermission';

import Spacer from '../../components/Spacer';
import { SocialLoginButton } from '../../components';
import { LoginBackground } from '../../icons/commonIcons/simpleImages';
import { logEvent, logScreenView } from '../../services/analyticsService';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
type LoginRouteProp = RouteProp<
  OnboardingStackParamList,
  typeof RouteNames.SOCIAL_LOGIN
>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();

  const [loading, setLoading] = useState<SocialLoginProvider | null>(null);
  const [recentLogin, setRecentLogin] = useState<RecentLoginInfo | null>(null);
  const trackingModalShownRef = useRef<boolean>(false); // 중복 호출 방지
  const showModal = useShowModal();
  const setOnboardingStep = useOnboardingStore(
    state => state.setOnboardingStep,
  );
  const completeOnboarding = useCompleteOnboarding();
  const waitingForSettingsRef = useRef<{
    isWaiting: boolean;
    isExistingUser?: boolean;
  }>({ isWaiting: false });

  // Hooks
  const {
    checkPermission: checkNotiPermission,
    requestPermission: requestNotiPermission,
  } = useNotificationPermission({
    onSettingsOpened: () => {
      waitingForSettingsRef.current.isWaiting = true;
      console.log(
        '[LoginScreen] ✅ 설정 화면으로 이동 - 기존 사용자 여부:',
        waitingForSettingsRef.current.isExistingUser,
      );
    },
    onCancel: () => {
      // Alert 모달의 "취소" 버튼을 누른 경우
      console.log('[LoginScreen] 알림 권한 Alert 취소');
      waitingForSettingsRef.current.isWaiting = false;
    },
  });

  const {
    checkPermission: checkTrackingPermission,
    requestPermission: requestTrackingPermission,
  } = useTrackingPermission();

  // 1. 설정 화면에서 돌아왔을 때 처리 (알림 권한 관련)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          nextAppState === 'active' &&
          waitingForSettingsRef.current.isWaiting
        ) {
          const { isExistingUser } = waitingForSettingsRef.current;
          waitingForSettingsRef.current = { isWaiting: false };

          console.log(
            '[LoginScreen] 설정에서 돌아옴 - 기존 사용자 여부:',
            isExistingUser,
          );

          // 기존 사용자인 경우: 온보딩 완료 후 메인 화면으로 이동
          if (isExistingUser) {
            await completeOnboarding();
            // RootNavigator가 isOnboardingCompleted 변경을 감지하여 자동으로 메인 화면으로 이동
          } else {
            // 신규 사용자인 경우: 관심분야 화면으로 이동

            await setOnboardingStep('interests');
            navigation.navigate(RouteNames.INTERESTS, {});
          }
        }
      },
    );
    return () => subscription.remove();
  }, [setOnboardingStep, navigation, completeOnboarding]);

  // 2. 초기화 로직 (SDK Init & 최근 로그인 정보 로드)
  useEffect(() => {
    const initSocialLogin = async () => {
      try {
        initializeGoogleSignIn();
        initializeNaverLogin();
      } catch (error) {
        console.warn('소셜 로그인 초기화 중 오류:', error);
      }
    };

    const loadRecentLogin = async () => {
      const recent = await getRecentLogin();
      setRecentLogin(recent);
    };

    // UI 렌더링 우선을 위해 지연 실행
    const timer = setTimeout(() => {
      initSocialLogin();
      loadRecentLogin();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleTrackingModal = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    // 중복 호출 방지: 이미 모달이 표시된 경우 스킵
    if (trackingModalShownRef.current) {
      console.log(
        '[handleTrackingModal] 이미 모달이 표시되었습니다. 중복 호출 방지',
      );
      return;
    }

    console.log('[handleTrackingModal] iOS 추적 권한 체크 시작');
    try {
      const hasPermission = await checkTrackingPermission();

      if (!hasPermission) {
        console.log(
          '[handleTrackingModal] 권한 요청 시도 - 네이티브 ATT 모달 표시',
        );
        trackingModalShownRef.current = true; // 모달 표시 플래그 설정
        await requestTrackingPermission();
        console.log('[handleTrackingModal] ATT 모달 닫힘');
      } else {
        console.log('[handleTrackingModal] 이미 권한이 허용되어 있습니다.');
        trackingModalShownRef.current = true; // 이미 권한이 있으면 플래그 설정
      }
    } catch (error) {
      console.warn('추적 권한 처리 중 오류 (무시하고 진행):', error);
      trackingModalShownRef.current = false; // 에러 발생 시 플래그 리셋
    }
  }, [checkTrackingPermission, requestTrackingPermission]);

  const handleNotificationModal = useCallback(
    async (isExistingUser = false) => {
      // 기존 사용자 여부를 ref에 저장 (설정 화면에서 돌아왔을 때 사용)
      waitingForSettingsRef.current.isExistingUser = isExistingUser;

      const proceedNext = async () => {
        if (isExistingUser) {
          await completeOnboarding();
        } else {
          await setOnboardingStep('interests');
          navigation.navigate(RouteNames.INTERESTS, {});
        }
      };

      try {
        const shouldShowModal = await checkNotiPermission();

        if (shouldShowModal) {
          logScreenView('Popup_App_Notification', undefined, true);
          showModal({
            title: '알림을 받으시겠어요?',
            description:
              '알림을 켜두면, 하루 두 번 문해력 루틴을 \n잊지 않고 챙길 수 있어요!',
            descriptionColor: COLORS.gray600,
            primaryButton: {
              title: '알림 받을래요',
              textStyle: { ...Heading_16B, color: COLORS.white },
              onPress: async () => {
                // 설정 화면 이동 여부를 추적하기 위해 초기화
                waitingForSettingsRef.current.isWaiting = false;

                const granted = await requestNotiPermission();

                // 설정 화면으로 이동한 경우 (granted가 false이고 isWaiting이 true로 변경됨)
                // Alert의 "설정으로 이동" 버튼이 눌려서 onSettingsOpened가 호출된 경우
                if (!granted && waitingForSettingsRef.current.isWaiting) {
                  // 설정에서 돌아왔을 때 AppState에서 처리하므로 여기서는 proceedNext 호출하지 않음
                  return;
                }

                // 권한이 허용된 경우 또는 Alert의 "취소" 버튼을 누른 경우
                console.log(
                  '[LoginScreen] 권한 허용 또는 취소 - proceedNext 호출',
                );
                await proceedNext();
                logEvent('EnableNotifications_Popup_App_Notification');
              },
            },
            secondaryButton: {
              title: '괜찮아요',
              variant: 'outline',
              textStyle: { color: COLORS.gray700, ...Heading_16B },
              style: { borderColor: COLORS.gray300, height: scaleWidth(48) },
              onPress: async () => {
                await proceedNext();
                logEvent('Dismiss_Popup_App_Notification');
              },
            },
          });
        } else {
          await proceedNext();
        }
      } catch (error) {
        console.error('알림 권한 로직 오류:', error);
        await proceedNext();
      }
    },
    [
      checkNotiPermission,
      requestNotiPermission,
      showModal,
      completeOnboarding,
      setOnboardingStep,
      navigation,
    ],
  );

  const handleSocialLogin = useCallback(
    async (provider: SocialLoginProvider) => {
      console.log(`[LoginScreen] handleSocialLogin 진입: ${provider}`);

      // STEP 1: iOS 추적 권한 (로그인 창 띄우기 전)
      if (Platform.OS === 'ios') {
        await handleTrackingModal();
        // ✨ [중요] 시스템 모달 닫힘 대기 (0.5초)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // STEP 2: 소셜 로그인 시도
      try {
        setLoading(provider);

        const result = await signInWithSocial(provider);

        // result가 undefined인 경우 처리
        if (!result) {
          console.error('[LoginScreen] 로그인 결과가 undefined입니다.');
          // Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
          return;
        }

        console.log('[LoginScreen] 로그인 결과:', {
          success: result.success,
          newUser: result.newUser,
          hasError: !!result.error,
        });

        if (result.success && result.userInfo) {
          if (result.newUser === false) {
            // [기존 유저]
            await handleNotificationModal(true);
          } else {
            // [신규 유저]
            await handleNotificationModal(false);
          }
        } else {
          // 실패 또는 취소
          if (result.error) {
            if (!result.error.includes('취소')) {
              Alert.alert('로그인 실패', result.error);
            } else {
              console.log('로그인이 취소되었습니다.');
            }
          }
        }
      } catch (error: any) {
        console.error('[LoginScreen] 로그인 치명적 에러:', error);
        Alert.alert('오류', '로그인 중 알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(null);
      }
    },
    [handleTrackingModal, handleNotificationModal],
  );

  // 3. 약관 동의 화면에서 돌아왔을 때 로그인 트리거
  useEffect(() => {
    const agreedProvider = route.params?.agreedProvider;
    console.log('[LoginScreen] useEffect - agreedProvider:', agreedProvider);

    if (agreedProvider) {
      handleSocialLogin(agreedProvider);
      navigation.setParams({ agreedProvider: undefined });
    }
  }, [route.params?.agreedProvider, handleSocialLogin, navigation]);

  // --- 버튼 핸들러 (약관 화면으로 이동) ---
  const goTermsAgreement = (provider: SocialLoginProvider) => {
    navigation.navigate(RouteNames.TERMS_AGREEMENT, { provider });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <LoginBackground style={styles.backgroundImage} />
      </View>
      <View style={styles.content}>
        <Text style={styles.logoText}>
          일상의 틈, 언제든 시작하는 문해력 미션
        </Text>
        <View style={styles.buttonContainer}>
          <SocialLoginButton
            provider="KAKAO"
            onPress={() => {
              goTermsAgreement('KAKAO');
              logEvent('Kakao_Login_Onboarding_SocialLogin');
            }}
            loading={loading}
            recentLogin={recentLogin}
          />
          <SocialLoginButton
            provider="GOOGLE"
            onPress={() => {
              goTermsAgreement('GOOGLE');
              logEvent('Google_Login_Onboarding_SocialLogin');
            }}
            loading={loading}
            recentLogin={recentLogin}
          />
          <SocialLoginButton
            provider="NAVER"
            onPress={() => {
              goTermsAgreement('NAVER');
              logEvent('NAVER_Login_Onboarding_SocialLogin');
            }}
            loading={loading}
            recentLogin={recentLogin}
          />
          {Platform.OS === 'ios' && (
            <SocialLoginButton
              provider="APPLE"
              onPress={() => {
                goTermsAgreement('APPLE');
                logEvent('apple_Login_Onboarding_SocialLogin');
              }}
              loading={loading}
              recentLogin={recentLogin}
            />
          )}
        </View>
      </View>
      <Spacer num={52} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.puple.main,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    zIndex: 1,
  },
  logoText: {
    ...Body_16SB,
    color: COLORS.puple.main,
  },
  buttonContainer: {
    width: '100%',
    gap: scaleWidth(12),
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default LoginScreen;
