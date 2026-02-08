import {
  getAnalytics,
  logEvent as firebaseLogEvent,
} from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { RouteNames } from '../../routes';
import { IS_PRODUCTION } from '../config/adConfig';

/**
 * Firebase Analytics 서비스
 * 앱 내 이벤트 추적 및 사용자 행동 분석
 *
 * IS_PRODUCTION 설정에 따라 로그가 기록됩니다.
 * adConfig.ts에서 IS_PRODUCTION 값을 변경하세요.
 *
 * 화면 이름을 직접 이벤트 이름으로 사용합니다.
 * (Firebase의 자동 screen_view 이벤트 대신)
 */

/**
 * 화면 이름 매핑 테이블
 */
const screenNameMap: Record<string, string> = {
  // 온보딩
  [RouteNames.INTRO_CARDLIST]: 'Onboarding_Function01_CardList',
  [RouteNames.INTRO_FUNCTION]: 'Onboarding_Function02_Character',
  [RouteNames.INTRO_SEARCH]: 'Onboarding_Function03_Explore',
  [RouteNames.SOCIAL_LOGIN]: 'Onboarding_SocialLogin',
  [RouteNames.TERMS_AGREEMENT]: 'AgreeToTerms',

  // 미션
  [RouteNames.MISSION]: 'Home',
  [RouteNames.ARTICLE_DETAIL]: 'Reading',
  [RouteNames.READ_ARTICLE_DETAIL]: 'ReadingDetails',
  [RouteNames.QUIZ]: 'Quiz',

  // 광고
  [RouteNames.AD_LOADING]: 'Advertisement',

  // 검색
  [RouteNames.SEARCH]: 'Explore',
  [RouteNames.SEARCH_INPUT]: 'Search',

  // 캐릭터
  [RouteNames.CHARACTER]: 'Character',
  [RouteNames.CHARACTER_POINT_HISTORY]: 'ConfirmEarnedHistory',
  [RouteNames.CHARACTER_NOTIFICATION]: 'Alarm',

  // 마이페이지
  [RouteNames.MY_PAGE]: 'My',
};

/**
 * 화면 이름을 사용자 친화적인 이름으로 매핑
 * @param routeName 라우트 이름
 * @returns 매핑된 화면 이름 또는 null (매핑되지 않은 경우)
 */
const getScreenName = (routeName: string): string | null => {
  return screenNameMap[routeName] || null;
};

/**
 * 화면이 매핑되어 있는지 확인
 * @param routeName 라우트 이름
 * @returns 매핑 여부
 */
export const isScreenMapped = (routeName: string): boolean => {
  return routeName in screenNameMap;
};

/**
 * 화면 조회 이벤트 로깅
 * @param screenName 화면 이름 (RouteNames 또는 사용자 지정 이름)
 * @param screenClass 화면 클래스 (선택사항)
 * @param forceLog 매핑되지 않은 경우에도 강제로 로그 기록 (기본값: false)
 */
export const logScreenView = async (
  screenName: string,
  screenClass?: string,
  forceLog: boolean = false,
): Promise<void> => {
  try {
    // 프로덕션 모드가 아니면 로그를 찍지 않음
    if (!IS_PRODUCTION) {
      return;
    }

    // RouteNames인 경우 매핑 확인
    const mappedName = getScreenName(screenName);

    // 매핑되지 않았고 forceLog가 false인 경우 로그를 찍지 않음
    if (!mappedName && !forceLog) {
      return;
    }

    // 매핑된 이름이 있으면 사용, 없으면 원래 이름 사용 (forceLog인 경우)
    const finalScreenName = mappedName || screenName;

    // 화면 이름을 직접 이벤트 이름으로 사용 (Firebase 자동 screen_view 대신)
    const analyticsInstance = getAnalytics(getApp());
    await firebaseLogEvent(analyticsInstance, finalScreenName);
  } catch (error) {
    console.error('Analytics logScreenView 오류:', error);
  }
};

/**
 * 커스텀 이벤트 로깅
 * @param eventName 이벤트 이름 (예: 'kakao_login_Onboarding_SocialLogin', 'quiz_start')
 * @param params 이벤트 파라미터 (선택사항)
 */
export const logEvent = async (
  eventName: string,
  params?: Record<string, any>,
): Promise<void> => {
  try {
    // 프로덕션 모드가 아니면 로그를 찍지 않음
    if (!IS_PRODUCTION) {
      return;
    }

    const analyticsInstance = getAnalytics(getApp());
    await firebaseLogEvent(analyticsInstance, eventName, params);
  } catch (error) {
    console.error('Analytics logEvent 오류:', error);
  }
};
