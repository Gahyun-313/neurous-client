import React from 'react';
import { StyleSheet, View } from 'react-native';
import Shimmer from './Shimmer';
import { scaleWidth } from '../../../styles/global';

/**
 * SearchResultSkeleton
 *
 * - 뉴스 카드 로딩 스켈레톤 1개
 * - 실제 SearchResultItem 레이아웃과 유사한 형태
 */
export default function SearchResultSkeleton() {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Shimmer style={styles.line1} />
        <Shimmer style={styles.line2} />
        <Shimmer style={styles.line3} />
      </View>

      {/* 우측 썸네일: 실제 카드 이미지 크기와 동일하게 */}
      <Shimmer style={styles.thumb} />
    </View>
  );
}

const LINE_H = scaleWidth(16);
const THUMB_SIZE = scaleWidth(85);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(12),
    paddingBottom: scaleWidth(16),
    alignItems: 'center',
    gap: 12,
  },
  left: { flex: 1 },

  line1: {
    height: LINE_H,
    borderRadius: LINE_H / 2,
    marginBottom: scaleWidth(10),
  },
  line2: {
    height: LINE_H,
    borderRadius: LINE_H / 2,
    marginBottom: scaleWidth(10),
  },
  line3: {
    height: LINE_H,
    borderRadius: LINE_H / 2,
    width: '60%',
  },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: scaleWidth(16),
    marginLeft: scaleWidth(20),
  },
});
