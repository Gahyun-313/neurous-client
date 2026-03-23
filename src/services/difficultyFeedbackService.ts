/**
 * 난이도 피드백 로컬 저장 서비스
 *
 * 사용자가 선택한 난이도 체감을 AsyncStorage에 저장 및 관리
 *
 * - 피드백 저장 (최근 20개 유지)
 * - 피드백 히스토리 조회
 * - 히스토리 초기화 (제안 수락/거절 시)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelCategory } from '../types/interests';

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────

/**
 * 피드백 항목
 */
export interface DifficultyFeedback {
  contentId: number;
  userLevel: LevelCategory;
  feedback: 'easy' | 'normal' | 'hard'; // 체감 난이도
  timestamp: string; // 피드백 저장 시각
}

// ──────────────────────────────────────────────
// AsyncStorage 키
// ──────────────────────────────────────────────
const DIFFICULTY_FEEDBACK_KEY = '@difficulty_feedback_history';

// ──────────────────────────────────────────────
// 피드백 히스토리 관리
// ──────────────────────────────────────────────

/**
 * 난이도 피드백 저장
 * @param contentId 글 ID
 * @param userLevel 현재 사용자 레벨
 * @param feedback 체감 난이도
 */
export async function saveDifficultyFeedback(
  contentId: number,
  userLevel: LevelCategory,
  feedback: 'easy' | 'normal' | 'hard',
): Promise<void> {
  try {
    // 1. 기존 히스토리 조회
    const history = await getDifficultyFeedbackHistory();

    // 2. 새 피드백 객체 생성
    const newFeedback: DifficultyFeedback = {
      contentId,
      userLevel,
      feedback,
      timestamp: new Date().toISOString(),
    };

    // 3. 히스토리에 추가
    history.push(newFeedback);

    // 4. 최근 20개만 유지
    const recentHistory = history.slice(-20);

    // 5. AsyncStorage에 저장
    await AsyncStorage.setItem(
      DIFFICULTY_FEEDBACK_KEY,
      JSON.stringify(recentHistory),
    );

    console.log('[DifficultyFeedback] 피드백 저장 완료:', {
      contentId,
      userLevel,
      feedback,
      historyCount: recentHistory.length,
    });
  } catch (error) {
    console.error('[DifficultyFeedback] 저장 실패:', error);
  }
}

/**
 * 난이도 피드백 히스토리 조회
 * @returns 피드백 히스토리 배열
 */
export async function getDifficultyFeedbackHistory(): Promise<
  DifficultyFeedback[]
> {
  try {
    const data = await AsyncStorage.getItem(DIFFICULTY_FEEDBACK_KEY);

    // 데이터가 없으면 빈 배열 반환
    if (!data) {
      return [];
    }

    const history: DifficultyFeedback[] = JSON.parse(data);
    return history;
  } catch (error) {
    console.error('[DifficultyFeedback] 조회 실패:', error);
    return [];
  }
}

/**
 * 난이도 피드백 히스토리 초기화
 * - 제안 수락/거절 시 히스토리 초기화하여 다음 제안에 영향을 주지 않도록 함
 */
export async function clearDifficultyFeedbackHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DIFFICULTY_FEEDBACK_KEY);
    console.log('[DifficultyFeedback] 히스토리 초기화 완료');
  } catch (error) {
    console.error('[DifficultyFeedback] 초기화 실패:', error);
  }
}
