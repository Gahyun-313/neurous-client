/**
 * 퀴즈/글 보기 버튼 상태 및 핸들러 관리 커스텀 훅
 */

import { useMemo, useCallback } from 'react';
import { logScreenView } from '../services/analyticsService';

interface UseQuizButtonOptions {
  showQuiz: boolean;
  onScrollToQuiz: () => void;
  onScrollToTop: () => void;
}

interface UseQuizButtonReturn {
  buttonTitle: string;
  handleButtonPress: () => void;
}

export const useQuizButton = ({
  showQuiz,
  onScrollToQuiz,
  onScrollToTop,
}: UseQuizButtonOptions): UseQuizButtonReturn => {
  /**
   * 버튼 텍스트 결정
   */
  const buttonTitle = useMemo(
    () => (showQuiz ? '글 보기' : '퀴즈 보기'),
    [showQuiz],
  );

  /**
   * 버튼 클릭 핸들러
   */
  const handleButtonPress = useCallback(() => {
    if (showQuiz) {
      onScrollToTop();
    } else {
      // '퀴즈 보기' 버튼을 눌렀을 때만 로그 기록
      logScreenView('ReadingDetails_Quiz', undefined, true);
      onScrollToQuiz();
    }
  }, [showQuiz, onScrollToQuiz, onScrollToTop]);

  return {
    buttonTitle,
    handleButtonPress,
  };
};
