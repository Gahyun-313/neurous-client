/**
 * 온보딩 상태 관리 Store (onboardingStore.ts)
 *
 * Zustand를 사용하여 온보딩 진행 상태를 관리한다.
 *
 * 설계 원칙:
 *   - Store는 상태 관리만 담당, 실제 저장 로직은 onboardingService에 위임
 *   - 나중에 서버 API 연동 시 onboardingService만 수정하면 됨
 *   - RootNavigator가 isOnboardingCompleted를 구독하여 화면 전환 결정
 *
 * 데이터 흐름:
 *   1. 앱 시작 시 loadOnboardingStatus()로 AsyncStorage에서 상태 불러오기
 *   2. 사용자가 단계를 진행할 때마다 setOnboardingStep() 호출
 *   3. 관심분야/난이도 선택 시 setInterests() / setDifficulty() 호출
 *   4. 온보딩 완료 시 completeOnboarding() 호출 → 메인 화면으로 전환
 */

import { create } from 'zustand';
import {
  getOnboardingStatus,
  completeOnboarding as completeOnboardingService,
  saveOnboardingStep as saveOnboardingStepService,
  saveInterests as saveInterestsService,
  saveDifficulty as saveDifficultyService,
  resetOnboarding as resetOnboardingService,
  type OnboardingStep,
  type InterestsData,
} from '../services/onboardingService';
import { LevelCategory } from '../types/interests';

// ──────────────────────────────────────────────
// 타입 재export (외부에서 사용 가능하도록)
// ──────────────────────────────────────────────
export type { OnboardingStep, InterestsData };

/**
 * 온보딩 store 인터페이스
 */
interface OnboardingStore {
  /** 온보딩 완료 여부 (RootNavigator가 이 값을 구독하여 화면 분기) */
  isOnboardingCompleted: boolean;

  /** 현재 온보딩 진행 단계 */
  currentStep: OnboardingStep;

  /** 선택된 관심분야 (미선택 시 null) */
  interests: InterestsData | null;

  /** 선택된 난이도 (미선택 시 null) */
  difficulty: LevelCategory | null;

  /** 온보딩 완료 처리 (AsyncStorage + Zustand 상태 업데이트) */
  completeOnboarding: () => Promise<void>;

  /** 온보딩 단계 저장 (AsyncStorage + Zustand 상태 업데이트) */
  setOnboardingStep: (step: OnboardingStep) => Promise<void>;

  /** 관심분야 저장 (AsyncStorage + Zustand 상태 업데이트) */
  setInterests: (interests: InterestsData) => Promise<void>;

  /** 난이도 저장 (AsyncStorage + Zustand 상태 업데이트) */
  setDifficulty: (difficulty: LevelCategory) => Promise<void>;

  /** 온보딩 상태 초기화 (개발/테스트용 또는 로그아웃 시 사용) */
  resetOnboarding: (initialStep?: OnboardingStep) => Promise<void>;

  /** AsyncStorage에서 온보딩 상태 불러오기 (앱 시작 시 호출) */
  loadOnboardingStatus: () => Promise<void>;
}

/**
 * 온보딩 상태 관리 Zustand store
 *
 * 모든 상태 변경 함수는 onboardingService를 통해
 * AsyncStorage에 먼저 저장한 후 Zustand 상태를 업데이트한다.
 *
 * 에러 발생 시에도 사용자에게 에러를 throw하지 않고
 * 콘솔 로그만 남기고 계속 진행한다 (UX 보호).
 */
