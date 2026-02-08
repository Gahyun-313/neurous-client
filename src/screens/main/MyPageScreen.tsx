// MyPageScreen.tsx
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, scaleWidth, BORDER_RADIUS } from '../../styles/global';
import {
  Heading_18EB_Round,
  Body_16M,
  Caption_14R,
  Heading_18SB,
} from '../../styles/typography';

import Spacer from '../../components/Spacer';
import { TimelineGroup } from '../../components/TimelineGroup';
import IconButton from '../../components/IconButton';

import {
  useNavigation,
  CompositeNavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MyPageStackParamList,
  RootStackParamList,
} from '../../navigation/types';

import { RouteNames } from '../../../routes';

import {
  Check_2Icon,
  Level_1_Profile,
  Level_2_Profile,
  Level_3_Profile,
  Level_4_Profile,
  Level_5_Profile,
  NoArticlesIcon,
  SettingIcon,
  TriangleIcon,
} from '../../icons';
import { useShowBottomSheetModal, useHideModal } from '../../store/modalStore';
import LevelSelectionContent from '../../components/LevelSelectionContent';
import { useCharacterData } from '../../hooks/useCharacter';
import { useMyPage } from '../../hooks/useMyPage';
import { useUpdateLevel } from '../../hooks/useUpdateLevel';
import {
  getLevelText,
  categoryNameMap,
  formatArticleDate,
  calculateWeekRange,
  convertToYYYYMMDD,
  convertMyPageContentsToReadArticles,
} from '../../utils/myPageUtils';
import { logEvent, logScreenView } from '../../services/analyticsService';

