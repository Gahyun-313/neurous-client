import EventSource from 'react-native-sse';
import client from './client';
import { getAuthToken } from '../services/authService';

let es: EventSource | null = null;

export type NotificationSSEHandlers = {
  onConnect?: (raw: string) => void;
  onMessage?: (raw: string) => void;
  onError?: (e: any) => void;
};

/**
 * SSE 구독 시작
 * - unsubscribe 함수 반환 (axios 느낌)
 */
export async function subscribeNotificationsSSE(
  handlers: NotificationSSEHandlers = {},
) {
  if (es) return () => unsubscribeNotificationsSSE();

  const token = await getAuthToken();
  if (!token) throw new Error('accessToken 없음');

  const baseURL =
    (client.defaults.baseURL as string | undefined) ??
    'http://34.64.75.53:8080';

  es = new EventSource(`${baseURL}/api/notifications/subscribe`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  // ✅ 커스텀 이벤트 타입 TS 에러 방지
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

export function unsubscribeNotificationsSSE() {
  if (!es) return;
  try {
    es.removeAllEventListeners();
    es.close();
  } catch {}
  es = null;
}
