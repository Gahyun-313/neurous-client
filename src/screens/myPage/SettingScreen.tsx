import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import Header from '../../components/Header';
import RightArrow from '../../assets/svg/RightArrow.svg';
import Toast from '../../components/Toast';
import Toggle from '../../components/Toggle';

import { COLORS, scaleWidth } from '../../styles/global';
import { Heading_16B, Caption_14R, Body_16SB } from '../../styles/typography';
import { RouteNames } from '../../../routes';

// import { useShowModal } from '../../store/modalStore'; // ✅ (기존) 안내 모달 로직은 정책 변경으로 현재 미사용
import { useNotificationPermission } from '../../hooks/useNotificationPermission';

// Toast store
import { useToastMessage, useClearToast } from '../../store/toastStore'; // 경로 맞게

/**
 * SettingScreen
 *
 * 역할
 * - 설정 섹션(회원정보/알림/약관/도움말) 메뉴 진입
 * - 알림 토글은 "권한 상태"를 기반으로 UI를 동기화
 *
 * 알림 토글 UX 정책
 * - 토글 ON 시: (정책 변경) ✅ 앱 내부 안내 팝업 없이 OS 흐름만 사용
 *   - B) 한 번도 요청 안 했음: OS 권한 팝업 즉시 호출
 *   - A) 과거 거부(재호출 불가): OS 앱 설정 화면으로 즉시 이동
 *   - C) 이미 허용: 앱 내부 수신 로직만 ON
 * - 토글 OFF 시: 앱 내부에서 OFF 처리만(권한 자체 OFF는 OS 설정에서)
 */
