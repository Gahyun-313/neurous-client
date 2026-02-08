/**
 * 회원 탈퇴 훅
 */
import { useCallback, useState } from 'react';
import { withdraw } from '../services/authService';

export function useWithdrawUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdrawUserAction = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await withdraw();
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    withdrawUserAction,
    isLoading,
    error,
  };
}
