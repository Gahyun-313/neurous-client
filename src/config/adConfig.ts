import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * 앱 프로덕션 설정
 *
 * IS_PRODUCTION을 true로 설정하면:
 * - Analytics 로그가 활성화됩니다
 * - 실제 광고가 표시됩니다
 * - 프로덕션 API 서버를 사용합니다
 *
 * 개발/테스트/내부테스트 중에는 false로 설정하세요.
 * 실제 배포 시에만 true로 변경하세요.
 */
export const IS_PRODUCTION = true; // true로 변경하면 프로덕션 모드로 동작합니다

// 리워드 광고 단위 ID
export const REWARDED_AD_UNIT_ID = IS_PRODUCTION
  ? Platform.select({
      android: 'ca-app-pub-5312046759396775/6312225428',
      ios: 'ca-app-pub-5312046759396775/2738784252',
    }) || TestIds.REWARDED
  : TestIds.REWARDED;
