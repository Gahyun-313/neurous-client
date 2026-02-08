import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitDifficulty } from '../api/missionApi';
import { getUserInfo } from '../services/authService';
import { Difficulty } from '../components/DifficultySelectionModal';

const DIFFICULTY_SUBMIT_KEY = '@difficulty_submit_date';

// 난이도 타입 변환: 'easy' | 'normal' | 'hard' -> 'EASY' | 'MEDIUM' | 'HARD'
const convertDifficultyToApiFormat = (
  difficulty: Difficulty,
): 'EASY' | 'MEDIUM' | 'HARD' => {
  switch (difficulty) {
    case 'easy':
      return 'EASY';
    case 'normal':
      return 'MEDIUM';
    case 'hard':
      return 'HARD';
    default:
      return 'EASY';
  }
};

/**
 * 하루에 한 번만 난이도 전송이 가능한지 체크
 */
export const checkCanSubmitDifficulty = async (): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastSubmitDate = await AsyncStorage.getItem(DIFFICULTY_SUBMIT_KEY);
    return lastSubmitDate !== today;
  } catch (error) {
    console.error('[useDifficultySubmit] 날짜 체크 실패:', error);
    return true; // 에러 시 전송 가능하도록 처리
  }
};

/**
 * 난이도 전송 커스텀 훅
 */
export const useDifficultySubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDifficultyToServer = useCallback(
    async (contentId: number, difficulty: Difficulty): Promise<boolean> => {
      try {
        setIsSubmitting(true);

        const userInfo = await getUserInfo();
        if (!userInfo || !userInfo.userId) {
          console.error('[useDifficultySubmit] 사용자 정보 없음');
          return false;
        }

        const apiDifficulty = convertDifficultyToApiFormat(difficulty);
        const response = await submitDifficulty(
          userInfo.userId,
          contentId,
          apiDifficulty,
        );

        console.log('[useDifficultySubmit] 난이도 전송 성공:', response);

        // 오늘 날짜 저장 (하루에 한 번만 전송)
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(DIFFICULTY_SUBMIT_KEY, today);

        return true;
      } catch (error) {
        console.error('[useDifficultySubmit] 난이도 전송 실패:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    submitDifficultyToServer,
    isSubmitting,
    checkCanSubmitDifficulty,
  };
};
