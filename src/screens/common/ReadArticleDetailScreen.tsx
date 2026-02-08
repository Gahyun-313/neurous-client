import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute } from '@react-navigation/native';
import { BORDER_RADIUS, COLORS, scaleWidth } from '../../styles/global';
import Header from '../../components/Header';
import Button from '../../components/Button';
import ArticleContent from '../../components/ArticleContent';
import QuizFeedback from '../../components/QuizFeedback';
import Spacer from '../../components/Spacer';
import { useScrollToQuiz } from '../../hooks/useScrollToQuiz';
import { useQuizButton } from '../../hooks/useQuizButton';
import { FullScreenStackRouteProp } from '../../navigation/types';
import { RouteNames } from '../../../routes';
import { fetchReadContentDetail, ReadContentDetail } from '../../api/userApi';
import { getUserInfo } from '../../services/authService';

// 플랫폼별 버튼 영역 높이 상수
const BUTTON_WRAPPER_HEIGHT = Platform.OS === 'ios' ? 246 : 267;

const ReadArticleDetailScreen = () => {
  const route =
    useRoute<FullScreenStackRouteProp<typeof RouteNames.READ_ARTICLE_DETAIL>>();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const quizSectionRef = useRef<View>(null);

  // 라우트 파라미터에서 contentId 추출
  const contentId = route.params?.articleId;

  const [contentDetail, setContentDetail] = useState<ReadContentDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API로 읽은 글 상세 정보 조회
  useEffect(() => {
    const loadContentDetail = async () => {
      if (!contentId) {
        setError('컨텐츠 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const userInfo = await getUserInfo();
        if (!userInfo || !userInfo.userId) {
          setError('사용자 정보를 찾을 수 없습니다.');
          setIsLoading(false);
          return;
        }

        const response = await fetchReadContentDetail(
          userInfo.userId,
          contentId,
        );
        if (response.data) {
          setContentDetail(response.data);
        }
      } catch (err: any) {
        console.error('[읽은 글 상세] 로드 실패:', err);
        setError('글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContentDetail();
  }, [contentId]);

  // 퀴즈 데이터
  const quiz = useMemo(() => {
    if (contentDetail?.quiz) {
      return {
        id: contentDetail.quiz.quizId,
        question: contentDetail.quiz.quizContent,
        options: contentDetail.quiz.choices.map(choice => ({
          id: choice.quizChoiceId,
          text: choice.choiceText,
        })),
        correctAnswerId: contentDetail.quiz.correctChoiceNo,
      };
    }
  }, [contentDetail]);

  // 선택한 답안
  const selectedAnswerId = contentDetail?.quiz?.selectedNo || null;

  // 스크롤 감지 및 제어 커스텀 훅
  const { showQuiz, handleScroll, scrollToQuiz, scrollToTop } = useScrollToQuiz(
    {
      scrollViewRef,
      quizSectionRef,
    },
  );

  // 버튼 상태 및 핸들러 커스텀 훅
  const { buttonTitle, handleButtonPress } = useQuizButton({
    showQuiz,
    onScrollToQuiz: scrollToQuiz,
    onScrollToTop: scrollToTop,
  });

  // 동적 paddingBottom 계산: 버튼 영역 높이 + safeAreaBottom
  const contentPaddingBottom = useMemo(
    () => scaleWidth(BUTTON_WRAPPER_HEIGHT) + safeAreaBottom,
    [safeAreaBottom],
  );

  // 로딩 중
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header iconColor={COLORS.gray800} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={COLORS.puple.main} />
          <Spacer num={16} />
          <Text>글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 또는 데이터 없음
  if (error || !contentDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <Header iconColor={COLORS.gray800} />
        <View style={styles.errorContainer}>
          <Text>{error || '기사를 찾을 수 없습니다.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header iconColor={COLORS.gray800} />
      <ScrollView
        bounces={false}
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 기사 내용 */}
        <ArticleContent content={contentDetail.content} />
        <Spacer num={12} />
        {/* 퀴즈 섹션 */}
        {quiz && (
          <QuizFeedback
            question={quiz.question}
            options={quiz.options}
            correctAnswerId={quiz.correctAnswerId}
            selectedAnswerId={selectedAnswerId}
            showFeedbackMessage={true}
            containerRef={quizSectionRef}
          />
        )}
      </ScrollView>

      <View
        style={[styles.fixedButtonContainer, { paddingBottom: safeAreaBottom }]}
      >
        <View style={styles.buttonWrapper}>
          <LinearGradient
            colors={[COLORS.white, COLORS.transparent]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.overlayBackdrop}
          />
          <Button
            title={buttonTitle}
            onPress={handleButtonPress}
            variant="primary"
            style={styles.fixedButton}
          />
        </View>
      </View>
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
    // paddingBottom은 동적으로 계산됨 (버튼 높이 + safeAreaBottom)
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    position: 'relative',
    width: scaleWidth(393),
    height: scaleWidth(175),
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? scaleWidth(10) : scaleWidth(31),
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fixedButton: {
    width: scaleWidth(103),
    height: scaleWidth(47),
    borderRadius: BORDER_RADIUS[30],
    backgroundColor: COLORS.gray800,
    // iOS 그림자
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android 그림자
    elevation: 8,
  },
});

export default ReadArticleDetailScreen;
