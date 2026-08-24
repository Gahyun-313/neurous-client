import { useCallback, useState } from 'react';
import { withdraw } from '../services/authService';

/**
 * 회원 탈퇴 처리를 담당하는 훅
 *
 * 처리 흐름:
 *   1. authService의 withdraw()를 호출해 서버에 탈퇴 요청을 보낸다
 *   2. 요청 중에는 isLoading을 true로 설정해 중복 요청 및 UI 인터랙션을 방지한다
 *   3. 실패 시 error 상태에 저장하고, 호출부에서도 처리할 수 있도록 에러를 다시 throw한다
 *
 * @returns withdrawUserAction - 탈퇴 요청을 실행하는 비동기 함수
 * @returns isLoading          - 탈퇴 요청 진행 중 여부 (버튼 비활성화 등 UI 처리용)
 * @returns error              - 탈퇴 요청 실패 시 저장되는 에러 객체 (null이면 정상)
 */
export function useWithdrawUser() {
  /** 탈퇴 요청 진행 중 여부 */
  const [isLoading, setIsLoading] = useState(false);

  /** 탈퇴 요청 중 발생한 에러 (없으면 null) */
  const [error, setError] = useState<Error | null>(null);

  /**
   * 회원 탈퇴 요청을 실행한다.
   *
   * - 에러 발생 시 error 상태에 저장한 뒤 다시 throw한다.
   *   → 훅 내부에서 상태를 기록하면서도, 호출부(화면)에서
   *     탈퇴 실패 모달 표시 등 추가 처리가 가능하도록 에러를 전파한다.
   * - finally 블록에서 isLoading을 해제해 성공/실패 모두 로딩이 종료되도록 보장한다.
   *
   * @throws 서버 요청 실패 시 에러를 throw하므로 호출부에서 try-catch 처리 필요
   */
  const withdrawUserAction = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // 이전 에러 초기화 후 새 요청 시작

      await withdraw();
    } catch (e: any) {
      // 에러를 로컬 상태에 저장하고, 호출부로도 전파
      setError(e);
      throw e;
    } finally {
      // 성공/실패 여부와 관계없이 로딩 상태 해제
      setIsLoading(false);
    }
  }, []); // withdraw는 외부 의존성 없이 고정된 함수이므로 deps 배열 비움

  return {
    withdrawUserAction,
    isLoading,
    error,
  };
}
