import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RouteNames } from '../../../routes';
import { scaleWidth, COLORS, BORDER_RADIUS } from '../../styles/global';
import {
  Heading_24EB_Round,
  Body_15M,
  Body_18M,
  Heading_18SB,
} from '../../styles/typography';
import {
  MainTabNavigationProp,
  OnboardingStackParamList,
} from '../../navigation/types';
import Spacer from '../../components/Spacer';
import ProgressBar from '../../components/ProgressBar';
import { Button } from '../../components';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useShowToastModal } from '../../store/modalStore';
import {
  CheckIcon,
  FirstIcon,
  SecondIcon,
  ThirdIcon,
} from '../../icons/commonIcons/commonIcons';
import Header from '../../components/Header';
import { Interest, INTERESTS, InterestCategory } from '../../types/interests';
import { updateUserInterests } from '../../api/userApi';
import { getUserInfo } from '../../services/authService';
import { logEvent, logScreenView } from '../../services/analyticsService';

const FIRST_ROW_INTERESTS = INTERESTS.slice(0, 3);
const SECOND_ROW_INTERESTS = INTERESTS.slice(3, 6);

// Analytics 이벤트 이름 매핑
const INTEREST_EVENT_MAP: Record<string, { onboarding: string; edit: string }> =
  {
    정치: {
      onboarding: 'InterestTag_Politics_Onboarding',
      edit: 'InterestTag_Politics_EditInterest',
    },
    경제: {
      onboarding: 'InterestTag_Economy_Onboarding',
      edit: 'InterestTag_Economy_EditInterest',
    },
    사회: {
      onboarding: 'InterestTag_Society_Onboarding',
      edit: 'InterestTag_Society_EditInterest',
    },
    세계: {
      onboarding: 'InterestTag_World_Onboarding',
      edit: 'EditInterest_World_EditInterest',
    },
  };

interface InterestTagProps {
  interest: Interest;
  priority: number | null;
  isSelected: boolean;
  onPress: (id: InterestCategory) => void;
  editMode?: boolean;
}

const InterestTag: React.FC<InterestTagProps> = ({
  interest,
  priority,
  isSelected,
  onPress,
  editMode = false,
}) => {
  const handlePress = useCallback(() => {
    onPress(interest.id);

    // Analytics 이벤트 로깅
    const eventMap = INTEREST_EVENT_MAP[interest.name];
    if (eventMap) {
      const eventName = editMode ? eventMap.edit : eventMap.onboarding;
      logEvent(eventName);
    } else if (interest.name.includes('생활')) {
      logEvent(
        editMode
          ? 'InterestTag_Lifestyle_Culture_EditInterest'
          : 'InterestTag_LifeCulture_Onboarding',
      );
    } else if (interest.name.includes('IT')) {
      logEvent(
        editMode
          ? 'InterestTag_It_Science_EditInterest'
          : 'InterestTag_It_Science_Onboarding',
      );
    }
  }, [interest.id, interest.name, onPress, editMode]);

  const renderPriorityIcon = useCallback(() => {
    switch (priority) {
      case 1:
        return <FirstIcon />;
      case 2:
        return <SecondIcon />;
      case 3:
        return <ThirdIcon />;
      default:
        return null;
    }
  }, [priority]);

  return (
    <View style={styles.tagContainer}>
      {isSelected && <View style={styles.tagSpacer} />}
      {priority !== null && (
        <View style={styles.priorityBadge}>{renderPriorityIcon()}</View>
      )}
      <Button
        variant="ghost"
        textStyle={styles.tagText}
        style={[styles.tag, isSelected && styles.tagSelected]}
        onPress={handlePress}
      >
        <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
          {interest.name}
        </Text>
        {isSelected && (
          <View style={styles.checkIconContainer}>
            <CheckIcon color={COLORS.puple.main} />
          </View>
        )}
      </Button>
    </View>
  );
};

