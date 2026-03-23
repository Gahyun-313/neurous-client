import { useEffect, useRef } from 'react';
import { subscribeNotificationsSSE } from '../api/notificationApi';
import { useNotificationStore } from '../store/notificationStore';
import { useIsOnboardingCompleted } from '../store/onboardingStore';

// 현재 날짜를 한국어 형식으로 반환 (예: "3월 10일")
const nowKorean = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1);
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}월 ${dd}일`;
};

/**
 * SSE 기반 실시간 알림 수신 훅
 * - 앱이 포그라운드 상태일 때만 동작
 * - 백그라운드/종료 상태의 알림은 FCM(usePushNotification)이 담당
 * - 로그인(온보딩 완료) 후에만 SSE 연결 시작
 * - 중복 구독 방지를 위해 startedRef로 단일 연결 보장
 */
export function useNotificationSSE() {
  // 중복 구독 방지 플래그 (StrictMode 이중 실행 대응)
  const startedRef = useRef(false);
  const add = useNotificationStore(s => s.add);
  // 로그인 완료 여부 확인 (미완료 시 accessToken 없음 에러 방지)
  const isOnboardingCompleted = useIsOnboardingCompleted();

  useEffect(() => {
    // 로그인 전이면 SSE 연결하지 않음
    if (!isOnboardingCompleted) return;
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

          // 서버 응답 필드명이 다를 수 있어 우선순위 순으로 fallback
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

    // 언마운트 시 SSE 연결 해제 및 플래그 초기화
    return () => {
      off?.();
      startedRef.current = false;
    };
  }, [add, isOnboardingCompleted]); // isOnboardingCompleted 변경 시 재실행
}
