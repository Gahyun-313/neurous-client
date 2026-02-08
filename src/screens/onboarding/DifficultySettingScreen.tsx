import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, scaleWidth } from '../../styles/global';
import {
  useCompleteOnboarding,
  useOnboardingStore,
} from '../../store/onboardingStore';
import { LevelCategory } from '../../types/interests';
import { ProgressBar } from '../../components';
import {
  Body_15M,
  Body_16M,
  Body_16R,
  Body_16SB,
  Heading_20EB_Round,
  Heading_24EB_Round,
} from '../../styles/typography';
import Spacer from '../../components/Spacer';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { getUserInfo } from '../../services/authService';
import { updateUserLevel } from '../../api/userApi';
import { useDifficultyInfo } from '../../hooks/useDifficultyInfo';
import { logEvent, logScreenView } from '../../services/analyticsService';

const DifficultySettingScreen = () => {
  const savedDifficulty = useOnboardingStore(state => state.difficulty);
  const setDifficulty = useOnboardingStore(state => state.setDifficulty);
  const [selectedDifficulty, setSelectedDifficulty] = useState<LevelCategory>(
    savedDifficulty || LevelCategory.BEGINNER,
  );
  const completeOnboarding = useCompleteOnboarding();

  // API에서 난이도 정보 가져오기
  const { difficultyInfo, isLoading } = useDifficultyInfo(selectedDifficulty);
  // 난이도 변경 시 저장
  const handleDifficultyChange = useCallback(
    (difficulty: LevelCategory) => {
      setSelectedDifficulty(difficulty);
      setDifficulty(difficulty);
      if (difficulty === LevelCategory.BEGINNER) {
        logEvent('Btn_Easy_Onboarding');
      } else if (difficulty === LevelCategory.INTERMEDIATE) {
        logEvent('Btn_Medium_Onboarding');
      } else if (difficulty === LevelCategory.ADVANCED) {
        logEvent('Btn_Hard_Onboarding');
      }
    },
    [setDifficulty],
  );
  useEffect(() => {
    const screenName =
      selectedDifficulty === LevelCategory.BEGINNER
        ? 'Onboarding_Difficulty_Easy'
        : selectedDifficulty === LevelCategory.INTERMEDIATE
        ? 'Onboarding_Difficulty_Medium'
        : 'Onboarding_Difficulty_Hard';
    logScreenView(screenName, undefined, true);
  }, [selectedDifficulty]);

  const handleNext = async () => {
    // 온보딩 완료 처리 및 메인 화면으로 이동
    logEvent('Next_Onboarding_Difficulty_Medium');
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.userId) {
      Alert.alert(
        '오류',
        '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
      );
      return;
    }
    console.log('[난이도 업데이트] API 호출 시작');
    await updateUserLevel(userInfo.userId, selectedDifficulty);
    console.log('[난이도 업데이트] API 호출 성공');
    await completeOnboarding();
  };
  const { bottom } = useSafeAreaInsets();

  // API 데이터가 있으면 사용, 없으면 기본값
  const selectedInfo = difficultyInfo
    ? {
        label: difficultyInfo.level,
        time: difficultyInfo.timeGuide,
        description: difficultyInfo.description,
      }
    : {
        label: '초급',
        time: '1분',
        description: '',
      };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header iconColor={COLORS.gray800} />
      <Spacer num={2} />

      <View style={styles.header}>
        <ProgressBar fill={2} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Spacer num={92} />
        <Text style={styles.title}>난이도를 선택해주세요</Text>
        <Spacer num={4} />
        <Text style={styles.subtitle}>
          화면에서 나의 관심분야 글을 확인할 수 있어요
        </Text>
        <Spacer num={32} />
        {/* 난이도 선택 버튼 */}
        <View style={styles.difficultyContainer}>
          <Button
            variant="primary"
            title="초급"
            style={[
              styles.difficultyButton,
              selectedDifficulty === LevelCategory.BEGINNER &&
                styles.difficultyButtonSelected,
            ]}
            onPress={() => handleDifficultyChange(LevelCategory.BEGINNER)}
          >
            <Text
              style={[
                styles.difficultyButtonText,
                selectedDifficulty === LevelCategory.BEGINNER &&
                  styles.difficultyButtonTextSelected,
              ]}
            >
              초급
            </Text>
          </Button>
          <Button
            variant="primary"
            title="중급"
            style={[
              styles.difficultyButton,
              selectedDifficulty === LevelCategory.INTERMEDIATE &&
                styles.difficultyButtonSelected,
            ]}
            onPress={() => handleDifficultyChange(LevelCategory.INTERMEDIATE)}
          >
            <Text
              style={[
                styles.difficultyButtonText,
                selectedDifficulty === LevelCategory.INTERMEDIATE &&
                  styles.difficultyButtonTextSelected,
              ]}
            >
              중급
            </Text>
          </Button>
          <Button
            variant="primary"
            title="고급"
            style={[
              styles.difficultyButton,
              selectedDifficulty === LevelCategory.ADVANCED &&
                styles.difficultyButtonSelected,
            ]}
            onPress={() => handleDifficultyChange(LevelCategory.ADVANCED)}
          >
            <Text
              style={[
                styles.difficultyButtonText,
                selectedDifficulty === LevelCategory.ADVANCED &&
                  styles.difficultyButtonTextSelected,
              ]}
            >
              고급
            </Text>
          </Button>
        </View>
        <Spacer num={32} />
        {/* 선택된 난이도 설명 */}
        {isLoading ? (
          <View>
            <Text style={styles.descriptionText}>
              난이도 정보를 불러오는 중...
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.descriptionTitleContainer}>
              <Text style={styles.descriptionTitle}>{selectedInfo.label}</Text>
              <Text style={styles.descriptionLabelTime}>
                {selectedInfo.time}
              </Text>
            </View>
            <Spacer num={20} />
            <Text style={styles.descriptionText}>
              {selectedInfo.description}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="primary"
          title="다음"
          onPress={handleNext}
          // disabled={!isNextButtonActive}
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
    paddingHorizontal: scaleWidth(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
  },
  title: {
    ...Heading_24EB_Round,
    color: COLORS.black,
  },
  subtitle: {
    ...Body_15M,
    color: COLORS.gray600,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: scaleWidth(8),
    height: scaleWidth(52),
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[12],
  },
  difficultyButton: {
    backgroundColor: 'transparent',
    width: scaleWidth(107),
    height: scaleWidth(36),
    borderRadius: BORDER_RADIUS[10],
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: COLORS.puple.main,
    borderColor: COLORS.puple.main,
    borderRadius: BORDER_RADIUS[10],
  },
  difficultyButtonText: {
    ...Body_16SB,
    color: COLORS.gray500,
  },
  difficultyButtonTextSelected: {
    ...Body_16SB,
    color: COLORS.white,
  },
  descriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(11),
  },
  descriptionTitle: {
    ...Heading_20EB_Round,
    color: COLORS.puple.main,
  },
  descriptionLabelTime: {
    ...Body_16M,
    color: COLORS.puple.main,
  },
  descriptionText: {
    ...Body_16R,
    color: COLORS.black,
  },
  footer: {
    paddingHorizontal: scaleWidth(20),
  },
});

export default DifficultySettingScreen;
