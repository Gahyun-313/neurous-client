import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../../styles/global';

type Props = {
  /** 외부에서 크기/모양을 지정하기 위한 스타일 */
  style?: ViewStyle;
};

/**
 * Shimmer
 *
 * - 스켈레톤 UI에 사용되는 로딩 애니메이션 컴포넌트
 * - 회색 베이스 위에 그라데이션 띠가 좌 → 우로 반복 이동
 * - Animated + useNativeDriver 사용
 */
export default function Shimmer({ style }: Props) {
  /**
   * 애니메이션 진행도 (0 → 1)
   */
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [anim]);

  /**
   * 그라데이션 이동 거리
   */
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 280], // 넉넉하게 이동
  });

  return (
    <View style={[styles.base, style]}>
      <Animated.View
        style={[styles.shimmerWrap, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={[
            COLORS.gray300,
            COLORS.gray400,
            COLORS.gray500,
            COLORS.gray400,
            COLORS.gray300,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** 스켈레톤 기본 배경 */
  base: {
    backgroundColor: COLORS.gray300,
    overflow: 'hidden',
  },

  /** 움직이는 그라데이션 래퍼 */
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 160, // ✅ 띠 폭 (클수록 부드러움)
  },

  /** 실제 그라데이션 */
  gradient: {
    flex: 1,
    transform: [{ skewX: '-20deg' }], // 사진처럼 사선 효과
  },
});
