/**
 * 난이도 피드백 체크 훅
 *
 * 피드백 저장 후 즉시 분석하여 제안이 필요한지 체크
 * 사용처: QiuizScreen의 DifficultySelectionModal.onSelect
 *
 * - 피드백 저장 후 즉시 분석
 * - 조건 충족 시 제안 팝업 표시를 위한 데이터 반환
 */

import { useCallback } from 'react';
import { getDifficultyFeedbackHistory } from '../services/difficultyFeedbackService';
import {
  analyzeDifficultyFeedback,
  DifficultyAnalysisResult,
} from '../utils/difficultyAnalysis';
import { useOnboardingStore } from '../store/onboardingStore';
import { LevelCategory } from '../types/interests';

/**
 * 난이도 피드백 체크 훅
 * @returns checkAfterFeedback 함수
 */
export function useDifficultyFeedbackCheck() {
  // 현재 사용자 난이도 가져오기
  const currentLevel = useOnboardingStore(state => state.difficulty);

  // 피드백 저장 후 즉시 체크
  const checkAfterFeedback =
    useCallback(async (): Promise<DifficultyAnalysisResult | null> => {
      try {
        console.log('[DifficultyCheck] 피드백 저장 후 분석 시작');

        const history = await getDifficultyFeedbackHistory();

        const analysis = analyzeDifficultyFeedback(
          history,
          currentLevel || LevelCategory.BEGINNER,
        );

        if (analysis.shouldSuggest && analysis.suggestedLevel) {
          console.log('[DifficultyCheck] 제안 조건 충족:', analysis);
          return analysis;
        }

        console.log('[DifficultyCheck] 제안 조건 미달');
        return null;
      } catch (error) {
        console.error('[DifficultyCheck] 체크 실패:', error);
        return null;
      }
    }, [currentLevel]);
  return { checkAfterFeedback };
}
