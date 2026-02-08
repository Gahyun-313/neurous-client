import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ic_backIcon } from '../icons';
import { useNavigation } from '@react-navigation/native';
import IconButton from './IconButton';
import { scaleWidth, COLORS } from '../styles/global';
import { Heading_16B } from '../styles/typography';
import { logEvent } from '../services/analyticsService';

const SIDE_WIDTH = scaleWidth(40); // 좌/우 동일 폭(중요)

const Header = ({
  title,
  leftIcon,
  goBackAction,
  iconColor,
  rightIcon, // ✅ (선택) 우측 액션 아이콘이 필요하면 사용
  backEventName,
}: {
  title?: React.ReactNode;
  leftIcon?: React.ReactNode;
  goBackAction?: () => void;
  iconColor?: string;
  rightIcon?: React.ReactNode;
  backEventName?: string; // 커스텀 백버튼 이벤트 이름
}) => {
  const navigation = useNavigation();

  const renderLeft = () => {
    if (leftIcon) {
      return leftIcon;
    }

    const handleGoBack = () => {
      // 커스텀 이벤트 이름이 있으면 사용, 없으면 기본 이벤트
      if (backEventName) {
        logEvent(backEventName);
      }
      if (goBackAction) {
        goBackAction();
        return;
      }

      if (navigation.canGoBack?.()) {
        navigation.goBack();
      }
    };

    return (
      <IconButton onPress={handleGoBack}>
        <Ic_backIcon color={iconColor ?? COLORS.gray800} />
      </IconButton>
    );
  };

  return (
    <View style={styles.container}>
      {/* 왼쪽 */}
      <View style={styles.side}>{renderLeft()}</View>

      {/* 가운데 */}
      <View style={styles.center}>
        {title ? (
          typeof title === 'string' ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            title
          )
        ) : null}
      </View>

      {/* 오른쪽 (없어도 spacer로 폭 유지해서 가운데 밀림 방지) */}
      <View style={styles.side}>{rightIcon ?? null}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleWidth(52),
    paddingHorizontal: scaleWidth(20),
    // ⚠️ SafeAreaView 안에서 쓰는 헤더면 marginTop은 보통 불필요해서
    // 타이틀/콘텐츠가 "아래로 밀리는" 느낌이 있으면 이 값부터 제거 추천
    marginTop: scaleWidth(8),
  },
  side: {
    width: SIDE_WIDTH,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // 검색바가 가운데 들어올 때 좌우 여백을 살짝 주고 싶으면 paddingHorizontal로 조절
    // paddingHorizontal: scaleWidth(8),
  },
  title: {
    ...Heading_16B,
    color: COLORS.black,
  },
});

export default Header;