const InterestsScreen = () => {
  const navigation =
    useNavigation<MainTabNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'interests'>>();
  const setOnboardingStep = useOnboardingStore(
    state => state.setOnboardingStep,
  );
  const savedInterests = useOnboardingStore(state => state.interests);
  const setInterests = useOnboardingStore(state => state.setInterests);
  const showToastModal = useShowToastModal();

  // 편집 모드 확인
  const editMode = route.params?.editMode || false;

  // 선택 순서를 저장: Map<InterestCategory, 순서(1, 2, ...)>
  const [selectedInterests, setSelectedInterests] = useState<
    Map<InterestCategory, number>
  >(new Map());

  // 저장된 관심분야가 로드되면 state에 반영
  useEffect(() => {
    if (savedInterests) {
      const interestsMap = new Map<InterestCategory, number>();
      Object.entries(savedInterests).forEach(([key, value]) => {
        if (Object.values(InterestCategory).includes(key as InterestCategory)) {
          interestsMap.set(key as InterestCategory, value);
        }
      });
      setSelectedInterests(interestsMap);
    }
  }, [savedInterests]);

  // Analytics 화면 조회 로깅
  useEffect(() => {
    if (editMode) {
      logScreenView('EditInterest', undefined, true);
    } else {
      const screenName =
        selectedInterests.size > 0
          ? 'Onboarding_Interest02'
          : 'Onboarding_Interest01';
      logScreenView(screenName, undefined, true);
    }
  }, [selectedInterests.size, editMode]);
  const toggleInterest = useCallback(
    (id: InterestCategory) => {
      setSelectedInterests(prev => {
        const newSelected = new Map(prev);

        // 이미 선택된 경우 제거하고 순서 재정렬
        if (newSelected.has(id)) {
          const removedOrder = newSelected.get(id)!;
          newSelected.delete(id);
          // 제거된 순서보다 큰 순서들을 1씩 감소
          newSelected.forEach((order, key) => {
            if (order > removedOrder) {
              newSelected.set(key, order - 1);
            }
          });
        } else {
          // 최대 3개 제한 체크
          if (newSelected.size >= 3) {
            setTimeout(() => {
              showToastModal({
                message: '최대 3순위까지 선택할 수 있어요',
                position: 'center',
                backgroundColor: COLORS.gray800Opacity80,
                height: scaleWidth(39),
                width: scaleWidth(212),
                borderRadius: BORDER_RADIUS[8],
              });
            }, 0);
            return prev;
          }

          // 최대 순서를 찾아서 +1
          const maxOrder = Math.max(0, ...Array.from(newSelected.values()));
          newSelected.set(id, maxOrder + 1);
        }

        // 변경된 관심분야를 AsyncStorage에 저장
        const interestsData: Record<string, number> = {};
        newSelected.forEach((order, key) => {
          interestsData[key] = order;
        });
        setInterests(interestsData);
        return newSelected;
      });
    },
    [setInterests, showToastModal],
  );

  const getPriority = useCallback(
    (id: InterestCategory): number | null => {
      return selectedInterests.get(id) || null;
    },
    [selectedInterests],
  );

  const handleNext = useCallback(async () => {
    // 선택된 관심분야를 순서대로 배열로 변환
    const interestsArray = Array.from(selectedInterests.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([category]) => category);

    // 서버 API 호출
    try {
      const userInfo = await getUserInfo();
      if (!userInfo?.userId) {
        Alert.alert(
          '오류',
          '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
        );
        return;
      }

      await updateUserInterests(userInfo.userId, interestsArray);
    } catch (error) {
      console.error('[관심분야 업데이트] 서버 업데이트 실패:', error);
      Alert.alert(
        '업데이트 실패',
        '관심분야 업데이트에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.',
      );
      return;
    }

    if (editMode) {
      navigation.goBack();
      logEvent('Complete_EditInterest');
    } else {
      await setOnboardingStep('difficulty');
      logEvent('Next_Onboarding_Interest02');
      navigation.navigate(RouteNames.DIFFICULTY_SETTING);
    }
  }, [navigation, setOnboardingStep, editMode, selectedInterests]);

  const isNextButtonActive = useMemo(
    () => selectedInterests.size >= 1,
    [selectedInterests.size],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        iconColor={COLORS.gray800}
        title={editMode ? '관심분야 설정하기' : ''}
        backEventName={editMode ? 'Back_EditInterest' : undefined}
      />
      <Spacer num={2} />
      {!editMode && (
        <View style={styles.header}>
          <ProgressBar fill={1} />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Spacer num={editMode ? 54 : 92} />
        <Text style={styles.title}>관심분야를 선택해주세요</Text>
        <Spacer num={4} />
        <Text style={[Body_15M, { color: COLORS.gray600 }]}>
          미션 화면에서 나의 관심분야 글을 확인할 수 있어요
        </Text>
        <Spacer num={52} />
        {/* 모든 관심분야 */}
        <View style={styles.tagsWrapper}>
          <View style={styles.tagsRow}>
            {FIRST_ROW_INTERESTS.map(interest => {
              const priority = getPriority(interest.id);
              return (
                <InterestTag
                  key={interest.id}
                  interest={interest}
                  priority={priority}
                  isSelected={priority !== null}
                  onPress={toggleInterest}
                />
              );
            })}
          </View>
          <View style={styles.tagsRow}>
            {SECOND_ROW_INTERESTS.map(interest => {
              const priority = getPriority(interest.id);
              return (
                <InterestTag
                  key={interest.id}
                  interest={interest}
                  priority={priority}
                  isSelected={priority !== null}
                  onPress={toggleInterest}
                  editMode={editMode}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="primary"
          title={editMode ? '완료' : '다음'}
          onPress={handleNext}
          disabled={!editMode && !isNextButtonActive}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
  },
  title: {
    ...Heading_24EB_Round,
    color: COLORS.black,
  },
  tagsWrapper: {
    gap: scaleWidth(8),
  },
  tagsRow: {
    flexDirection: 'row',
    gap: scaleWidth(12),
  },
  tagContainer: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tagSpacer: {
    height: scaleWidth(50),
  },
  tag: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleWidth(8),
    height: scaleWidth(43),
    borderRadius: BORDER_RADIUS[30],
    backgroundColor: COLORS.puple[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagSelected: {
    backgroundColor: COLORS.puple.main,
    gap: scaleWidth(10),
  },
  priorityBadge: {
    position: 'absolute',
    top: scaleWidth(0),
    alignSelf: 'center',
  },
  tagText: {
    ...Body_18M,
    color: COLORS.puple.main,
  },
  tagTextSelected: {
    ...Heading_18SB,
    color: COLORS.white,
  },
  checkIconContainer: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.white,
  },
  footer: {
    paddingHorizontal: scaleWidth(20),
  },
});

export default InterestsScreen;
