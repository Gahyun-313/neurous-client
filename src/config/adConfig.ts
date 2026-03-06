// src/config/adConfig.ts

import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_REWARDED_ANDROID, ADMOB_REWARDED_IOS } from './api';
import { IS_PRODUCTION } from './env';

/**
 * AdMob 광고 설정
 *
 * IS_PRODUCTION에 따라 실제 광고 또는 테스트 광고를 표시합니다.
 *
 * 프로덕션 모드 (IS_PRODUCTION = true):
 * - 실제 AdMob 광고 단위 ID 사용
 * - 실제 광고 수익 발생
 *
 * 개발/테스트 모드 (IS_PRODUCTION = false):
 * - Google 제공 테스트 광고 ID 사용 (TestIds.REWARDED)
 * - 광고 수익 발생하지 않음
 * - AdMob 정책 위반 방지
 *
 * 환경 설정은 src/config/env.ts에서 관리합니다.
 */

// 리워드 광고 단위 ID
export const REWARDED_AD_UNIT_ID = IS_PRODUCTION
  ? Platform.select({
      android: ADMOB_REWARDED_ANDROID,
      ios: ADMOB_REWARDED_IOS,
    }) || TestIds.REWARDED
  : TestIds.REWARDED;
