import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RouteNames } from '../../../routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { COLORS, scaleWidth, BORDER_RADIUS } from '../../styles/global';
import {
  Body_16R,
  Caption_14R,
  Caption_12M,
  Heading_20EB_Round,
  Heading_24EB_Round,
  Heading_18EB_Round,
} from '../../styles/typography';
import { Button, MissionCard } from '../../components';
import {
  CharacterStackParamList,
  MainTabNavigationProp,
} from '../../navigation/types';
import { levelList } from '../../screens/character/criteria/level/levelData';
import Spacer from '../../components/Spacer';
import LottieView from 'lottie-react-native';
import {
  Check_3DIcon,
  Level_1_Tooltip,
  Level_2_Tooltip,
  Level_3_Tooltip,
  Level_4_Tooltip,
  Level_5_Tooltip,
  RightArrowIcon,
  ProgressBarIcon,
  InfoIcon,
  PIcon,
  XPIcon,
} from '../../icons';
import { Body_15M, Heading_16B } from '../../styles/typography';
import {
  useCharacterMe,
  useCharacterData,
  convertWeeklyAttendanceToAttendanceData,
  convertCharacterMissionToMission,
} from '../../hooks/useCharacter';
import { ActivityIndicator } from 'react-native';
import { logEvent } from '../../services/analyticsService';

/**
 * 로티는 require() 번들 방식으로 고정한다.
 * 아래 JSON 파일들은 반드시 "src/assets/lottie/" 경로에 실제로 존재해야 함.
 */
const LOTTIE_BY_LEVEL: Record<number, any> = {
  1: require('../../assets/lottie/Lv1.json'),
  2: require('../../assets/lottie/Lv2.json'),
  3: require('../../assets/lottie/Lv3.json'),
  4: require('../../assets/lottie/Lv4.json'),
  5: require('../../assets/lottie/Lv5.json'),
};

const CharacterScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const rootNavigation =
    useNavigation<MainTabNavigationProp<CharacterStackParamList>>();
  const tabBarHeight = useBottomTabBarHeight(); // 탭바 높이

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // React Query hooks - 통합 API 사용
  const {
    data: characterMeResponse,
    isLoading: characterLoading,
    error: characterError,
    refetch: refetchCharacterMe,
  } = useCharacterMe();

  // 다음 레벨 경험치를 가져오기 위한 별도 API 호출
  const {
    data: characterData,
    refetch: refetchCharacterData,
    isLoading: characterDataLoading,
  } = useCharacterData();

  // characterData 로딩 상태 로깅
  if (__DEV__) {
    console.log('[CharacterScreen] characterData 상태:', {
      characterData,
      characterDataLoading,
      hasNextLevelExp: !!characterData?.nextLevelExp,
    });
  }

  // 탭 전환 시 스크롤을 맨 위로 이동 및 최신 데이터 조회
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      refetchCharacterMe();
      refetchCharacterData(); // 다음 레벨 경험치도 최신 데이터로 갱신
    }, [refetchCharacterMe, refetchCharacterData]),
  );

  // data 래퍼에서 실제 데이터 추출
  const characterMeData = characterMeResponse?.data;

  // 데이터 변환
  const attendanceData = useMemo(
    () =>
      characterMeData?.attendance
        ? convertWeeklyAttendanceToAttendanceData(characterMeData.attendance)
        : [],
    [characterMeData?.attendance],
  );

  const missions = useMemo(() => {
    if (!characterMeData?.missions) {
      return [];
    }

    const convertedMissions = characterMeData.missions.map((mission, index) =>
      convertCharacterMissionToMission(mission, index),
    );

    // 정렬: 진행 중 -> 완료 -> 잠긴
    return convertedMissions.sort((a, b) => {
      // 진행 중 (status === '진행 중') 우선
      if (a.status === '진행 중' && b.status !== '진행 중') {
        return -1;
      }
      if (b.status === '진행 중' && a.status !== '진행 중') {
        return 1;
      }

      // 완료 (status === '완료') 다음
      if (
        a.status === '완료' &&
        b.status !== '완료' &&
        b.status !== '진행 중'
      ) {
        return -1;
      }
      if (
        b.status === '완료' &&
        a.status !== '완료' &&
        a.status !== '진행 중'
      ) {
        return 1;
      }

      // 잠긴 (status === null) 마지막
      if (a.status === null && b.status !== null) {
        return 1;
      }
      if (b.status === null && a.status !== null) {
        return -1;
      }

      return 0;
    });
  }, [characterMeData?.missions]);

  // 기본값 설정
  const userGrowthInfo = characterMeData?.userGrowthInfo;
  const currentLevel = useMemo(() => {
    if (!userGrowthInfo?.levelEnum) {
      return 1;
    }
    const match = userGrowthInfo.levelEnum.match(/LEVEL_(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }, [userGrowthInfo?.levelEnum]);
  const currentExp = userGrowthInfo?.currentExp ?? 0;
  const currentPoints = userGrowthInfo?.currentPoint ?? 0;
  const progressPercent = userGrowthInfo?.progressPercent ?? 0;
  const nextLevelExp = useMemo(() => {
    // API에서 받은 다음 레벨 경험치 사용
    console.log('[CharacterScreen] characterData 전체:', characterData);
    if (characterData?.nextLevelExp) {
      console.log(
        '[CharacterScreen] nextLevelExp from API:',
        characterData.nextLevelExp,
      );
      return characterData.nextLevelExp;
    }
    console.log(
      '[CharacterScreen] characterData?.nextLevelExp 없음, fallback 계산 사용',
      {
        characterData,
        hasNextLevelExp: !!characterData?.nextLevelExp,
      },
    );
    // API 데이터가 없으면 progressPercent를 기반으로 계산
    if (progressPercent === 100) {
      // 최대 레벨에 도달한 경우
      return currentExp;
    }
    if (currentExp === 0 || progressPercent === 0) {
      // 경험치가 0이거나 progressPercent가 0인 경우 기본값 반환
      return 100;
    }
    const calculated = Math.round((currentExp / progressPercent) * 100);
    // Infinity나 NaN 체크
    if (!isFinite(calculated) || isNaN(calculated)) {
      return 100;
    }
    return calculated;
  }, [characterData, currentExp, progressPercent]);

  // 메모이제이션: 레벨 데이터
  const currentLevelData = useMemo(
    () => levelList.find(l => l.id === currentLevel),
    [currentLevel],
  );

  // 메모이제이션: 레벨에 맞는 툴팁 컴포넌트
  const LevelTooltip = useMemo(() => {
    switch (currentLevel) {
      case 1:
        return Level_1_Tooltip;
      case 2:
        return Level_2_Tooltip;
      case 3:
        return Level_3_Tooltip;
      case 4:
        return Level_4_Tooltip;
      case 5:
        return Level_5_Tooltip;
      default:
        return Level_1_Tooltip;
    }
  }, [currentLevel]);

  // 메모이제이션: 진행률 계산 (API에서 받은 progressPercent 사용)
  const progressPercentageValue = useMemo(
    () => progressPercent || Math.round((currentExp / nextLevelExp) * 100),
    [currentExp, nextLevelExp, progressPercent],
  );

  // 로티 source: require 맵핑
  const lottieSource = useMemo(() => {
    const src = LOTTIE_BY_LEVEL[currentLevel] ?? LOTTIE_BY_LEVEL[1];
    console.log('[Lottie] source level =', currentLevel);
    return src;
  }, [currentLevel]);

  // 로딩 상태
  const isLoading = characterLoading;
  const hasError = characterError;

  // 캐릭터 정보 클릭 핸들러
  const handleCharacterInfoPress = useCallback(() => {
    // 기존 타이머가 있으면 제거
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    logEvent('Tooltip_Character');
    // 툴팁 표시
    setShowTooltip(true);

    // 1500ms 후 툴팁 숨기기
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
      tooltipTimerRef.current = null;
    }, 1500);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  const handleNavigateToCriteria = useCallback(() => {
    logEvent('Confirm_LevelStandard_Character');
    rootNavigation.navigate(RouteNames.FULL_SCREEN_STACK, {
      screen: RouteNames.CHARACTER_CRITERIA,
    });
  }, [rootNavigation]);

  const handleNavigateToPointHistory = useCallback(() => {
    logEvent('Confirm_PXp_Character');
    rootNavigation.navigate(RouteNames.FULL_SCREEN_STACK, {
      screen: RouteNames.CHARACTER_POINT_HISTORY,
    });
  }, [rootNavigation]);

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.puple.main} />
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>데이터를 불러오는 중 오류가 발생했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />

      <ScrollView
        ref={scrollViewRef}
        bounces={false}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
      >
        {/* 로티 영역 */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={lottieSource}
            style={styles.lottie}
            autoPlay
            loop
            resizeMode="cover"
            /**
             * 이미지( png )가 포함된 로티면 assets 폴더를 명시해야 함
             * ※ 이 경로는 "android/app/src/main/assets" 기준으로도 존재해야 함
             */
            imageAssetsFolder={
              Platform.OS === 'ios'
                ? `lottie/lv${currentLevel}`
                : `lottie/lv${currentLevel}/images`
            }
          />
        </View>

        {/* 레벨 버튼 */}
        <View style={styles.levelButtonContainer}>
          <Button
            style={styles.levelButton}
            onPress={handleCharacterInfoPress}
            variant="ghost"
          >
            <Text style={[styles.levelButtonText]}>
              {currentLevelData?.title || 'Lv. 1 아메바'}
            </Text>
            <InfoIcon color={COLORS.gray400} />
          </Button>
          {/* 툴팁 */}
          {showTooltip && (
            <View style={styles.tooltipContainer}>
              <LevelTooltip />
            </View>
          )}
        </View>

        {/* 레벨 진행 카드 */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardHeader}>
            <Text style={styles.levelCardTitle}>Lv. {currentLevel}</Text>
            <TouchableOpacity
              onPress={handleNavigateToCriteria}
              activeOpacity={1}
            >
              <View style={styles.levelCriteriaLinkWrapper}>
                <Text style={styles.levelCriteriaLink}>레벨 기준 확인하기</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 경험치 진행 바 */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarIconWrapper,
                  {
                    width: `${progressPercentageValue}%`,
                  },
                ]}
              >
                <View style={styles.progressBarIconContainer}>
                  <ProgressBarIcon />
                </View>
              </View>
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                경험치 {currentExp}/{nextLevelExp}
              </Text>
              <Text style={styles.progressPercentage}>
                {progressPercentageValue}%
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 포인트/경험치 정보 */}
          <TouchableOpacity
            style={styles.statsRowContainer}
            onPress={handleNavigateToPointHistory}
            activeOpacity={1}
          >
            <View style={styles.statsRowContainerWrapper}>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>경험치</Text>
                <View style={styles.statsValueContainer}>
                  <XPIcon />
                  <Text style={styles.statsValue}>{currentExp} XP</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>포인트</Text>
                <View style={styles.statsValueContainer}>
                  <PIcon />
                  <Text style={styles.statsValue}>{currentPoints} P</Text>
                </View>
              </View>
            </View>
            <RightArrowIcon color={COLORS.gray700} />
          </TouchableOpacity>
        </View>

        <Spacer num={24} />

        {/* 주간 출석 기록 */}
        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>주간 출석 기록</Text>
          <Spacer num={16} />
          <View style={styles.attendanceDays}>
            {attendanceData.map((item, index) => (
              <View key={index} style={styles.attendanceDay}>
                <Text style={styles.attendanceDayText}>{item.day}</Text>
                <View style={[styles.attendanceCircle]}>
                  {item.attended && <Check_3DIcon />}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Spacer num={48} />

        {/* 오늘의 미션 */}
        <View style={styles.missionSection}>
          <Text style={styles.sectionTitle}>오늘의 미션</Text>
          <Text style={styles.sectionDescription}>
            진행 중인 미션을 완료하면 새로운 미션이 열려요!
          </Text>
          <Spacer num={32} />
          {missions.map((mission: any) => (
            <View key={mission.id} style={styles.missionCardWrapper}>
              <MissionCard mission={mission} myPage={true} />
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default CharacterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // scrollContent: {
  //   paddingBottom: 0,
  // },
  lottieContainer: {
    width: '100%',
    height: scaleWidth(882),
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  levelButtonContainer: {
    position: 'absolute',
    top: scaleWidth(60),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tooltipContainer: {
    marginTop: scaleWidth(30),
    position: 'absolute',
    top: scaleWidth(46),
    alignItems: 'center',
  },
  levelButton: {
    marginTop: scaleWidth(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlayWhite,
    paddingHorizontal: scaleWidth(16),
    height: scaleWidth(44),
    borderRadius: BORDER_RADIUS[99],
    gap: scaleWidth(8),
    borderWidth: scaleWidth(2),
    borderColor: COLORS.white,
  },
  levelButtonText: {
    ...Heading_20EB_Round,
    color: COLORS.black,
  },

  levelCard: {
    backgroundColor: COLORS.overlayWhite,
    width: scaleWidth(353),
    height: scaleWidth(268),
    borderRadius: BORDER_RADIUS[20],
    borderWidth: scaleWidth(3),
    borderColor: COLORS.white,
    position: 'absolute',
    top: scaleWidth(439),
    left: scaleWidth(20),
    padding: scaleWidth(24),
    overflow: 'hidden',
  },
  divider: {
    width: scaleWidth(353),
    marginLeft: scaleWidth(-24),
    marginRight: scaleWidth(-24),
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
    marginVertical: scaleWidth(20),
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleWidth(12),
  },
  levelCardTitle: {
    ...Heading_24EB_Round,
    color: COLORS.black,
  },
  levelCriteriaLinkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS[30],
    width: scaleWidth(113),
    height: scaleWidth(30),
  },
  levelCriteriaLink: {
    ...Caption_12M,
    color: COLORS.gray800,
  },
  progressBarWrapper: {
    gap: scaleWidth(12),
  },
  progressBarContainer: {
    backgroundColor: COLORS.gray200,
    height: scaleWidth(18),
    borderRadius: scaleWidth(9.5),
    overflow: 'hidden',
  },
  progressBarIconWrapper: {
    height: '100%',
    borderRadius: scaleWidth(9.5),
    overflow: 'hidden',
  },
  progressBarIconContainer: {
    width: '100%',
    height: '100%',
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...Caption_14R,
    color: COLORS.gray800,
  },
  progressPercentage: {
    ...Heading_20EB_Round,
    color: COLORS.puple.main,
  },
  statsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: scaleWidth(30),
  },
  statsRowContainerWrapper: {
    flex: 1,
    gap: scaleWidth(20),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    ...Heading_16B,
    color: COLORS.black,
  },
  statsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  statsValue: {
    ...Heading_18EB_Round,
    color: COLORS.black,
  },
  xpIconBox: {
    width: scaleWidth(26),
    height: scaleWidth(26),
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.blue[5],
    justifyContent: 'center',
    alignItems: 'center',
  },

  pointIconBox: {
    width: scaleWidth(26),
    height: scaleWidth(26),
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.yellow[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceSection: {
    position: 'absolute',
    width: scaleWidth(359),
    height: scaleWidth(118),
    top: scaleWidth(757),
    left: scaleWidth(20),
  },
  sectionTitle: {
    ...Heading_18EB_Round,
    color: COLORS.black,
    marginBottom: scaleWidth(4),
  },
  sectionDescription: {
    ...Body_16R,
    color: COLORS.gray700,
  },
  attendanceDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scaleWidth(15.83),
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS[16],
    paddingVertical: scaleWidth(30),
    paddingHorizontal: scaleWidth(24),
  },
  attendanceDay: {
    alignItems: 'center',
    gap: scaleWidth(4),
    flex: 1,
  },
  attendanceCircle: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceDayText: {
    ...Body_15M,
    color: COLORS.black,
  },
  missionSection: {
    paddingHorizontal: scaleWidth(20),
  },
  missionCardWrapper: {
    marginBottom: scaleWidth(16),
  },
  notificationButtonContainer: {
    marginTop: scaleWidth(30),
    position: 'absolute',
    top: scaleWidth(40),
    right: scaleWidth(20),
  },
  notificationButton: {
    marginTop: scaleWidth(30),
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: BORDER_RADIUS[16],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
});
