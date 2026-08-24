/**
 * 포인트 상태 관리 Store (pointStore.ts)
 *
 * Zustand를 사용하여 앱 전역에서 사용자의 포인트를 관리한다.
 *
 * 용도:
 *   - 퀴즈 정답/오답 시 포인트 추가/차감 (QUIZ_CORRECT/INCORRECT_POINT)
 *   - 출석 체크 시 포인트 추가 (DAILY_ATTENDANCE_POINT)
 *   - 캐릭터 화면에서 현재 포인트 표시
 *
 * 중요: 이 store는 UI 표시용 임시 상태 관리만 담당한다.
 *       실제 서버 동기화는 각 화면/훅에서 API 호출로 별도 처리한다.
 *       (예: QuizScreen에서 submitQuiz API로 서버에 포인트 반영)
 *
 * 참고: experienceStore와 구조가 동일하며, 경험치와 포인트를 별도로 관리한다.
 */

import { create } from 'zustand';

/**
 * 포인트 store 인터페이스
 */
interface PointStore {
  /** 현재 포인트 */
  points: number;

  /** 포인트를 특정 값으로 설정 (서버에서 최신 값을 받아왔을 때 사용) */
  setPoints: (points: number) => void;

  /** 포인트를 증가 (퀴즈 정답, 출석 체크 시 사용) */
  addPoints: (amount: number) => void;

  /** 포인트를 차감 (퀴즈 오답 시 사용) */
  subtractPoints: (amount: number) => void;
}

/**
 * 포인트 상태 관리 Zustand store
 *
 * 상태 변경 함수들은 모두 try-catch로 감싸져 있어
 * 예상치 못한 오류 발생 시에도 앱이 크래시되지 않도록 방어한다.
 *
 * 디버깅용 콘솔 로그가 포함되어 있어 포인트 변동 추적이 가능하다.
 */
export const usePointStore = create<PointStore>((set, get) => ({
  /** 초기 포인트: 0 */
  points: 0,

  /**
   * 포인트를 특정 값으로 직접 설정한다.
   *
   * 사용 사례:
   *   - 앱 시작 시 서버에서 최신 포인트를 가져와 초기화
   *   - 캐릭터 화면 진입 시 서버 동기화
   *
   * @param points 설정할 포인트 값
   */
  setPoints: (points: number) => {
    try {
      set({ points });
    } catch (error) {
      console.error('포인트 저장 실패:', error);
    }
  },

  /**
   * 포인트를 증가시킨다.
   *
   * 사용 사례:
   *   - 퀴즈 정답 시 (QUIZ_CORRECT_POINT 만큼 추가)
   *   - 출석 체크 시 (DAILY_ATTENDANCE_POINT 만큼 추가)
   *
   * 주의: 이 함수는 로컬 상태만 업데이트하며, 서버 동기화는 별도로 처리해야 한다.
   *
   * @param amount 증가시킬 포인트 양 (양수)
   */
  addPoints: (amount: number) => {
    try {
      set({ points: get().points + amount });
      console.log(
        '포인트 추가 성공:',
        get().points + amount, // 추가된 결과값
        '현재 포인트:',
        get().points, // 최종 포인트 (콘솔 출력 순서상 이전 값이 보일 수 있음)
      );
    } catch (error) {
      console.error('포인트 추가 실패:', error);
    }
  },

  /**
   * 포인트를 차감한다.
   *
   * 사용 사례:
   *   - 퀴즈 오답 시 (QUIZ_INCORRECT_POINT 만큼 차감)
   *
   * 주의: 음수가 되지 않도록 호출부에서 검증이 필요할 수 있다.
   *       (예: Math.max(0, points - amount))
   *
   * @param amount 차감할 포인트 양 (양수)
   */
  subtractPoints: (amount: number) => {
    try {
      set({ points: get().points - amount });
      console.log(
        '포인트 차감 성공:',
        get().points - amount, // 차감된 결과값
        '현재 포인트:',
        get().points, // 최종 포인트
      );
    } catch (error) {
      console.error('포인트 차감 실패:', error);
    }
  },
}));
