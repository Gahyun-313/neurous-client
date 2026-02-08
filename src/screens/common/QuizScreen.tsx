import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, scaleWidth, BORDER_RADIUS } from '../../styles/global';
import {
  Body_16M,
  Body_16SB,
  Heading_18EB_Round,
  Heading_20EB_Round,
} from '../../styles/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import QuizOptionCard from '../../components/QuizOptionCard';
import QuizQuestion from '../../components/QuizQuestion';
import Spacer from '../../components/Spacer';
import { Modal_IMG, CheckIcon } from '../../icons';
import { useShowModal, useHideModal } from '../../store/modalStore';
import DifficultySelectionModal, {
  Difficulty,
} from '../../components/DifficultySelectionModal';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ExperienceModalContent } from '../../components/ArticlePointModalContent';
import { usePointStore } from '../../store/pointStore';
import { useExperienceStore } from '../../store/experienceStore';
import {
  useDifficultySubmit,
  checkCanSubmitDifficulty,
} from '../../hooks/useDifficultySubmit';
import { createQuizCompleteNavigation } from '../../utils/quizNavigation';
import { fetchQuiz, QuizResponse, submitQuiz } from '../../api/missionApi';
import { getUserInfo } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent, logScreenView } from '../../services/analyticsService';

type QuizState = 'question' | 'feedback';

interface QuizOption {
  id: number;
  text: string;
}

