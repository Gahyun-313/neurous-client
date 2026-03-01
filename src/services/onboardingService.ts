/**
 * 온보딩 상태 관리 서비스 (onboardingService.ts)
 *
 * AsyncStorage를 통해 온보딩 진행 상태, 관심분야, 난이도 선택 정보를 저장/조회한다.
 *
 * AsyncStorage 키 구조:
 *   @onboarding_completed : 'true' | null (온보딩 완료 여부)
 *   @onboarding_step      : 'login' | 'interests' | 'difficulty' | 'completed'
 *   @onboarding_interests : JSON 문자열 (Record<string, number>)
 *   @onboarding_difficulty: JSON 문자열 (LevelCategory)
 *
 * 나중에 서버 API 연동 시 이 서비스 파일만 수정하면 되도록 설계되었다.
 * onboardingStore는 이 서비스를 호출만 하고, 저장 로직은 여기 집중되어 있다.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelCategory } from '../types/interests';
import { getAuthToken } from './authService';

// ──────────────────────────────────────────────
// AsyncStorage 키 상수
// ──────────────────────────────────────────────
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const ONBOARDING_STEP_KEY = '@onboarding_step';
const INTERESTS_KEY = '@onboarding_interests';
const DIFFICULTY_KEY = '@onboarding_difficulty';

/**
 * 온보딩 진행 단계
 *   - login      : 로그인 화면 (온보딩 시작 전)
 *   - interests  : 관심분야 선택 화면
 *   - difficulty : 난이도 선택 화면
 *   - completed  : 온보딩 완료
 */
export type OnboardingStep = 'login' | 'interests' | 'difficulty' | 'completed';

/**
 * 관심분야 데이터 타입
 * key: 관심분야 카테고리 (InterestCategory enum 문자열)
 * value: 우선순위 (1, 2, 3)
 *
 * 예시: { "IT_TECH": 1, "ECONOMY": 2, "HEALTH": 3 }
 */
export type InterestsData = Record<string, number>;

/**
 * 온보딩 전체 상태를 나타내는 인터페이스
 */
export interface OnboardingData {
  isCompleted: boolean; // 온보딩 완료 여부
  step: OnboardingStep; // 현재 진행 단계
  interests: InterestsData | null; // 선택된 관심분야 (미선택 시 null)
  difficulty: LevelCategory | null; // 선택된 난이도 (미선택 시 null)
}

// ──────────────────────────────────────────────
// 온보딩 상태 조회
// ──────────────────────────────────────────────

/**
 * AsyncStorage에서 온보딩 상태를 조회한다.
 *
 * 처리 로직:
 *   1. 온보딩 완료 플래그가 'true'면 → completed 상태 반환
 *   2. 로그인 토큰은 있는데 관심분야/난이도가 없으면 → 온보딩 미완료로 리셋
 *      (앱 삭제 후 재설치, 또는 데이터 불일치 상황 방어)
 *   3. 진행 중인 step이 있으면 → 해당 step 반환
 *   4. 아무것도 없으면 → login 단계 (온보딩 시작 전)
 *
 * @returns 온보딩 전체 상태 (isCompleted, step, interests, difficulty)
 */
