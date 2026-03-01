/**
 * 알림 목록 상태 관리 Store (notificationStore.ts)
 *
 * Zustand를 사용하여 앱 내 알림 데이터를 관리한다.
 *
 * 용도:
 *   - SSE(Server-Sent Events)로 수신한 실시간 알림을 store에 추가
 *   - 캐릭터 화면의 알림 목록에서 읽음 처리
 *   - 서버에서 가져온 기존 알림 목록을 일괄 설정
 *
 * 데이터 흐름:
 *   1. useNotificationSSE 훅이 SSE 연결을 통해 새 알림 수신
 *   2. add() 함수로 알림을 목록 맨 위에 추가 (최신순)
 *   3. 사용자가 알림을 클릭하면 markRead()로 읽음 처리
 */

import { create } from 'zustand';

/**
 * 알림 아이템 타입
 */
export type NotificationItem = {
  /** 알림 고유 ID (서버 발급 또는 클라이언트 생성) */
  id: string;

  /** 알림 제목 */
  title: string;

  /** 알림 내용 (부제목) */
  subtitle: string;

  /** 알림 생성 시각 (예: "12월 25일") */
  createdAt: string;

  /** 읽음 여부 */
  isRead: boolean;

  /** 서버에서 수신한 원본 데이터 (디버깅/확장용) */
  raw?: any;
};

/**
 * 알림 store 상태 인터페이스
 */
type State = {
  /** 알림 목록 (최신순 정렬) */
  list: NotificationItem[];

  /** 새 알림 추가 (목록 맨 위에 삽입) */
  add: (item: NotificationItem) => void;

  /** 특정 알림을 읽음 처리 */
  markRead: (id: string) => void;

  /** 알림 목록 전체 교체 (서버에서 기존 알림 가져올 때 사용) */
  setAll: (items: NotificationItem[]) => void;

  /** 알림 목록 전체 삭제 (개발/테스트용) */
  clear: () => void;
};

/**
 * 알림 상태 관리 Zustand store
 *
 * 동작 방식:
 *   - add: 새 알림을 배열 맨 앞에 추가 (최신순 유지)
 *   - markRead: 해당 ID의 알림을 찾아 isRead를 true로 변경
 *   - setAll: 서버에서 가져온 전체 알림으로 목록 교체
 *   - clear: 모든 알림 삭제 (로그아웃 시 등)
 */
export const useNotificationStore = create<State>(set => ({
  /** 초기 알림 목록: 빈 배열 */
  list: [],

  /**
   * 새 알림을 목록 맨 위에 추가한다.
   *
   * SSE로 실시간 알림이 수신될 때 useNotificationSSE 훅에서 호출된다.
   * 최신 알림이 항상 맨 위에 표시되도록 spread 연산자로 앞에 삽입한다.
   *
   * @param item 추가할 알림 객체
   */
  add: item =>
    set(state => ({
      list: [item, ...state.list], // 새 알림을 맨 앞에 추가 (최신순)
    })),

  /**
   * 특정 알림을 읽음 처리한다.
   *
   * 사용자가 알림을 클릭했을 때 호출되며,
   * 해당 ID의 알림을 찾아 isRead를 true로 변경한다.
   *
   * 읽음 처리된 알림은 UI에서 다른 스타일로 표시될 수 있다.
   * (예: 배경색 변경, 굵은 글씨 해제 등)
   *
   * @param id 읽음 처리할 알림의 고유 ID
   */
  markRead: id =>
    set(state => ({
      list: state.list.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    })),

  /**
   * 알림 목록 전체를 새 목록으로 교체한다.
   *
   * 사용 사례:
   *   - 앱 시작 시 서버에서 기존 알림 목록을 가져올 때
   *   - 알림 목록 화면 진입 시 최신 상태로 동기화할 때
   *
   * @param items 새 알림 목록 (서버에서 가져온 배열)
   */
  setAll: items => set({ list: items }),

  /**
   * 알림 목록을 전체 삭제한다.
   *
   * 사용 사례:
   *   - 로그아웃 시 개인 데이터 초기화
   *   - 개발/테스트 중 알림 목록 리셋
   */
  clear: () => set({ list: [] }),
}));