export const useOnboardingStore = create<OnboardingStore>(set => ({
  /** 초기 상태: 온보딩 미완료, login 단계 */
  isOnboardingCompleted: false,
  currentStep: 'login',
  interests: null,
  difficulty: null,

  /**
   * 온보딩 완료 처리
   *
   * 처리 흐름:
   *   1. onboardingService를 통해 AsyncStorage에 완료 플래그 저장
   *   2. Zustand 상태를 isOnboardingCompleted: true로 변경
   *   3. RootNavigator가 이 변경을 감지하여 메인 화면으로 전환
   *
   * 호출 시점:
   *   - 난이도 선택 완료 후 "시작하기" 버튼 클릭 시
   *   - 기존 사용자 자동 로그인 후 알림 권한 처리 완료 시
   */
  completeOnboarding: async () => {
    try {
      await completeOnboardingService();
      console.log('온보딩 완료! 메인 화면으로 전환합니다.');
      set({ isOnboardingCompleted: true, currentStep: 'completed' });
    } catch (error) {
      console.error('온보딩 완료 상태 저장 실패:', error);
      // 에러 발생해도 상태는 업데이트하여 진행 가능하도록 함
    }
  },

  /**
   * 온보딩 진행 단계를 저장한다.
   *
   * 앱 종료 후 재진입 시 마지막 단계부터 이어서 진행할 수 있도록
   * AsyncStorage에 현재 단계를 저장한다.
   *
   * @param step 저장할 온보딩 단계
   */
  setOnboardingStep: async (step: OnboardingStep) => {
    try {
      await saveOnboardingStepService(step);
      set({ currentStep: step });
    } catch (error) {
      console.error('온보딩 단계 저장 실패:', error);
    }
  },

  /**
   * 관심분야 선택 정보를 저장한다.
   *
   * InterestsScreen에서 사용자가 3개의 관심분야를 선택하고
   * "다음" 버튼을 누르면 호출된다.
   *
   * @param interests 선택된 관심분야와 우선순위
   */
  setInterests: async (interests: InterestsData) => {
    try {
      await saveInterestsService(interests);
      set({ interests });
    } catch (error) {
      console.error('관심분야 저장 실패:', error);
    }
  },

  /**
   * 난이도 선택 정보를 저장한다.
   *
   * DifficultyScreen에서 사용자가 학습 난이도를 선택하고
   * "완료" 버튼을 누르면 호출된다.
   *
   * @param difficulty 선택된 난이도 (BEGINNER | INTERMEDIATE | ADVANCED)
   */
  setDifficulty: async (difficulty: LevelCategory) => {
    try {
      await saveDifficultyService(difficulty);
      set({ difficulty });
    } catch (error) {
      console.error('난이도 저장 실패:', error);
    }
  },

  /**
   * 온보딩 상태를 초기화한다.
   *
   * 처리 흐름:
   *   1. onboardingService를 통해 AsyncStorage의 온보딩 관련 키 전체 삭제
   *   2. initialStep이 'login'이 아니면 해당 단계로 설정 (부분 리셋)
   *   3. Zustand 상태를 초기값으로 리셋
   *
   * 사용 사례:
   *   - 개발/테스트 중 온보딩을 처음부터 다시 진행하고 싶을 때
   *   - 로그아웃 시 온보딩 상태 초기화 (필요한 경우)
   *   - client.ts의 토큰 재발급 실패 시 자동 호출
   *
   * @param initialStep 초기화 후 시작할 단계 (기본값: 'login')
   */
  resetOnboarding: async (initialStep: OnboardingStep = 'login') => {
    try {
      await resetOnboardingService();

      // initialStep이 'login'이 아니면 해당 단계로 설정
      // (예: 관심분야부터 다시 시작하고 싶을 때)
      const stepToSet = initialStep;
      if (stepToSet !== 'login') {
        await saveOnboardingStepService(stepToSet);
      }

      set({
        isOnboardingCompleted: false,
        currentStep: stepToSet,
        interests: null,
        difficulty: null,
      });
    } catch (error) {
      console.error('온보딩 상태 초기화 실패:', error);
    }
  },

  /**
   * AsyncStorage에서 온보딩 상태를 불러와 Zustand 상태에 반영한다.
   *
   * 앱 시작 시 RootNavigator의 useEffect에서 호출되며,
   * 저장된 온보딩 상태를 복원하여 적절한 화면으로 이동한다.
   *
   * 에러 발생 시:
   *   - 안전하게 초기 상태(login 단계)로 폴백한다.
   *   - 사용자는 로그인 화면부터 다시 시작하게 된다.
   */
  loadOnboardingStatus: async () => {
    try {
      const data = await getOnboardingStatus();
      set({
        isOnboardingCompleted: data.isCompleted,
        currentStep: data.step,
        interests: data.interests,
        difficulty: data.difficulty,
      });
    } catch (error) {
      console.error('온보딩 상태 불러오기 실패:', error);
      // 에러 발생 시 안전하게 초기 상태로 폴백
      set({
        isOnboardingCompleted: false,
        currentStep: 'login',
        interests: null,
        difficulty: null,
      });
    }
  },
}));

// ──────────────────────────────────────────────
// 편의 훅 (Selector Hooks)
// ──────────────────────────────────────────────

/**
 * 편의 훅: 온보딩 완료 상태만 필요한 경우
 *
 * RootNavigator가 이 훅을 사용하여 온보딩 완료 여부를 구독한다.
 * isOnboardingCompleted 값이 변경될 때만 리렌더링된다.
 *
 * @returns isOnboardingCompleted 값
 */
export const useIsOnboardingCompleted = () =>
  useOnboardingStore(state => state.isOnboardingCompleted);

/**
 * 편의 훅: completeOnboarding 함수만 필요한 경우
 *
 * DifficultyScreen, LoginScreen 등에서 온보딩 완료 처리 시 사용한다.
 *
 * @returns completeOnboarding 함수
 */
export const useCompleteOnboarding = () =>
  useOnboardingStore(state => state.completeOnboarding);
