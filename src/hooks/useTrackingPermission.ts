import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * iOS 사용자 추적 권한(ATT) 관리 훅
 */
export const useTrackingPermission = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      return true; // Android는 항상 허용된 것으로 간주
    }

    try {
      const status = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      console.log('[ATT] 권한 상태:', status); // 디버깅용 로그
      return status === RESULTS.GRANTED;
    } catch (error) {
      console.error('추적 권한 확인 중 오류:', error);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      return true; // Android는 항상 허용된 것으로 간주
    }

    setIsChecking(true);
    try {
      const status = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      console.log('[ATT] request() 결과:', status); // 디버깅용 로그

      if (status === RESULTS.GRANTED) {
        return true;
      } else if (status === RESULTS.DENIED) {
        // 사용자가 거부한 경우 - 모달이 뜨지 않음
        console.log('[ATT] 권한 거부됨 - 모달이 표시되지 않습니다');
        return false;
      } else if (status === RESULTS.BLOCKED) {
        // 사용자가 설정에서 차단한 경우 - 모달이 뜨지 않음
        console.log('[ATT] 권한 차단됨 - 설정에서만 변경 가능');
        return false;
      } else if (status === RESULTS.UNAVAILABLE) {
        // 추적 기능을 사용할 수 없음 (iOS 14 미만 등)
        console.log('[ATT] 추적 기능 사용 불가');
        return false;
      }

      console.log('[ATT] 알 수 없는 상태:', status);
      return false;
    } catch (error: any) {
      console.error('추적 권한 요청 중 오류:', error);
      // 에러 발생 시 false 반환 (앱 크래시 방지)
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkPermission,
    requestPermission,
    isChecking,
  };
};