const SettingScreen = () => {
  const navigation = useNavigation<any>();

  // 화면에 표시되는 알림 토글 상태
  const [isAlarmOn, setIsAlarmOn] = useState(false);

  // 토스트 로컬 상태(컴포넌트에서 표시 제어)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // toastStore에서 메시지 읽기/초기화
  const storedToastMessage = useToastMessage();
  const clearToast = useClearToast();

  // 공통 모달 호출(Store 기반)
  // const showModal = useShowModal(); // ✅ (기존) 현재 정책상 사용하지 않음

  // 설정 대기 상태 추적
  const waitingForSettingsRef = useRef(false);

  // 권한 상태 확인/요청 훅
  const { checkPermission, requestPermission } = useNotificationPermission({
    onSettingsOpened: () => {
      waitingForSettingsRef.current = true;
    },
  });

  // 화면 포커스 시, store에 메시지가 있으면 토스트로 표시 후 제거
  // 그리고 권한 상태 확인하여 토글 동기화
  useFocusEffect(
    useCallback(() => {
      // 토스트 메시지 처리
      if (storedToastMessage) {
        setToastMessage(storedToastMessage);
        setToastVisible(true);
        clearToast();
      }

      // 권한 상태 확인하여 토글 동기화
      // (초기 진입 시, 설정에서 돌아왔을 때 모두 처리)
      const syncAlarmToggle = async () => {
        try {
          const shouldShowModal = await checkPermission();
          // 기존 로직 유지:
          // - shouldShowModal === true  -> 권한 미허용 상태(토글 OFF)
          // - shouldShowModal === false -> 권한 허용 상태(토글 ON)
          setIsAlarmOn(!shouldShowModal);
        } catch (error) {
          // 알림 설정 중 오류가 발생했습니다.
          console.error(error);
          // 실패 시 기존 토글 상태 유지
        } finally {
          // 설정 화면으로 갔다가 돌아온 경우 플래그 초기화(선택)
          if (waitingForSettingsRef.current) {
            waitingForSettingsRef.current = false;
          }
        }
      };

      syncAlarmToggle();
    }, [storedToastMessage, clearToast, checkPermission]),
  );

  // 토스트 종료 콜백
  const handleHideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  /**
   * 알림 설정 Row(또는 Switch) 클릭 시 동작
   *
   * 1) 현재 ON이면: 앱 UI에서만 OFF 처리
   * 2) 현재 OFF이면:
   *    - C) 이미 허용이면: 바로 ON 처리 (OS 설정 이동 ❌)
   *    - B) 아직 요청한 적 없으면: OS 권한 팝업 즉시 호출 (설명 팝업 ❌)
   *    - A) 과거 거부(재호출 불가)이면: OS 앱 설정 화면으로 즉시 이동 (설명 팝업 ❌)
   *
   * 주의
   * - OS 설정으로 이동하기 전에는 토글을 임시로 ON 처리하지 않음
   */
  const handlePressAlarmRow = async () => {
    // 이미 ON 상태면, UX 상 "OFF" 처리만 해도 충분
    // (권한 자체 OFF는 사용자가 OS 설정에서)
    if (isAlarmOn) {
      setIsAlarmOn(false);
      return;
    }

    try {
      // ✅ 권한 상태 확인 (기존 반환값/로직 그대로 사용)
      // - shouldShowModal === false: 이미 권한 허용됨(C)
      // - shouldShowModal === true : 권한 미허용(A/B)
      const shouldShowModal = await checkPermission();

      if (!shouldShowModal) {
        // ✅ C. 이미 알림 권한이 허용된 상태
        // -> 앱 내부 알림 수신 로직만 제어
        setIsAlarmOn(true);
        return;
      }

      // ✅ A/B. 권한 미허용 상태
      // 정책 변경:
      // - 앱 내부 안내 모달 노출 ❌
      // - requestPermission() 내부에서
      //   - (B) OS 권한 팝업 호출
      //   - (A) OS 앱 설정 화면으로 이동
      // 을 처리하도록 위임
      const granted = await requestPermission();

      // OS 권한 결과(또는 설정 이동 후 즉시 false 반환 등)에 따라 토글 반영
      // - B) 허용 -> true
      // - B) 거부 -> false 유지
      // - A) 설정 이동 -> 여기서는 false 유지(포그라운드 복귀 시 syncAlarmToggle에서 최종 반영)
      setIsAlarmOn(!!granted);
    } catch (error: any) {
      Alert.alert(
        '오류',
        error?.message || '알림 설정 중 오류가 발생했습니다.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 토스트 (설정 화면 위에 오버레이) */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        duration={1500}
        onHide={handleHideToast}
      />

      {/* 상단 헤더: 공통 Header + 가운데 타이틀(설정) 오버레이 */}
      <View style={styles.headerWrap}>
        <Header title="" />
        <View pointerEvents="none" style={styles.headerCenterTitleWrap}>
          <Text style={styles.headerCenterTitle}>설정</Text>
        </View>
      </View>

      {/* 섹션별 메뉴 리스트 */}
      <View style={styles.container}>
        {/* 회원정보 */}
        <Text style={styles.sectionLabel}>회원정보</Text>
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate(RouteNames.LOGIN_INFO)}
        >
          <Text style={styles.rowTitle}>로그인 정보</Text>
          <RightArrow color={COLORS.gray700} />
        </Pressable>
        <View style={styles.divider} />

        {/* 알림 */}
        <Text style={styles.sectionLabel}>알림</Text>

        {/* Row 전체를 누르면: OS 권한/설정 → 토글 반영 */}
        <Pressable
          style={[styles.row, styles.alarmRow]}
          onPress={handlePressAlarmRow}
        >
          <View>
            <Text style={styles.rowTitle}>알림 설정</Text>
            <Text style={styles.rowDesc}>
              아침 8시, 저녁 6시에 알림을 드려요.
            </Text>
          </View>

          {/* Toggle은 "표시/트리거" 역할만 (권한 흐름은 동일 handler로 통합) */}
          <Toggle value={isAlarmOn} onChange={() => handlePressAlarmRow()} />
        </Pressable>

        <View style={styles.divider} />

        {/* 약관 및 정책 */}
        <Text style={styles.sectionLabel}>약관 및 정책</Text>
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate(RouteNames.TERMS_OF_SERVICE)}
        >
          <Text style={styles.rowTitle}>서비스 이용 약관</Text>
          <RightArrow color={COLORS.gray700} />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate(RouteNames.PRIVACY_POLICY)}
        >
          <Text style={styles.rowTitle}>개인정보 처리 방침</Text>
          <RightArrow color={COLORS.gray700} />
        </Pressable>
        <View style={styles.divider} />

        {/* 도움말 */}
        <Text style={styles.sectionLabel}>도움말</Text>
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate(RouteNames.INQUIRY)}
        >
          <Text style={styles.rowTitle}>문의하기</Text>
          <RightArrow color={COLORS.gray700} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  headerWrap: {
    position: 'relative',
  },

  headerCenterTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: scaleWidth(8),
    height: scaleWidth(52),
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenterTitle: {
    ...Heading_16B,
    color: COLORS.black,
  },

  container: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(5),
  },

  sectionLabel: {
    ...Caption_14R,
    color: COLORS.gray700,
    marginTop: scaleWidth(24),
    marginBottom: scaleWidth(12),
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleWidth(12),
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginTop: scaleWidth(12),
  },

  alarmRow: {
    alignItems: 'flex-start',
    paddingTop: scaleWidth(16),
  },

  alarmSwitch: {
    alignSelf: 'flex-start',
  },

  rowTitle: {
    ...Body_16SB,
    color: COLORS.black,
  },

  rowDesc: {
    ...Caption_14R,
    color: COLORS.gray700,
    marginTop: scaleWidth(8),
  },

  switchLarge: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});