// MyPageStack + RootStack 합친 네비게이션 타입
type MyPageNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MyPageStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MyPageScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  // 날짜 범위 계산
  const currentWeekRange = useMemo(
    () => calculateWeekRange(selectedWeek),
    [selectedWeek],
  );
  const { myPageData, setMyPageData } = useMyPage(
    convertToYYYYMMDD(currentWeekRange.split(' - ')[0]),
  );

  const showBottomSheetModal = useShowBottomSheetModal();
  const hideModal = useHideModal();
  const { handleUpdateLevel } = useUpdateLevel({
    setMyPageData,
    onSuccess: () => hideModal(),
    onError: () => hideModal(),
  });

  const navigation = useNavigation<MyPageNavigationProp>();
  const { data: characterData } = useCharacterData();
  const currentLevel = characterData?.currentLevel ?? 1;

  // 탭 전환 시 스크롤을 맨 위로 이동
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );
  const ProfileImage = useMemo(() => {
    switch (currentLevel) {
      case 1:
        return <Level_1_Profile />;
      case 2:
        return <Level_2_Profile />;
      case 3:
        return <Level_3_Profile />;
      case 4:
        return <Level_4_Profile />;
      case 5:
        return <Level_5_Profile />;
      default:
        return <Level_1_Profile />;
    }
  }, [currentLevel]);

  // 읽은 글 데이터 변환
  const readArticles = useMemo(() => {
    if (!myPageData?.contents || myPageData.contents.length === 0) {
      return [];
    }
    return convertMyPageContentsToReadArticles(myPageData.contents);
  }, [myPageData?.contents]);

  // 관심분야 태그 목록
  const interestTags = useMemo(() => {
    if (myPageData?.interests && myPageData.interests.length > 0) {
      return myPageData.interests.map(id => categoryNameMap[id] || id);
    }
    return [];
  }, [myPageData?.interests]);

  // 난이도
  const currentDifficulty = myPageData?.level || null;

  // '>' 버튼 활성화 여부
  const canGoNext = useMemo(() => {
    return selectedWeek < 0;
  }, [selectedWeek]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollViewRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            paddingHorizontal: scaleWidth(20),
            height: scaleWidth(52),
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onPress={() => {
              navigation.getParent()?.navigate(RouteNames.FULL_SCREEN_STACK, {
                screen: RouteNames.SETTINGS,
              });
              logEvent('Setting_My');
            }}
          >
            <SettingIcon />
          </IconButton>
        </View>
        <Spacer num={20} />

        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>{ProfileImage}</View>
          <View style={styles.profileInfo}>
            <Text style={styles.userId}>{myPageData?.name}</Text>
            <Text style={styles.userEmail}>{myPageData?.email}</Text>
          </View>
        </View>

        <Spacer num={41} />

        {/* 나의 관심분야 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>나의 관심분야</Text>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate(RouteNames.ONBOARDING, {
                  screen: RouteNames.INTERESTS,
                  params: { editMode: true },
                });
                logEvent('EditInterest_My');
              }}
            >
              <Text style={styles.editButton}>편집</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.interestTags}>
            {interestTags.length > 0 ? (
              interestTags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>관심분야를 선택해주세요</Text>
            )}
          </View>
        </View>

        <Spacer num={33} />

        {/* 나의 난이도 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 난이도</Text>
          <Spacer num={16} />

          <TouchableOpacity
            style={styles.levelButton}
            onPress={() => {
              logScreenView('EditLevelModal', undefined, true);
              showBottomSheetModal({
                children: React.createElement(LevelSelectionContent, {
                  selectedLevel: currentDifficulty,
                  onSelect: handleUpdateLevel,
                }),
                paddingHorizontal: 0,
              });
              logEvent('EditLevel_My');
            }}
          >
            <Text style={styles.levelText}>
              {getLevelText(currentDifficulty)}
            </Text>
            <Check_2Icon color={COLORS.gray600} />
          </TouchableOpacity>
        </View>

        <Spacer num={32} />

        {/* 읽은 글 섹션 */}
        <View style={styles.readArticleSection}>
          <Spacer num={32} />
          <Text style={styles.sectionTitle}>읽은 글</Text>
          <Spacer num={6} />

          {/* 날짜 선택기 */}
          <View style={styles.dateSelector}>
            <IconButton
              onPress={() => {
                setSelectedWeek(prev => prev - 1);
                logEvent('Back_DateRead_My');
              }}
            >
              <TriangleIcon color={COLORS.gray600} />
            </IconButton>

            <Text style={styles.dateRange}>{currentWeekRange}</Text>

            <IconButton
              onPress={() => {
                // canGoNext가 true일 때만 이동
                if (canGoNext) {
                  setSelectedWeek(prev => prev + 1);
                  logEvent('Next_DateRead_My');
                }
              }}
              disabled={!canGoNext}
            >
              <TriangleIcon
                color={canGoNext ? COLORS.gray600 : COLORS.gray200}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </IconButton>
          </View>

          <Spacer num={24} />

          {/* 타임라인 */}
          {readArticles.length > 0 ? (
            readArticles.map((dateGroup, groupIndex) => (
              <TimelineGroup
                key={`${dateGroup.date}-${groupIndex}`}
                dateGroup={dateGroup}
                formatDate={formatArticleDate}
                isLast={groupIndex === readArticles.length - 1}
                onArticlePress={articleId => {
                  navigation
                    .getParent()
                    ?.navigate(RouteNames.FULL_SCREEN_STACK, {
                      screen: RouteNames.READ_ARTICLE_DETAIL,
                      params: {
                        articleId,
                      },
                    });
                }}
              />
            ))
          ) : (
            <View style={styles.noArticlesContainer}>
              <NoArticlesIcon />
              <Spacer num={16} />
              <Text style={styles.noArticlesText}>읽은 글이 없어요</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: scaleWidth(8),
  },

  // 프로필 섹션
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  profileImageContainer: {
    marginRight: scaleWidth(16),
    width: scaleWidth(90),
    height: scaleWidth(90),
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scaleWidth(1),
    borderColor: COLORS.gray200,
  },

  profileInfo: {
    flex: 1,
  },
  userId: {
    ...Heading_18EB_Round,
    color: COLORS.black,
  },
  userEmail: {
    ...Body_16M,
    color: COLORS.gray700,
  },

  // 섹션 공통
  section: {
    paddingHorizontal: scaleWidth(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleWidth(9),
    height: scaleWidth(44),
  },
  sectionTitle: {
    ...Heading_18EB_Round,
    color: COLORS.black,
  },

  // 관심분야
  editButton: {
    ...Body_16M,
    color: COLORS.puple.main,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
  },
  interestTag: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleWidth(8),
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.gray100,
  },
  interestTagText: {
    ...Body_16M,
    color: COLORS.gray700,
  },
  emptyText: {
    ...Caption_14R,
    color: COLORS.gray500,
  },

  // 나의 레벨
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.gray100,
    width: scaleWidth(71),
    height: scaleWidth(40),
    gap: scaleWidth(10),
  },
  levelText: {
    ...Body_16M,
    color: COLORS.gray700,
  },

  // 읽은 글 섹션
  readArticleSection: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleWidth(40),
  },

  // 날짜 선택기
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRange: {
    ...Heading_18SB,
    color: COLORS.black,
  },
  noArticlesContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: scaleWidth(100),
    paddingBottom: scaleWidth(128),
  },
  noArticlesText: {
    ...Caption_14R,
    color: COLORS.gray600,
  },
});

export default MyPageScreen;
