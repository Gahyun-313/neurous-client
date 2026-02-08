import React, { useEffect, useRef, useState } from 'react'; // ✅ useState 추가
import { Animated, StyleSheet, Text, LayoutChangeEvent } from 'react-native'; // ✅ LayoutChangeEvent 추가
import { COLORS, scaleWidth, BORDER_RADIUS } from '../styles/global';
import { Caption_14R } from '../styles/typography';

type Props = {
  visible: boolean; // 토스트 표시 여부
  message: string; // 토스트 문구
  duration?: number; // 노출 시간(ms)
  onHide?: () => void; // 사라진 뒤 콜백
};

const Toast = ({ visible, message, duration = 1800, onHide }: Props) => {
  // 투명도 애니메이션 값
  const opacity = useRef(new Animated.Value(0)).current;
  // 살짝 위에서 내려오는 이동 애니메이션 값
  const translateY = useRef(new Animated.Value(-scaleWidth(8))).current;

  // 토스트 박스 실제 크기(완벽 중앙 정렬용)
  const [toastSize, setToastSize] = useState({ width: 0, height: 0 });

  /**
   * 토스트 박스 레이아웃 측정
   * - width/height를 얻어서 중앙 보정값(-width/2, -height/2)에 사용
   */
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // 불필요한 리렌더 방지: 값이 달라질 때만 업데이트
    if (width !== toastSize.width || height !== toastSize.height) {
      setToastSize({ width, height });
    }
  };

  /**
   * visible이 true가 되면
   * 1) fade-in + slide-down
   * 2) duration 후 fade-out + slide-up
   */
  useEffect(() => {
    if (!visible) return;

    // 나타나는 애니메이션
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // 일정 시간 뒤 사라짐
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -scaleWidth(8),
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.(); // 토스트 종료 후 콜백
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onHide, opacity, translateY]);

  // visible이 false면 렌더링하지 않음
  if (!visible) return null;

  return (
    <Animated.View
      onLayout={handleLayout} // 실제 크기 측정
      pointerEvents="none" // 터치 이벤트 차단 (뒤 화면 터치 가능)
      style={[
        styles.toast,
        {
          // 정중앙 : 화면 중앙(50%, 50%) 기준에서 실제 박스 크기의 절반만큼 되돌림
          transform: [
            { translateX: -toastSize.width / 2 }, // 가로 완벽 중앙 보정
            { translateY: -toastSize.height / 2 }, // 세로 완벽 중앙 보정
            { translateY }, // 살짝 위아래 애니메이션(추가 변환)
          ],
          opacity, // fade-in / fade-out
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default Toast;

/* =========================
  스타일
========================= */
const styles = StyleSheet.create({
  toast: {
    position: 'absolute', // 화면 위에 오버레이로 띄우기
    top: '50%', // 화면 세로 중앙 기준점
    left: '50%', // 화면 가로 중앙 기준점

    // 실제 토스트 박스 스타일
    paddingVertical: scaleWidth(10), // 위아래 여백
    paddingHorizontal: scaleWidth(16), // 좌우 여백
    borderRadius: BORDER_RADIUS[8], // 둥근 모서리
    backgroundColor: COLORS.gray800, // 토스트 배경색

    zIndex: 999, // 다른 UI 위에 표시(iOS/공통)
    elevation: 999, // Android에서 zIndex 보조(겹침 안정화)
  },

  text: {
    ...Caption_14R, // 캡션 텍스트 스타일
    color: COLORS.white, // 텍스트 색상
  },
});
