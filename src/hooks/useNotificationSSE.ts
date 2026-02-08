import { useEffect, useRef } from 'react';
import { subscribeNotificationsSSE } from '../api/notificationApi';
import { useNotificationStore } from '../store/notificationStore';

const nowKorean = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1);
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}월 ${dd}일`;
};

export function useNotificationSSE() {
  const startedRef = useRef(false);
  const add = useNotificationStore(s => s.add);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let off: null | (() => void) = null;

    (async () => {
      off = await subscribeNotificationsSSE({
        onConnect: raw => {
          if (__DEV__) console.log('[SSE connect]', raw);
        },

        onMessage: raw => {
          // 서버가 JSON이면 파싱, 아니면 문자열로 처리
          let parsed: any = raw;
          try {
            parsed = raw ? JSON.parse(raw) : raw;
          } catch {}

          const title =
            parsed?.title ??
            parsed?.notificationTitle ??
            '새 알림이 도착했어요';

          const subtitle =
            parsed?.body ??
            parsed?.message ??
            parsed?.content ??
            (typeof parsed === 'string' ? parsed : '알림을 확인해 주세요');

          const id = String(
            parsed?.id ??
              parsed?.notificationId ??
              `${Date.now()}-${Math.random()}`,
          );

          add({
            id,
            title,
            subtitle,
            createdAt: parsed?.createdAt ?? nowKorean(),
            isRead: false,
            raw: parsed,
          });
        },

        onError: e => {
          if (__DEV__) console.log('[SSE error]', e);
        },
      });
    })();

    return () => {
      off?.();
      startedRef.current = false;
    };
  }, [add]);
}
