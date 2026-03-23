/**
 * 난이도 제안 모달 컴포넌트
 *
 * 사용자의 피드백 패턴을 분석하여 난이도 변경을 제안하는 모달
 *
 * 주요 기능:
 *   1. 제안 사유에 따른 메시지 표시 (쉬움/어려움)
 *   2. 제안 수락 ("좋아요" 버튼)
 *   3. 제안 거절 ("지금은 괜찮아요" 버튼)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, scaleWidth, BORDER_RADIUS } from '../styles/global';
import { Body_16M, Body_16SB } from '../styles/typography';
import { LevelCategory } from '../types/interests';
import Button from './Button';
import Spacer from './Spacer';

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────

interface LevelSuggestionModalProps {
  /** 제안하는 난이도 */
  suggestedLevel: LevelCategory;

  /** 제안 사유 */
  reason: 'easy' | 'hard';

  /** 통계 정보 */
  stats: {
    easyCount: number;
    normalCount: number;
    hardCount: number;
  };

  /** 수락 핸들러 */
  onAccept: () => void;

  /** 거절 핸들러 */
  onDecline: () => void;
}

// ──────────────────────────────────────────────
// 난이도 한글 변환
// ──────────────────────────────────────────────

const LEVEL_TEXT_MAP: Record<LevelCategory, string> = {
  [LevelCategory.BEGINNER]: '초급',
  [LevelCategory.INTERMEDIATE]: '중급',
  [LevelCategory.ADVANCED]: '고급',
};

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────

const LevelSuggestionModal: React.FC<LevelSuggestionModalProps> = ({
  suggestedLevel,
  reason,
  stats,
  onAccept,
  onDecline,
}) => {
  /**
   * 제안 사유별 메시지 생성
   */
  const suggestionMessage = useMemo(() => {
    const suggestedLevelText = LEVEL_TEXT_MAP[suggestedLevel];

    if (reason === 'easy') {
      return {
        levelBadgeText: suggestedLevelText,
        description: `최근 20개의 글 중 '쉬움'을 ${stats.easyCount}회 선택하셨어요.\n${suggestedLevelText} 난이도로 변경할까요?`,
      };
    }

    return {
      levelBadgeText: suggestedLevelText,
      description: `최근 20개의 글 중 '어려움'을 ${stats.hardCount}회 선택하셨어요.\n${suggestedLevelText} 난이도로 변경할까요?`,
    };
  }, [suggestedLevel, reason, stats]);

  return (
    <View style={styles.container}>
      {/* 난이도 배지 */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>
          {suggestionMessage.levelBadgeText}
        </Text>
      </View>

      <Spacer num={16} />

      {/* 설명 */}
      <Text style={styles.description}>{suggestionMessage.description}</Text>

      <Spacer num={32} />

      {/* 버튼 */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          title="좋아요"
          onPress={onAccept}
          style={styles.acceptButton}
        />

        <Spacer num={12} />

        <Button
          variant="ghost"
          title="지금은 괜찮아요"
          onPress={onDecline}
          style={styles.declineButton}
          textStyle={styles.declineButtonText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: scaleWidth(24),
    paddingTop: scaleWidth(24),
    paddingBottom: scaleWidth(8),
  },
  levelBadge: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleWidth(10),
    borderRadius: BORDER_RADIUS[30],
    backgroundColor: COLORS.puple.main,
  },
  levelBadgeText: {
    ...Body_16SB,
    color: COLORS.white,
  },
  description: {
    ...Body_16M,
    color: COLORS.gray700,
    textAlign: 'center',
    lineHeight: scaleWidth(24),
  },
  buttonContainer: {
    width: '100%',
  },
  acceptButton: {
    width: '100%',
  },
  declineButton: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  declineButtonText: {
    color: COLORS.gray600,
  },
});

export default LevelSuggestionModal;
