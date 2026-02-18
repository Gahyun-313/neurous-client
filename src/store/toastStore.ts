/**
 * 토스트 메시지 상태 관리 Store (toastStore.ts)
 *
 * Zustand를 사용하여 앱 전역에서 간단한 토스트 메시지를 관리한다.
 *
 * 용도:
 *   - 사용자 액션에 대한 즉각적인 피드백 제공
 *   - 성공/실패/정보 알림을 화면 상단/하단에 짧게 표시
 *
 * 사용 패턴:
 *   1. 컴포넌트에서 useShowToast()로 showToast 함수 가져오기
 *   2. showToast("메시지") 호출
 *   3. ToastModal 컴포넌트가 useToastMessage()로 메시지 구독
 *   4. 토스트 표시 후 자동으로 clearToast() 호출하여 메시지 제거
 *
 * 참고: modalStore의 showToastModal과 다른 점
 *   - modalStore: 더 복잡한 설정 가능 (위치, 색상, 지속시간 등)
 *   - toastStore: 단순한 메시지만 빠르게 표시 (deprecated 가능성 있음)
 */

import { create } from 'zustand';

/**
 * 토스트 store 인터페이스
 */
interface ToastStore {
  /** 현재 표시할 토스트 메시지 (null이면 토스트 미표시) */
  toastMessage: string | null;

  /** 토스트 메시지 표시 요청 */
  showToast: (message: string) => void;

  /** 토스트 메시지 제거 (중복 표시 방지용) */
  clearToast: () => void;
}

/**
 * 토스트 메시지 상태 관리 Zustand store
 *
 * 동작 방식:
 *   - showToast: toastMessage를 설정하여 토스트 표시 트리거
 *   - clearToast: toastMessage를 null로 초기화하여 토스트 숨김
 *
 * 중복 방지:
 *   - 토스트가 표시된 직후 clearToast()를 호출해야 함
 *   - 그렇지 않으면 동일한 메시지가 계속 표시될 수 있음
 *   - ToastModal 컴포넌트에서 자동으로 처리하는 것을 권장
 */
export const useToastStore = create<ToastStore>(set => ({
  /** 초기 상태: 토스트 메시지 없음 */
  toastMessage: null,

  /**
   * 토스트 메시지를 설정하여 표시한다.
   *
   * 사용 예시:
   *   const showToast = useShowToast();
   *   showToast("저장되었습니다");
   *
   * 주의:
   *   - 이 함수는 메시지를 설정만 하고, 자동으로 숨기지 않음
   *   - 토스트 컴포넌트에서 일정 시간 후 clearToast() 호출 필요
   *
   * @param message 표시할 토스트 메시지
   */
  showToast: message => set({ toastMessage: message }),

  /**
   * 토스트 메시지를 제거하여 숨긴다.
   *
   * 호출 시점:
   *   - 토스트 표시 후 일정 시간(예: 2초) 경과 시
   *   - ToastModal 컴포넌트의 타이머에서 자동 호출
   *
   * 중복 방지:
   *   - 토스트가 닫힌 후 clearToast()를 호출해야
   *     다음 토스트가 정상적으로 표시됨
   */
  clearToast: () => set({ toastMessage: null }),
}));

// ──────────────────────────────────────────────
// 편의 훅 (Selector Hooks)
// ──────────────────────────────────────────────

/**
 * 편의 훅: showToast 함수만 필요한 경우
 *
 * 토스트를 표시하는 컴포넌트(버튼, 액션 핸들러 등)에서 사용한다.
 * toastMessage 상태 변경 시에도 이 훅을 사용하는 컴포넌트는
 * 리렌더링되지 않는다 (함수는 변경되지 않으므로).
 *
 * @returns showToast 함수
 */
export const useShowToast = () => useToastStore(state => state.showToast);

/**
 * 편의 훅: toastMessage만 필요한 경우
 *
 * 토스트를 렌더링하는 컴포넌트(ToastModal 등)에서 사용한다.
 * toastMessage가 변경될 때만 리렌더링된다.
 *
 * @returns 현재 토스트 메시지 (null이면 토스트 미표시)
 */
export const useToastMessage = () => useToastStore(state => state.toastMessage);

/**
 * 편의 훅: clearToast 함수만 필요한 경우
 *
 * 토스트 컴포넌트에서 타이머 종료 후 메시지를 제거할 때 사용한다.
 *
 * @returns clearToast 함수
 */
export const useClearToast = () => useToastStore(state => state.clearToast);
