import EventSource from 'react-native-sse';
import { getAuthToken } from '../services/authService';
import { IS_PRODUCTION } from '../config/env';
import { DEV_URL, PROD_URL } from '../config/api';

// SSE 인스턴스 (전역 단일 연결 유지)
let es: EventSource | null = null;

export type NotificationSSEHandlers = {
  onConnect?: (raw: string) => void;
  onMessage?: (raw: string) => void;
  onError?: (e: any) => void;
};

/**
 * SSE 구독 시작
 * - 앱이 포그라운드 상태일 때 서버 알림을 실시간으로 수신
 * - 이미 연결된 경우 새 연결 없이 기존 unsubscribe 함수 반환
 * - 반환된 함수를 호출하면 연결 해제 (axios 취소 토큰과 유사한 패턴)
 */
export async function subscribeNotificationsSSE(
  handlers: NotificationSSEHandlers = {},
) {
  // 중복 연결 방지
  if (es) return () => unsubscribeNotificationsSSE();

  const token = await getAuthToken();
  if (!token) throw new Error('accessToken 없음');

  // 환경별 baseURL 분기
  const baseURL = IS_PRODUCTION ? PROD_URL : DEV_URL;

  es = new EventSource(`${baseURL}/api/notifications/subscribe`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  // react-native-sse의 커스텀 이벤트는 TS 타입 미지원 → as any 처리
  es.addEventListener('connect' as any, (e: any) => {
    handlers.onConnect?.(String(e?.data ?? ''));
  });

  es.addEventListener('message' as any, (e: any) => {
    handlers.onMessage?.(String(e?.data ?? ''));
  });

  es.addEventListener('error' as any, (e: any) => {
    handlers.onError?.(e);
  });

  return () => unsubscribeNotificationsSSE();
}

/**
 * SSE 연결 해제
 * - 이벤트 리스너 제거 후 연결 종료
 * - 앱 백그라운드 전환 또는 로그아웃 시 호출
 */
export function unsubscribeNotificationsSSE() {
  if (!es) return;
  try {
    es.removeAllEventListeners();
    es.close();
  } catch {}
  es = null;
}

/**
 * FCM 디바이스 토큰을 서버에 등록
 * - 앱 실행 시 발급된 FCM 토큰을 서버에 저장
 * - 서버는 이 토큰으로 백그라운드/종료 상태의 디바이스에 푸시 발송
 * - 백엔드 미구현 시 호출 실패해도 앱 동작에 영향 없음
 */
export async function registerFCMToken(token: string): Promise<void> {
  // TODO: 백엔드 엔드포인트 확정 후 URL 수정
  // await client.post('/api/notifications/device-token', { token });
  if (__DEV__)
    console.log('[FCM] 토큰 서버 등록 대기 중 (백엔드 미연동):', token);
}
