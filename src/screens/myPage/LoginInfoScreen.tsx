import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';

import Header from '../../components/Header';
import { COLORS, scaleWidth } from '../../styles/global';
import { Body_16SB, Caption_14R, Heading_16B } from '../../styles/typography';
import RightArrow from '../../assets/svg/RightArrow.svg';

// 공통 모달
import NotificationModal from '../../components/NotificationModal';

import { RouteNames } from '../../../routes';
import {
  clearAllAuthData,
  getUserInfo,
  logout,
  withdraw,
} from '../../services/authService';
import { useOnboardingStore } from '../../store/onboardingStore';

/**
 * 로그인 정보 화면
 * - 로그아웃
 * - 서비스 탈퇴
 */
const LoginInfoScreen = () => {
  const navigation = useNavigation<any>();

  // 로그아웃 모달 상태
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 서비스 탈퇴 모달 상태
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  // 온보딩 상태 초기화
  const resetOnboarding = useOnboardingStore(state => state.resetOnboarding);

  /** 로그아웃 클릭 */
  const onPressLogout = () => {
    setLogoutModalVisible(true);
  };

  /** 로그아웃 취소 */
  const onCancelLogout = () => {
    setLogoutModalVisible(false);
  };

  /** 로그아웃 확인 */
  const onConfirmLogout = useCallback(async () => {
    setLogoutModalVisible(false);

    try {
      // 1) 저장된 provider 조회
      const userInfo = await getUserInfo();
      const provider = userInfo?.provider;

      // 2) 기존에 구현해둔 logout 사용 (소셜 로그아웃 + 로컬 정리)
      await logout(provider);

      // 3) 온보딩 상태 초기화
      await resetOnboarding();

      // 4) 네비게이션 스택 리셋 → 온보딩 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: RouteNames.ONBOARDING }],
        }),
      );
    } catch (e: any) {
      Alert.alert('오류', e?.message || '로그아웃 중 오류가 발생했습니다.');
    }
  }, [navigation, resetOnboarding]);

  /** 서비스 탈퇴 클릭 */
  const onPressWithdraw = () => {
    setWithdrawModalVisible(true);
  };

  /** 서비스 탈퇴 취소 */
  const onCancelWithdraw = () => {
    setWithdrawModalVisible(false);
  };

  /** 서비스 탈퇴 확인 */
  const onConfirmWithdraw = useCallback(async () => {
    setWithdrawModalVisible(false);

    try {
      // 0) 서버 탈퇴 + 소셜 unlink + 소셜 로그아웃 + 로컬 정리
      await withdraw();

      // 1) 로컬 인증/유저 데이터 초기화
      await clearAllAuthData();

      // 2) 온보딩 상태 초기화
      await resetOnboarding();

      // 3) 네비게이션 스택 리셋 → 온보딩 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: RouteNames.ONBOARDING }],
        }),
      );
    } catch (e: any) {
      Alert.alert(
        '오류',
        e?.message || '서비스 탈퇴 처리 중 오류가 발생했습니다.',
      );
    }
  }, [navigation, resetOnboarding]);

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="로그인 정보" />

      {/* 로그아웃 */}
      <Pressable
        style={[styles.row, styles.rowWithDivider]}
        onPress={onPressLogout}
      >
        <Text style={styles.rowTitle}>로그아웃</Text>
        <RightArrow color={COLORS.gray700} />
      </Pressable>

      {/* 서비스 탈퇴 */}
      <Pressable style={styles.row} onPress={onPressWithdraw}>
        <Text style={styles.rowTitle}>서비스 탈퇴</Text>
        <RightArrow color={COLORS.gray700} />
      </Pressable>

      {/* 로그아웃 확인 모달 (두 줄 고정) */}
      <NotificationModal
        visible={logoutModalVisible}
        title="정말 로그아웃하시겠어요?"
        closeOnBackdropPress
        onClose={onCancelLogout}
        secondaryButton={{
          title: '취소',
          onPress: onCancelLogout,
          variant: 'outline',
          textStyle: { color: COLORS.gray700, ...Body_16SB },
          style: {
            borderColor: COLORS.gray300,
            height: scaleWidth(48),
          },
        }}
        primaryButton={{
          title: '로그아웃',
          onPress: onConfirmLogout,
          variant: 'primary',
          textStyle: { ...Heading_16B },
        }}
      >
        <Text style={styles.modalDesc}>
          로그아웃해도 계정 정보와{'\n'}
          포인트, 레벨은 그대로 유지돼요.
        </Text>
      </NotificationModal>

      {/* 서비스 탈퇴 확인 모달 (두 줄 고정) */}
      <NotificationModal
        visible={withdrawModalVisible}
        title="정말 탈퇴하시겠어요?"
        closeOnBackdropPress
        onClose={onCancelWithdraw}
        secondaryButton={{
          title: '취소',
          onPress: onCancelWithdraw,
          variant: 'outline',
          textStyle: { color: COLORS.gray700, ...Body_16SB },
          style: {
            borderColor: COLORS.gray300,
            height: scaleWidth(48),
          },
        }}
        primaryButton={{
          title: '탈퇴',
          onPress: onConfirmWithdraw,
          variant: 'primary',
          textStyle: { ...Heading_16B },
        }}
      >
        <Text style={styles.modalDesc}>
          탈퇴하면 계정정보와 보유 중인 포인트,{'\n'}
          현재 레벨이 모두 삭제되며 복구할 수 없어요.
        </Text>
      </NotificationModal>
    </SafeAreaView>
  );
};

export default LoginInfoScreen;

/* =========================
  스타일
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  row: {
    height: scaleWidth(64),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scaleWidth(20),
  },

  rowWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },

  rowTitle: {
    ...Body_16SB,
    color: COLORS.black,
    fontWeight: '500',
  },

  // 로그아웃 / 탈퇴 모달 공통 설명 텍스트 (두 줄 고정)
  modalDesc: {
    ...Caption_14R,
    color: COLORS.gray700,
    textAlign: 'center',
    lineHeight: scaleWidth(20),
  },
});
