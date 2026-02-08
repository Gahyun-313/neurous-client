import { useCallback } from 'react';
import { getUserInfo } from '../services/authService';
import { updateUserLevel } from '../api/userApi';
import { LevelCategory } from '../types/interests';
import { MyPageData } from '../api/userApi';

interface UseUpdateLevelProps {
  setMyPageData: React.Dispatch<React.SetStateAction<MyPageData | null>>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useUpdateLevel = ({
  setMyPageData,
  onSuccess,
  onError,
}: UseUpdateLevelProps) => {
  const handleUpdateLevel = useCallback(
    async (level: LevelCategory) => {
      try {
        // API로 난이도 업데이트
        const userInfo = await getUserInfo();
        if (!userInfo || !userInfo.userId) {
          console.error('[마이페이지] 사용자 정보 없음');
          onError?.(new Error('사용자 정보 없음'));
          return;
        }
        await updateUserLevel(userInfo.userId, level);
        // API 업데이트 성공 시 로컬 state 업데이트
        setMyPageData(prev => {
          if (prev) {
            return { ...prev, level };
          }
          return prev;
        });
        onSuccess?.();
      } catch (error) {
        console.error('[마이페이지] 난이도 업데이트 실패:', error);
        onError?.(error);
      }
    },
    [setMyPageData, onSuccess, onError],
  );

  return { handleUpdateLevel };
};