const QuizScreen: React.FC = () => {
  const route = useRoute();
  // @ts-ignore
  const articleId = route.params?.articleId || 0;
  // @ts-ignore
  const returnTo = route.params?.returnTo || 'mission';
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [quizResult, setQuizResult] = useState<{
    correctChoiceNo: number;
    isAnswerCorrect: boolean;
  } | null>(null);
  const showModal = useShowModal();
  const hideModal = useHideModal();
  const navigation = useNavigation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { submitDifficultyToServer } = useDifficultySubmit();

  // quizState가 'feedback'으로 변경될 때만 로그 기록
  // 'question' 상태는 RootNavigator에서 이미 '퀴즈'로 자동 로그가 기록됨
  useEffect(() => {
    if (quizState === 'feedback') {
      logScreenView('Quiz_Answer', undefined, true);
    }
  }, [quizState]);

  // 퀴즈 데이터 로드
  useEffect(() => {
    const loadQuiz = async () => {
      if (!articleId) {
        return;
      }

      try {
        const userInfo = await getUserInfo();
        if (!userInfo || !userInfo.userId) {
          return;
        }

        const response = await fetchQuiz(userInfo.userId, articleId);
        console.log('[퀴즈 조회 API] 요청:', {
          userId: userInfo.userId,
          articleId,
        });
        console.log('[퀴즈 조회 API] 응답:', JSON.stringify(response, null, 2));
        if (response.data) {
          console.log('[퀴즈 조회 API] 데이터:', {
            quizId: response.data.quizId,
            quizContent: response.data.quizContent,
            choicesCount: response.data.choices?.length,
            choices: response.data.choices,
          });
          setQuizData(response.data);
        }
      } catch (err: any) {
        console.error('[퀴즈] 로드 실패:', err);
      }
    };

    loadQuiz();
  }, [articleId]);

  const handleOptionSelect = (optionId: number) => {
    if (quizState === 'question') {
      setSelectedOptionId(optionId);
    }
  };
  const { addPoints } = usePointStore();
  const { addExperience } = useExperienceStore();
  const handleNext = async () => {
    if (!selectedOptionId || !quiz || !quizData) {
      return;
    }

    try {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        console.error('[퀴즈] 사용자 정보 없음');
        return;
      }

      // 선택한 선택지의 choiceNo 찾기
      const selectedChoice = quizData.choices.find(
        choice => choice.quizChoiceId === selectedOptionId,
      );
      if (!selectedChoice) {
        console.error('[퀴즈] 선택한 선택지를 찾을 수 없습니다.');
        return;
      }

      // 퀴즈 제출 API 호출
      const submitRequest = {
        quizId: quiz.id,
        selectedNo: selectedChoice.choiceNo,
        readContentId: articleId,
      };
      logEvent('Next_Quiz');

      const response = await submitQuiz(userInfo.userId, submitRequest);
      console.log('[퀴즈 제출 API] 응답:', JSON.stringify(response, null, 2));

      const { quizResultResponse, rewardResponse, userLevelInformation } =
        response.data;

      console.log('[퀴즈 제출 API] 데이터:', {
        isAnswerCorrect: quizResultResponse?.isAnswerCorrect,
        correctChoiceNo: quizResultResponse?.correctChoiceNo,
        earnedPoint: rewardResponse?.earnedPoint,
        earnedExp: rewardResponse?.earnedExp,
        userLevelInformation,
      });

      // 퀴즈 결과 저장 (피드백 화면에서 정답 판단용)
      if (quizResultResponse) {
        setQuizResult({
          correctChoiceNo: quizResultResponse.correctChoiceNo,
          isAnswerCorrect: quizResultResponse.isAnswerCorrect,
        });
      }

      // 포인트 및 경험치 추가
      addPoints(rewardResponse.earnedPoint);
      addExperience(rewardResponse.earnedExp);

      // 레벨업 정보가 있으면 AsyncStorage에 저장
      if (userLevelInformation) {
        await AsyncStorage.setItem(
          '@pending_level_up',
          JSON.stringify(userLevelInformation),
        );
      }

      // 경험치 획득 모달 표시
      showModal({
        title: '포인트 & 경험치 획득!',
        image: <Modal_IMG />,
        titleStyle: {
          ...Heading_20EB_Round,
        },
        titleDescriptionGapSize: scaleWidth(20),
        children: React.createElement(ExperienceModalContent, {
          point: true,
          correct: quizResultResponse.isAnswerCorrect,
        }),
        primaryButton: {
          title: '확인',
          onPress: () => {},
        },
      });

      setQuizState('feedback');
    } catch (error: any) {
      console.error('[퀴즈] 제출 실패:', error);
    }
  };

  const handleComplete = async () => {
    // 기존 타이머가 있으면 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 하루에 한 번만 난이도 모달 표시 체크
    const canSubmit = await checkCanSubmitDifficulty();

    // 오늘 이미 전송했다면 모달 표시하지 않고 바로 이동
    if (!canSubmit) {
      navigation.dispatch(createQuizCompleteNavigation(returnTo));
      return;
    }
    logEvent('Complete_Quiz_Answer');

    // 난이도 선택 모달 표시
    showModal({
      title: '이번 글의 난이도는\n 어떠셨나요?',
      titleStyle: {
        ...Heading_18EB_Round,
      },
      description: '글의 난이도에 반영해드려요!',
      descriptionColor: COLORS.gray600,
      titleDescriptionGapSize: scaleWidth(8),
      closeOnBackdropPress: false,
      children: (
        <DifficultySelectionModal
          initialDifficulty={selectedDifficulty}
          onSelect={async difficulty => {
            setSelectedDifficulty(difficulty);

            // 서버로 난이도 전송
            await submitDifficultyToServer(articleId, difficulty);

            // 난이도 선택 시 모달 닫고 원래 화면으로 이동
            setTimeout(() => {
              hideModal();
              navigation.dispatch(createQuizCompleteNavigation(returnTo));
            }, 200);
          }}
        />
      ),
    });
  };

  // 마지막 마침표 제거 유틸리티 함수
  const removeTrailingPeriod = (text: string | undefined): string => {
    if (!text) {
      return '';
    }
    return text.endsWith('.') ? text.slice(0, -1) : text;
  };

  // API 응답을 기존 Quiz 구조로 변환
  const quiz = quizData
    ? {
        id: quizData.quizId,
        question: removeTrailingPeriod(quizData.quizContent), // question -> quizContent 수정, 마지막 마침표 제거
        options: quizData.choices.map(choice => ({
          id: choice.quizChoiceId,
          text: removeTrailingPeriod(choice.choiceText), // 마지막 마침표 제거
        })),
        correctAnswerId:
          quizData.choices.find(choice => choice.correct)?.quizChoiceId || 0,
      }
    : null;

  const isCorrect = (optionId: number) => {
    if (!quiz || !quizData) {
      return false;
    }

    // 피드백 화면에서는 API 응답의 correctChoiceNo 사용
    if (quizState === 'feedback' && quizResult) {
      // choiceNo로 정답 찾기
      const option = quizData.choices.find(
        choice => choice.quizChoiceId === optionId,
      );
      return option?.choiceNo === quizResult.correctChoiceNo;
    }

    // 문제 화면에서는 초기 데이터의 correct 필드 사용
    return optionId === quiz.correctAnswerId;
  };

  const renderOption = (option: QuizOption, index: number) => {
    if (quizState === 'question') {
      // 문제 화면: 선택 여부에 따라 스타일 변경
      const isSelected = selectedOptionId === option.id;
      return (
        <Pressable
          key={option.id}
          style={[styles.optionCard, isSelected && styles.optionCardSelected]}
          onPress={() => {
            if (index === 0) {
              logEvent('Choice1_Quiz');
            } else if (index === 1) {
              logEvent('Choice2_Quiz');
            } else if (index === 2) {
              logEvent('Choice3_Quiz');
            }
            handleOptionSelect(option.id);
          }}
        >
          <Text style={styles.optionText}>{option.text}</Text>
          <View style={[styles.checkIcon]}>
            <View
              style={[
                styles.checkIconContainer,
                {
                  backgroundColor: isSelected
                    ? COLORS.puple.main
                    : COLORS.gray300,
                },
              ]}
            >
              <CheckIcon color={isSelected ? COLORS.white : COLORS.gray100} />
            </View>
          </View>
        </Pressable>
      );
    } else {
      // 피드백 화면: 정답/오답에 따라 스타일 변경
      const correct = isCorrect(option.id);
      return (
        <QuizOptionCard key={option.id} option={option} isCorrect={correct} />
      );
    }
  };

  if (!quiz) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        iconColor={COLORS.gray800}
        backEventName="Back_ConfirmStandard_Quiz"
      />
      <Spacer num={32} />
      <ScrollView
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Q 아이콘과 문제 */}
        <QuizQuestion question={quiz.question} />

        <Spacer num={40} />

        {/* 선택지 */}
        {quiz.options.map((option, index) => {
          return (
            <View key={option.id}>
              {renderOption(option, index)}
              {index !== quiz.options.length - 1 && <Spacer num={16} />}
            </View>
          );
        })}

        <Spacer num={48} />
      </ScrollView>

      {/* 하단 버튼 */}
      <Button
        title={quizState === 'question' ? '다음' : '완료'}
        onPress={quizState === 'question' ? handleNext : handleComplete}
        variant="primary"
        style={styles.actionButton}
        disabled={quizState === 'question' && !selectedOptionId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(20),
    paddingBottom: scaleWidth(100),
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleWidth(20),
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleWidth(20),
    borderRadius: BORDER_RADIUS[16],
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: 'transparent', // 기본적으로 투명한 border로 크기 유지
  },
  optionCardSelected: {
    borderColor: COLORS.puple.main,
    backgroundColor: COLORS.puple[3],
  },
  optionCardCorrect: {
    borderColor: COLORS.blue.main,
    backgroundColor: COLORS.blue[3],
    borderWidth: 1,
  },
  optionCardIncorrect: {
    borderColor: COLORS.red.main,
    backgroundColor: COLORS.red[3],
  },
  checkIconContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.gray300,
  },
  correctIconContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.blue.main,
  },
  incorrectIconContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[99],
    backgroundColor: COLORS.red.main,
  },
  optionText: {
    ...Body_16M,
    color: COLORS.black,
    flex: 1,
  },
  checkIcon: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    borderRadius: BORDER_RADIUS[99],
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIconCorrect: {
    backgroundColor: 'blue',
  },
  feedbackIconIncorrect: {
    backgroundColor: 'red',
  },
  circleIcon: {
    width: scaleWidth(12),
    height: scaleWidth(12),
    borderRadius: scaleWidth(6),
    backgroundColor: COLORS.white,
  },
  xIconText: {
    color: COLORS.white,
    fontSize: scaleWidth(16),
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleWidth(20),
    paddingTop: scaleWidth(16),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  actionButton: {
    marginHorizontal: scaleWidth(20),
  },
  difficultyOptionsContainer: {
    width: '100%',
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: scaleWidth(68),
    paddingHorizontal: scaleWidth(32),
    borderRadius: BORDER_RADIUS[16],
    backgroundColor: COLORS.gray100,
  },
  difficultyOptionSelected: {
    borderColor: COLORS.puple.main,
    backgroundColor: COLORS.puple[3],
    borderWidth: 1,
  },
  difficultyOptionText: {
    ...Body_16SB,
    color: COLORS.black,
  },
  difficultyCheckContainer: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS[99],
  },
});

export default QuizScreen;