export const getOnboardingStatus = async (): Promise<OnboardingData> => {
  try {
    // AsyncStorage에서 각 키 조회
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const step = (await AsyncStorage.getItem(
      ONBOARDING_STEP_KEY,
    )) as OnboardingStep | null;
    const interestsStr = await AsyncStorage.getItem(INTERESTS_KEY);
    const difficultyStr = await AsyncStorage.getItem(DIFFICULTY_KEY);

    // JSON 파싱 (없으면 null)
    const difficulty: LevelCategory | null = difficultyStr
      ? (JSON.parse(difficultyStr) as LevelCategory)
      : null;

    const interests: InterestsData | null = interestsStr
      ? JSON.parse(interestsStr)
      : null;

    // ── CASE 1. 온보딩 완료 상태 ─────────────────────────
    if (completed === 'true') {
      return {
        isCompleted: true,
        step: 'completed',
        interests,
        difficulty,
      };
    }

    // ── CASE 2. 데이터 불일치 감지 (토큰은 있는데 온보딩 정보 없음) ──
    // 로그인 토큰은 있지만 관심분야나 난이도가 없는 경우
    // → 앱 삭제 후 재설치, 또는 온보딩 중단 후 앱 종료 등의 상황
    // → 온보딩 미완료로 리셋하여 다시 진행하도록 유도
    const token = await getAuthToken();
    if (token && (!interests || !difficulty)) {
      // 온보딩 완료 플래그 제거
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);

      // step이 없거나 'completed'로 잘못 설정된 경우 'interests'로 초기화
      if (!step || step === 'completed') {
        await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'interests');
      }

      return {
        isCompleted: false,
        // 난이도 단계까지 갔으면 그대로 유지, 아니면 관심분야부터 다시 시작
        step: step === 'difficulty' ? 'difficulty' : 'interests',
        interests,
        difficulty,
      };
    }

    // ── CASE 3. 온보딩 진행 중 ─────────────────────────────
    if (step) {
      return {
        isCompleted: false,
        step,
        interests,
        difficulty,
      };
    }

    // ── CASE 4. 온보딩 시작 전 (초기 상태) ─────────────────
    return {
      isCompleted: false,
      step: 'login',
      interests: null,
      difficulty: null,
    };
  } catch (error) {
    console.error('온보딩 상태 조회 실패:', error);
    // 오류 발생 시 안전하게 초기 상태 반환
    return {
      isCompleted: false,
      step: 'login',
      interests: null,
      difficulty: null,
    };
  }
};

// ──────────────────────────────────────────────
// 온보딩 상태 저장
// ──────────────────────────────────────────────

/**
 * 온보딩 완료 처리
 *
 * @onboarding_completed를 'true'로 설정하고
 * @onboarding_step을 'completed'로 변경한다.
 *
 * 이후 앱 재진입 시 getOnboardingStatus()에서 completed 상태를 인식하여
 * 메인 화면으로 바로 진입한다.
 */
export const completeOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'completed');
  } catch (error) {
    console.error('온보딩 완료 저장 실패:', error);
    throw error;
  }
};

/**
 * 온보딩 진행 단계를 저장한다.
 *
 * 사용자가 각 단계를 넘어갈 때마다 호출되어
 * 앱 종료 후 재진입 시 이어서 진행할 수 있도록 한다.
 *
 * @param step 저장할 온보딩 단계 ('login' | 'interests' | 'difficulty' | 'completed')
 */
export const saveOnboardingStep = async (
  step: OnboardingStep,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step);
  } catch (error) {
    console.error('온보딩 단계 저장 실패:', error);
    throw error;
  }
};

/**
 * 관심분야 선택 정보를 저장한다.
 *
 * InterestsScreen에서 사용자가 3개의 관심분야를 선택하고
 * "다음" 버튼을 누르면 호출된다.
 *
 * @param interests 선택된 관심분야와 우선순위 (Record<string, number>)
 *                   예: { "IT_TECH": 1, "ECONOMY": 2, "HEALTH": 3 }
 */
export const saveInterests = async (
  interests: InterestsData,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
  } catch (error) {
    console.error('관심분야 저장 실패:', error);
    throw error;
  }
};

/**
 * 난이도 선택 정보를 저장한다.
 *
 * DifficultyScreen에서 사용자가 학습 난이도를 선택하고
 * "완료" 버튼을 누르면 호출된다.
 *
 * @param difficulty 선택된 난이도 (LevelCategory 타입)
 *                    예: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
 */
export const saveDifficulty = async (
  difficulty: LevelCategory,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(DIFFICULTY_KEY, JSON.stringify(difficulty));
  } catch (error) {
    console.error('난이도 저장 실패:', error);
    throw error;
  }
};

// ──────────────────────────────────────────────
// 온보딩 상태 초기화 (개발/테스트용)
// ──────────────────────────────────────────────

/**
 * 온보딩 관련 모든 AsyncStorage 키를 삭제한다.
 *
 * 개발/테스트 시 온보딩을 처음부터 다시 진행하고 싶을 때 사용한다.
 * 설정 화면의 "온보딩 초기화" 버튼 등에서 호출될 수 있다.
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
    await AsyncStorage.removeItem(INTERESTS_KEY);
    await AsyncStorage.removeItem(DIFFICULTY_KEY);
  } catch (error) {
    console.error('온보딩 상태 초기화 실패:', error);
    throw error;
  }
};
