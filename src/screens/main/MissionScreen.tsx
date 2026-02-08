import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, scaleWidth, BORDER_RADIUS } from '../../styles/global';
import {
  Heading_24EB_Round,
  Body_16M,
  Heading_20EB_Round,
} from '../../styles/typography';
import Spacer from '../../components/Spacer';
import { useMissions } from '../../hooks/useMissions';
import { MissionCard, ArticleCard } from '../../components';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useArticleNavigation } from '../../hooks/useArticleNavigation';
import { convertMissionContentToArticle } from '../../api/missionApi';
import {
  MainTabNavigationProp,
  MissionStackParamList,
} from '../../navigation/types';
import { RouteNames } from '../../../routes';
import { useShowModal, useShowToastModal } from '../../store/modalStore';
import { usePointStore } from '../../store/pointStore';
import { ExperienceModalContent } from '../../components/ArticlePointModalContent';
import { useOnboardingStore } from '../../store/onboardingStore';

import {
  DAILY_ATTENDANCE_EXPERIENCE,
  DAILY_ATTENDANCE_POINT,
} from '../../config/rewards';
import { useExperienceStore } from '../../store/experienceStore';
import IconButton from '../../components/IconButton';
import { AlarmIcon, Modal_IMG } from '../../icons';
import { logEvent, logScreenView } from '../../services/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WIDTH_EDGE = scaleWidth(353); // 처음과 마지막 카드 너비
const WIDTH_MID = scaleWidth(348); // 중간 카드 너비
const GAP = scaleWidth(10); // 카드 사이 간격
const SCROLL_EVENT_THROTTLE = 16;
const DAILY_MISSION_ENTRY_KEY = '@daily_mission_entry';

// 첫 번째 카드를 중앙에 배치하기 위한 좌우 여백
const SIDE_SPACING = (SCREEN_WIDTH - WIDTH_EDGE) / 2;

export {
  QUIZ_CORRECT_EXPERIENCE,
  QUIZ_CORRECT_POINT,
  QUIZ_INCORRECT_EXPERIENCE,
  QUIZ_INCORRECT_POINT,
} from '../../config/rewards';

const MissionScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const verticalScrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation =
    useNavigation<MainTabNavigationProp<MissionStackParamList>>();
  const { handleArticlePress } = useArticleNavigation({ returnTo: 'mission' });

  const showModal = useShowModal();
  const showToastModal = useShowToastModal();
  const { addPoints } = usePointStore();
  const { addExperience } = useExperienceStore();
  const hasCheckedDailyEntryRef = useRef(false);
  const backPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 데이터 로딩
  const {
    data: missionData,
    isLoading: missionsLoading,
    refetch: refetchMissions,
  } = useMissions();

  // 온보딩 상태 관리
  const { resetOnboarding, isOnboardingCompleted, interests } =
    useOnboardingStore();
  const hasCheckedEmptyContentsRef = useRef(false);

  // 컨텐츠가 빈 배열이고 관심분야가 선택되지 않았을 때만 온보딩 화면으로 리다이렉트
  useEffect(() => {
    if (!missionsLoading && missionData) {
      const contents = missionData.contents || [];
      // 관심분야가 선택되었는지 확인 (null이거나 빈 객체가 아니면 선택됨)
      const hasInterests =
        interests !== null &&
        typeof interests === 'object' &&
        Object.keys(interests).length > 0;

      // 컨텐츠가 빈 배열이고, 온보딩이 완료된 상태이며, 관심분야가 선택되지 않았을 때만 리셋
      // (온보딩이 이미 진행 중이면 리셋하지 않음)
      if (
        contents.length === 0 &&
        isOnboardingCompleted &&
        !hasInterests &&
        !hasCheckedEmptyContentsRef.current
      ) {
        console.log(
          '[MissionScreen] 컨텐츠가 빈 배열이고 관심분야가 선택되지 않았습니다. 온보딩 상태를 리셋합니다.',
        );
        hasCheckedEmptyContentsRef.current = true;
        // 온보딩 리셋 시 관심분야 선택 단계로 설정
        resetOnboarding('interests');
      } else if (contents.length > 0 || hasInterests) {
        // 컨텐츠가 있거나 관심분야가 있으면 플래그 리셋 (다시 빈 배열이 될 수 있으므로)
        hasCheckedEmptyContentsRef.current = false;
      }
    }
  }, [
    missionData,
    missionsLoading,
    resetOnboarding,
    isOnboardingCompleted,
    interests,
  ]);

  // 화면 포커스 시 API 요청 및 스크롤 맨 위로 이동
  useFocusEffect(
    useCallback(() => {
      refetchMissions();
      // 탭 전환 시 스크롤을 맨 위로 이동
      verticalScrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [refetchMissions]),
  );

  const missions = useMemo(() => {
    if (!missionData?.missions) {
      return [];
    }

    // 정렬: 진행 중 -> 완료 -> 잠긴
    return [...missionData.missions].sort((a, b) => {
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
  }, [missionData?.missions]);
  const contents = useMemo(
    () => missionData?.contents || [],
    [missionData?.contents],
  );

  /**
   * 각 카드가 화면 중앙에 오기 위한 스크롤 위치(Offset) 수동 계산
   */
  const snapOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentPos = 0;

    missions.forEach((_, index) => {
      const isEdge = index === 0 || index === missions.length - 1;
      const cardWidth = isEdge ? WIDTH_EDGE : WIDTH_MID;

      const offset = currentPos;
      offsets.push(offset);

      currentPos += cardWidth + GAP;
    });
    return offsets;
  }, [missions]);

  // 스크롤 시 인덱스 업데이트
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;

      // 현재 스크롤 위치에서 가장 가까운 오프셋의 인덱스 찾기
      const index = snapOffsets.findIndex((offset, i) => {
        const nextOffset = snapOffsets[i + 1] || Infinity;
        return scrollPosition < (offset + nextOffset) / 2;
      });

      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [snapOffsets, currentIndex],
  );

  const handleNavigateToNotification = useCallback(() => {
    navigation.navigate(RouteNames.FULL_SCREEN_STACK, {
      screen: RouteNames.CHARACTER_NOTIFICATION,
    });
  }, [navigation]);

  // 안드로이드 뒤로가기 종료 처리 (화면이 포커스되어 있을 때만)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }
      const backAction = () => {
        // 뒤로가기할 페이지가 있으면 기본 동작 (뒤로가기)
        if (navigation.canGoBack()) {
          return false; // 기본 동작 허용
        }

        // 뒤로가기할 페이지가 없으면
        // 타이머가 있으면 (2초 내 두 번째 백키) 앱 종료
        if (backPressTimerRef.current) {
          clearTimeout(backPressTimerRef.current);
          backPressTimerRef.current = null;
          BackHandler.exitApp();
          return true;
        }

        // 첫 번째 백키: 토스트 표시
        showToastModal({
          message: "'뒤로' 버튼을 한번 더 누르시면 종료됩니다.",
          position: 'bottom',
          backgroundColor: COLORS.blackOpacity60,
          height: scaleWidth(67),
          width: scaleWidth(353),
          borderRadius: BORDER_RADIUS[16],
        });
        logScreenView('Popup_Out_App', undefined, true);

        // 2초 후 타이머 초기화
        backPressTimerRef.current = setTimeout(() => {
          backPressTimerRef.current = null;
        }, 2000);

        return true; // 기본 동작 차단
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
      return () => {
        backHandler.remove();
        if (backPressTimerRef.current) {
          clearTimeout(backPressTimerRef.current);
          backPressTimerRef.current = null;
        }
      };
    }, [navigation, showToastModal]),
  );

  // 일일 출석 체크
  useEffect(() => {
    if (hasCheckedDailyEntryRef.current) {
      return;
    }
    const checkDailyEntry = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const lastEntryDate = await AsyncStorage.getItem(
          DAILY_MISSION_ENTRY_KEY,
        );
        if (lastEntryDate !== today) {
          await AsyncStorage.setItem(DAILY_MISSION_ENTRY_KEY, today);
          hasCheckedDailyEntryRef.current = true;
          addPoints(DAILY_ATTENDANCE_POINT);
          addExperience(DAILY_ATTENDANCE_EXPERIENCE);
          showModal({
            title: '포인트 & 경험치 획득!',
            image: <Modal_IMG />,
            titleStyle: {
              ...Heading_20EB_Round,
            },
            titleDescriptionGapSize: scaleWidth(20),
            children: React.createElement(ExperienceModalContent, {
              point: true,
              daily: true,
            }),
            primaryButton: { title: '확인', onPress: () => {} },
          });
        } else {
          hasCheckedDailyEntryRef.current = true;
        }
      } catch (error) {
        console.error('일일 진입 체크 실패:', error);
      }
    };
    checkDailyEntry();
  }, [addExperience, addPoints, showModal]);

  if (missionsLoading) {
    return (
      <SafeAreaView style={missionScreenStyles.container}>
        <View style={missionScreenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.puple.main} />
        </View>
      </SafeAreaView>
    );
  }

  // 미션 데이터가 없어도 레이아웃은 유지
  const hasMissions = missions.length > 0;
  const hasContents = contents.length > 0;

  return (
    <SafeAreaView style={missionScreenStyles.container} edges={['top']}>
      <ScrollView
        ref={verticalScrollViewRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={missionScreenStyles.scrollContent}
      >
        {/* 헤더 */}
        <View style={missionScreenStyles.notificationButtonContainer}>
          <View style={missionScreenStyles.notificationButton} />
          <IconButton onPress={handleNavigateToNotification}>
            <AlarmIcon color={COLORS.gray800} />
          </IconButton>
        </View>
        <View style={missionScreenStyles.header}>
          <View style={missionScreenStyles.headerLeft}>
            <Text style={missionScreenStyles.headerTitle}>오늘의 미션</Text>
            <Text style={missionScreenStyles.headerDescription}>
              오늘의 미션을 통해 새로운 지식을 탐험하고{'\n'}문해력을
              키워보세요!
            </Text>
          </View>
        </View>

        <Spacer num={38} />

        {/* 미션 진행 카드 캐러셀 (무한스크롤 제거 버전) */}
        {hasMissions ? (
          <>
            <View>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={SCROLL_EVENT_THROTTLE}
                decelerationRate="fast"
                snapToOffsets={snapOffsets}
                snapToAlignment="start"
                disableIntervalMomentum={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{
                  paddingHorizontal: SIDE_SPACING,
                }}
              >
                {missions.map((mission, index) => {
                  const isEdge = index === 0 || index === missions.length - 1;
                  return (
                    <View
                      key={mission.id}
                      style={{
                        width: isEdge ? WIDTH_EDGE : WIDTH_MID,
                        marginRight: index === missions.length - 1 ? 0 : GAP,
                        height: scaleWidth(105),
                      }}
                    >
                      <MissionCard mission={mission} />
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <Spacer num={21} />

            {/* 캐러셀 인디케이터 */}
            <View style={missionScreenStyles.carouselIndicators}>
              {missions.map((_, index) => (
                <View
                  key={index}
                  style={[
                    missionScreenStyles.indicatorDot,
                    index === currentIndex &&
                      missionScreenStyles.indicatorDotActive,
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            {/* 미션 데이터가 없을 때 placeholder */}
            <View style={missionScreenStyles.emptyMissionContainer}>
              <Text style={missionScreenStyles.emptyText}>
                오늘의 미션이 없습니다
              </Text>
            </View>
            <Spacer num={16} />
          </>
        )}

        <Spacer num={47} />

        {/* 아티클 리스트 */}
        <View style={missionScreenStyles.articleList}>
          {hasContents ? (
            contents.map((content, index) => {
              const article = convertMissionContentToArticle(content, index);

              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={() => {
                    handleArticlePress(article.contentId);
                    if (index < 9) {
                      logEvent(`Card0${index + 1}_Home`);
                    }
                  }}
                />
              );
            })
          ) : (
            <View style={missionScreenStyles.emptyContentContainer}>
              <Text style={missionScreenStyles.emptyText}>
                추천 아티클이 없습니다
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export const missionScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: scaleWidth(8),
  },
  notificationButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(20),
    height: scaleWidth(52),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(8),
  },
  headerLeft: {
    flex: 1,
    paddingRight: scaleWidth(12),
  },
  notificationButton: {
    width: scaleWidth(112),
    height: scaleWidth(52),
  },
  headerTitle: {
    ...Heading_24EB_Round,
    color: COLORS.black,
    marginBottom: scaleWidth(4),
  },
  headerDescription: {
    ...Body_16M,
    color: COLORS.gray600,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleWidth(8),
  },
  indicatorDot: {
    width: scaleWidth(8),
    height: scaleWidth(8),
    backgroundColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS[99],
  },
  indicatorDotActive: {
    backgroundColor: COLORS.puple.main,
    width: scaleWidth(12),
    height: scaleWidth(12),
  },
  scrollContent: {
    paddingBottom: scaleWidth(50),
  },
  articleList: {
    gap: scaleWidth(24),
    paddingHorizontal: scaleWidth(20),
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
  emptyMissionContainer: {
    height: scaleWidth(200),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  emptyContentContainer: {
    minHeight: scaleWidth(100),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleWidth(40),
  },
  emptyText: {
    ...Body_16M,
    color: COLORS.gray600,
  },
});

export default MissionScreen;
