/**
 * 퀴즈/글 보기 버튼 상태 및 클릭 핸들러 관리 커스텀 훅
 *
 * ArticleDetailScreen 하단의 플로팅 버튼을 담당함.
 * 현재 퀴즈가 보이는 상태(showQuiz)에 따라 버튼 텍스트와 동작이 전환됨:
 * - 퀴즈 미표시 → "퀴즈 보기" → 퀴즈 섹션으로 스크롤
 * - 퀴즈 표시   → "글 보기"   → 상단으로 스크롤
 */
import { useMemo, useCallback } from 'react';
import { logScreenView } from '../services/analyticsService';

/**
 * useQuizButton 훅 옵션
 *
 * @property showQuiz        현재 퀴즈 섹션이 보이는 상태인지 여부
 * @property onScrollToQuiz  퀴즈 섹션으로 스크롤하는 함수 (useScrollToQuiz에서 전달)
 * @property onScrollToTop   화면 상단으로 스크롤하는 함수 (useScrollToQuiz에서 전달)
 */
interface UseQuizButtonOptions {
  showQuiz: boolean;
  onScrollToQuiz: () => void;
  onScrollToTop: () => void;
}

/**
 * useQuizButton 훅 반환값
 *
 * @property buttonTitle      버튼에 표시할 텍스트
 * @property handleButtonPress 버튼 클릭 핸들러
 */
interface UseQuizButtonReturn {
  buttonTitle: string;
  handleButtonPress: () => void;
}

/**
 * 퀴즈/글 보기 버튼 훅
 *
 * @param showQuiz        현재 퀴즈 표시 상태
 * @param onScrollToQuiz  퀴즈 섹션 스크롤 함수
 * @param onScrollToTop   상단 스크롤 함수
 * @returns               buttonTitle, handleButtonPress
 */
export const useQuizButton = ({
  showQuiz,
  onScrollToQuiz,
  onScrollToTop,
}: UseQuizButtonOptions): UseQuizButtonReturn => {
  /**
   * showQuiz 상태에 따라 버튼 텍스트 결정
   * - true  → "글 보기"   (퀴즈가 보이는 상태 → 글로 돌아가기)
   * - false → "퀴즈 보기" (글이 보이는 상태 → 퀴즈로 이동)
   */
  const buttonTitle = useMemo(
    () => (showQuiz ? '글 보기' : '퀴즈 보기'),
    [showQuiz],
  );

  /**
   * 버튼 클릭 핸들러
   *
   * "퀴즈 보기" 클릭 시에만 애널리틱스 로그 기록.
   * "글 보기"는 단순 스크롤이라 로그 생략.
   */
  const handleButtonPress = useCallback(() => {
    if (showQuiz) {
      onScrollToTop();
    } else {
      // '퀴즈 보기' 클릭 시 화면 진입 로그 기록
      logScreenView('ReadingDetails_Quiz', undefined, true);
      onScrollToQuiz();
    }
  }, [showQuiz, onScrollToQuiz, onScrollToTop]);

  return {
    buttonTitle,
    handleButtonPress,
  };
};
