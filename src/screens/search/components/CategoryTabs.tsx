import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NewsCategory } from '../../../data/mock/searchData';
import { BORDER_RADIUS, COLORS, scaleWidth } from '../../../styles/global'; // 프로젝트 경로에 맞게 유지/조정
import { Body_16M } from '../../../styles/typography';

type Props = {
  /** 전체 카테고리 목록 */
  categories: NewsCategory[];

  /** 현재 선택된 카테고리 */
  selected: NewsCategory;

  /** 카테고리 선택 시 호출되는 콜백 */
  onSelect: (cat: NewsCategory) => void;
};

/**
 * CategoryTabs
 *
 * - 뉴스 카테고리를 가로 스크롤 탭 형태로 표시
 * - 선택된 카테고리는 강조 스타일 적용
 * - 탭 클릭 시 상위 컴포넌트로 선택 이벤트 전달
 */
export default function CategoryTabs({
  categories,
  selected,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal // 가로 스크롤
      showsHorizontalScrollIndicator={false} // 스크롤바 숨김
      contentContainerStyle={styles.row} // 양쪽 여백/정렬
    >
      {categories.map(cat => {
        // 현재 카테고리가 선택 상태인지 여부
        const active = cat === selected;

        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.8}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.text, active && styles.activeText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /** 가로 스크롤 영역 패딩 */
  row: {
    paddingHorizontal: scaleWidth(20), // 양쪽 시작/끝 여백 20
    paddingTop: scaleWidth(2), // 위 여백
    paddingBottom: 0, // 아래 여백
    alignItems: 'center', // 세로 가운데 정렬(스크롤 컨테이너)
    gap: scaleWidth(12), // 칩 간격 12
  },

  /** 기본 카테고리 칩 스타일 */
  chip: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleWidth(8),
    borderRadius: BORDER_RADIUS[30],
    backgroundColor: COLORS.puple[3],
    justifyContent: 'center',
    alignItems: 'center',
  },

  /** 선택된 카테고리 칩 스타일 */
  activeChip: {
    backgroundColor: COLORS.puple.main, // 선택 배경(보라)
  },

  /** 기본 카테고리 텍스트 */
  text: {
    ...Body_16M,
    color: COLORS.puple.main, // 기본 텍스트(보라)
    includeFontPadding: true, // 안드로이드 상하 여백
    textAlignVertical: 'center', // (안드로이드) 수직 중앙 느낌
  },

  /** 선택된 카테고리 텍스트 */
  activeText: {
    ...Body_16M,
    color: 'white', // 선택 텍스트 흰색
  },
});
