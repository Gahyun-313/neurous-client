/**
 * 퀴즈 섹션으로의 스크롤 감지 및 제어 커스텀 훅
 * 스크롤 위치에 따라 퀴즈 섹션 표시 여부를 관리
 */

import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

interface UseScrollToQuizOptions {
  scrollViewRef: React.RefObject<ScrollView>;
  quizSectionRef: React.RefObject<View>;
}

interface UseScrollToQuizReturn {
  showQuiz: boolean;
  handleScroll: (event: any) => void;
  scrollToQuiz: () => void;
  scrollToTop: () => void;
}

// 스크롤 감지 임계값 상수
const HYSTERESIS_OFFSET_RATIO = 0.2; // 히스테리시스 오프셋 비율
const FALLBACK_THRESHOLD_DOWN = 0.8; // measureLayout 실패 시 사용할 임계값 (80%)
const FALLBACK_THRESHOLD_UP = 0.7; // measureLayout 실패 시 사용할 임계값 (70%)
const SCROLL_TO_END_DELAY = 100; // scrollToEnd 호출 전 딜레이 (ms)

export const useScrollToQuiz = ({
  scrollViewRef,
  quizSectionRef,
}: UseScrollToQuizOptions): UseScrollToQuizReturn => {
  const [showQuiz, setShowQuiz] = useState(false);
  const lastShowQuizStateRef = useRef(false);

  /**
   * 스크롤 이벤트 핸들러
   * 퀴즈 섹션의 위치를 측정하여 스크롤 상태에 따라 showQuiz 상태 업데이트
   */
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      const scrollY = contentOffset.y;
      const scrollViewHeight = layoutMeasurement.height;

      // 퀴즈 섹션의 실제 위치 측정
      quizSectionRef.current?.measureLayout(
        scrollViewRef.current as any,
        (_x, y, _width, _height) => {
          const quizSectionStart = y;
          const thresholdDown = quizSectionStart - scrollViewHeight;
          const hysteresisOffset = scrollViewHeight * HYSTERESIS_OFFSET_RATIO;
          const thresholdUp = thresholdDown - hysteresisOffset;

          // 퀴즈 섹션이 화면에 보이는 경우
          if (scrollY + scrollViewHeight >= quizSectionStart) {
            if (!lastShowQuizStateRef.current) {
              setShowQuiz(true);
              lastShowQuizStateRef.current = true;
            }
          }
          // 퀴즈 섹션 위로 충분히 올라간 경우
          else if (scrollY < thresholdUp) {
            if (lastShowQuizStateRef.current) {
              setShowQuiz(false);
              lastShowQuizStateRef.current = false;
            }
          }
        },
        // measureLayout 실패 시 fallback 로직 (스크롤 비율 기반)
        () => {
          const { contentSize } = event.nativeEvent;
          const scrollableHeight = contentSize.height - scrollViewHeight;
          const threshold80Percent = scrollableHeight * FALLBACK_THRESHOLD_DOWN;

          if (scrollY >= threshold80Percent) {
            if (!lastShowQuizStateRef.current) {
              setShowQuiz(true);
              lastShowQuizStateRef.current = true;
            }
          } else if (scrollY < scrollableHeight * FALLBACK_THRESHOLD_UP) {
            if (lastShowQuizStateRef.current) {
              setShowQuiz(false);
              lastShowQuizStateRef.current = false;
            }
          }
        },
      );
    },
    [scrollViewRef, quizSectionRef],
  );

  /**
   * 퀴즈 섹션으로 스크롤
   */
  const scrollToQuiz = useCallback(() => {
    if (!quizSectionRef.current || !scrollViewRef.current) {
      return;
    }

    // 퀴즈 섹션의 위치 측정
    quizSectionRef.current.measureLayout(
      scrollViewRef.current as any,
      (_x, y, _width, _height) => {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: y,
            animated: true,
          });
        }, SCROLL_TO_END_DELAY);
      },
      // measureLayout 실패 시 fallback: scrollToEnd 사용
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, SCROLL_TO_END_DELAY);
      },
    );
  }, [scrollViewRef, quizSectionRef]);

  /**
   * 상단으로 스크롤
   */
  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [scrollViewRef]);

  return {
    showQuiz,
    handleScroll,
    scrollToQuiz,
    scrollToTop,
  };
};
