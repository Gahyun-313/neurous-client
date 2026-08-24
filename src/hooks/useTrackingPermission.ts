import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * iOS 앱 추적 투명성(ATT, App Tracking Transparency) 권한을 관리하는 훅
 *
 * - iOS 14 이상에서 사용자 데이터 추적 전 반드시 권한을 요청해야 함
 * - Android는 ATT 개념이 없으므로 항상 허용된 것으로 간주
 *
 * @returns checkPermission  - 현재 ATT 권한 상태를 조회하는 함수
 * @returns requestPermission - ATT 권한을 사용자에게 요청하는 함수
 * @returns isChecking        - 권한 요청이 진행 중인지 여부 (중복 요청 방지용 로딩 상태)
 */
export const useTrackingPermission = () => {
  /** 권한 요청 진행 중 여부 (UI 로딩 처리 등에 활용) */
  const [isChecking, setIsChecking] = useState(false);

  /**
   * 현재 ATT 권한 상태를 조회한다.
   * 권한 요청 다이얼로그를 띄우지 않고 현재 상태만 읽어온다.
   *
   * @returns 권한이 허용된 경우 true, 그 외(거부/차단/불가)는 false
   */
  const checkPermission = useCallback(async (): Promise<boolean> => {
    // Android는 ATT가 없으므로 항상 허용으로 처리
    if (Platform.OS !== 'ios') {
      return true;
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

  /**
   * 사용자에게 ATT 권한 요청 다이얼로그를 표시한다.
   * 이미 거부(DENIED)되거나 차단(BLOCKED)된 경우 다이얼로그가 뜨지 않는다.
   *
   * 상태별 처리:
   *   - GRANTED   : 사용자가 허용 → true 반환
   *   - DENIED    : 사용자가 이번에 거부 → false 반환 (다이얼로그 미표시)
   *   - BLOCKED   : 설정에서 차단된 상태 → false 반환 (설정 앱에서만 변경 가능)
   *   - UNAVAILABLE: iOS 14 미만 등 추적 기능 자체를 지원하지 않는 환경 → false 반환
   *
   * @returns 권한이 허용된 경우 true, 그 외 모든 경우 false
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Android는 ATT가 없으므로 항상 허용으로 처리
    if (Platform.OS !== 'ios') {
      return true;
    }

    setIsChecking(true);
    try {
      const status = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      console.log('[ATT] request() 결과:', status); // 디버깅용 로그

      if (status === RESULTS.GRANTED) {
        // 사용자가 추적을 허용한 경우
        return true;
      } else if (status === RESULTS.DENIED) {
        // 사용자가 이번 요청에서 거부한 경우
        // → 이미 한 번 거부된 상태라 다이얼로그가 다시 뜨지 않음
        console.log('[ATT] 권한 거부됨 - 모달이 표시되지 않습니다');
        return false;
      } else if (status === RESULTS.BLOCKED) {
        // 기기 설정에서 추적이 차단된 경우
        // → 앱 내에서 재요청 불가, 사용자가 직접 설정 앱에서 변경해야 함
        console.log('[ATT] 권한 차단됨 - 설정에서만 변경 가능');
        return false;
      } else if (status === RESULTS.UNAVAILABLE) {
        // iOS 14 미만이거나 기기가 ATT를 지원하지 않는 경우
        console.log('[ATT] 추적 기능 사용 불가');
        return false;
      }

      // 위 케이스에 해당하지 않는 예외 상태
      console.log('[ATT] 알 수 없는 상태:', status);
      return false;
    } catch (error: any) {
      // 권한 요청 자체가 실패한 경우 → 앱 크래시 방지를 위해 false 반환
      console.error('추적 권한 요청 중 오류:', error);
      return false;
    } finally {
      // 성공/실패 여부와 관계없이 로딩 상태 해제
      setIsChecking(false);
    }
  }, []);

  return {
    checkPermission,
    requestPermission,
    isChecking,
  };
};
