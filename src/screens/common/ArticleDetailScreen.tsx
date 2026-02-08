import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from '@react-navigation/native';
import { COLORS, scaleWidth, BORDER_RADIUS } from '../../styles/global';
import { Heading_20EB_Round } from '../../styles/typography';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { ExperienceModalContent } from '../../components/ArticlePointModalContent';
import { RouteNames } from '../../../routes';
import { FullScreenStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useShowModal, useShowToastModal } from '../../store/modalStore';
import { ARTICLE_READ_EXPERIENCE } from '../../config/rewards';
import { useExperienceStore } from '../../store/experienceStore';
import { LevelCategory } from '../../types/interests';
import {
  fetchContentDetail,
  ContentDetail,
  checkReadStatus,
} from '../../api/missionApi';
import { getUserInfo } from '../../services/authService';
import ArticleContent from '../../components/ArticleContent';
import { Modal_IMG } from '../../icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from '../../services/analyticsService';

type NavigationProp = NativeStackNavigationProp<FullScreenStackParamList>;

// 난이도별 읽기 시간 (초)
const READING_TIME_BY_DIFFICULTY: Record<LevelCategory, number> = {
  [LevelCategory.BEGINNER]: 50, // 초급: 50초
  [LevelCategory.INTERMEDIATE]: 90, // 중급: 90초
  [LevelCategory.ADVANCED]: 190, // 고급: 3분 10초 (190초)
};

const ArticleDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const difficulty = useOnboardingStore(state => state.difficulty);
  const showModal = useShowModal();
  const { addExperience } = useExperienceStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEarnedExperienceRef = useRef(false);
  const isScreenFocusedRef = useRef(true);
  const isFocused = useIsFocused();
  const screenEnterTimeRef = useRef<number | null>(null);
  const hasCheckedReadStatusRef = useRef(false);
  const hasShownNewArticleToastRef = useRef(false);

  // @ts-ignore - route params 타입은 나중에 추가
  const articleId = route.params?.articleId;
  // @ts-ignore - route params 타입은 나중에 추가
  const fromAd = route.params?.fromAd;

  const [contentDetail, setContentDetail] = useState<ContentDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API로 글 상세 정보 조회
  useEffect(() => {
    const loadContentDetail = async () => {
      if (!articleId) {
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

        const response = await fetchContentDetail(userInfo.userId, articleId);
        if (response.data) {
          setContentDetail(response.data);
        }
      } catch (err: any) {
        console.error('[글 상세] 로드 실패:', err);
        setError('글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContentDetail();
  }, [articleId]);

  // 난이도에 따른 읽기 시간 설정
  const readingTime = useMemo(() => {
    if (!difficulty) {
      return READING_TIME_BY_DIFFICULTY[LevelCategory.BEGINNER];
    }
    // difficulty가 문자열이면 LevelCategory enum 값으로 변환
    const levelCategory =
      typeof difficulty === 'string'
        ? (difficulty.toUpperCase() as LevelCategory)
        : difficulty;
    const time = READING_TIME_BY_DIFFICULTY[levelCategory];

    return time || READING_TIME_BY_DIFFICULTY[LevelCategory.BEGINNER];
  }, [difficulty]);
  const showToastModal = useShowToastModal();
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면 포커스 상태 추적 및 초기화
  useFocusEffect(
    useCallback(() => {
      // 화면이 포커스될 때 - 기존 타이머 정리 및 상태 리셋
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      isScreenFocusedRef.current = true;
      // 토스트 모달은 이미 표시되었으면 다시 표시하지 않음
      // hasShownNewArticleToastRef는 리셋하지 않음

      return () => {
        isScreenFocusedRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = null;
        }
      };
    }, []),
  );

  // 초기 마운트 시에만 토스트 모달 표시
  useEffect(() => {
    // 토스트 모달 표시 (광고를 보고 들어왔을 때만, 한 번만 표시)
    if (fromAd && !hasShownNewArticleToastRef.current) {
      hasShownNewArticleToastRef.current = true;
      toastTimerRef.current = setTimeout(() => {
        showToastModal({
          message: '새로운 글이 열렸어요',
          position: 'center',
          backgroundColor: COLORS.gray800Opacity80,
          height: scaleWidth(39),
          width: scaleWidth(148),
          borderRadius: BORDER_RADIUS[8],
        });
        toastTimerRef.current = null;
      }, 500);
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [fromAd, showToastModal]);

  // articleId가 변경되면 경험치 획득 상태 리셋
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    hasEarnedExperienceRef.current = false;
    hasCheckedReadStatusRef.current = false;
    hasShownNewArticleToastRef.current = false; // articleId 변경 시 토스트 모달 표시 상태 리셋
    screenEnterTimeRef.current = Date.now(); // articleId 변경 시 진입 시간 리셋
    isScreenFocusedRef.current = isFocused;
  }, [articleId, isFocused]);

  // 네비게이션 이벤트 리스너: 페이지 이탈 전 타이머 정리
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // 페이지 이탈 전 타이머 정리
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      isScreenFocusedRef.current = false;
    });

    return unsubscribe;
  }, [navigation]);

  // 타이머 설정
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // contentDetail이 없거나 이미 경험치를 획득했거나 화면이 포커스되지 않았으면 타이머 설정하지 않음
    if (
      !contentDetail ||
      hasEarnedExperienceRef.current ||
      !isFocused ||
      !isScreenFocusedRef.current
    ) {
      return;
    }

    // 경험치 획득 함수
    const handleExperienceGain = async () => {
      // 화면이 포커스되어 있지 않으면 경험치를 주지 않음
      if (!isScreenFocusedRef.current || !isFocused) {
        console.log(
          '[ArticleDetailScreen] 화면 포커스 없음으로 인해 경험치 지급 취소',
        );
        return;
      }

      // 다시 한 번 체크 (타이머 실행 시점에 이미 획득했을 수 있음)
      if (hasEarnedExperienceRef.current) {
        return;
      }

      // 화면이 여전히 포커스되어 있는지 다시 확인
      if (!isScreenFocusedRef.current || !isFocused) {
        console.log(
          '[ArticleDetailScreen] 화면 포커스 없음으로 인해 경험치 지급 취소',
        );
        return;
      }

      // ref를 먼저 true로 설정하여 중복 실행 방지
      hasEarnedExperienceRef.current = true;

      try {
        // 경험치 추가 (useMutation이 자동으로 캐시 무효화 처리)
        addExperience(ARTICLE_READ_EXPERIENCE);

        // 화면이 여전히 포커스되어 있는지 최종 확인
        if (!isScreenFocusedRef.current || !isFocused) {
          console.log(
            '[ArticleDetailScreen] 경험치 추가 후 화면 포커스 없음 감지, 모달 표시 취소',
          );
          return;
        }

        // 완독 여부 체크 API 호출
        if (!hasCheckedReadStatusRef.current && screenEnterTimeRef.current) {
          hasCheckedReadStatusRef.current = true;

          try {
            const userInfo = await getUserInfo();
            if (userInfo && articleId) {
              // 체류 시간 계산 (초)
              const staySeconds = Math.floor(
                (Date.now() - screenEnterTimeRef.current) / 1000,
              );

              // 완독 여부 체크 API 호출
              const readStatusResponse = await checkReadStatus(
                userInfo.userId,
                articleId,
                staySeconds,
                true,
              );

              console.log(
                '[ArticleDetailScreen] 완독 체크 응답:',
                readStatusResponse.data,
              );

              const readStatusData = readStatusResponse.data;

              // 레벨업이 발생한 경우 레벨업 정보를 저장 (미션 페이지에서 체크)
              if (readStatusData.levelUp && readStatusData.levelUpInfo) {
                try {
                  await AsyncStorage.setItem(
                    '@pending_level_up',
                    JSON.stringify(readStatusData.levelUpInfo),
                  );
                  console.log(
                    '[ArticleDetailScreen] 레벨업 정보 저장:',
                    readStatusData.levelUpInfo,
                  );
                } catch (storageError) {
                  console.error(
                    '[ArticleDetailScreen] 레벨업 정보 저장 실패:',
                    storageError,
                  );
                }
              }
            }
          } catch (readStatusError: any) {
            console.error(
              '[ArticleDetailScreen] 완독 체크 에러:',
              readStatusError,
            );
            // 완독 체크 실패해도 경험치 모달은 표시
          }
        }

        // 경험치 획득 모달 표시 (레벨업이 아닌 경우)
        showModal({
          title: '경험치 획득!',
          image: <Modal_IMG />,
          titleStyle: {
            ...Heading_20EB_Round,
          },
          titleDescriptionGapSize: scaleWidth(20),
          children: React.createElement(ExperienceModalContent),
          primaryButton: {
            title: '확인',
            onPress: () => {
              // 모달 닫기 (hideModal은 모달 컴포넌트에서 처리)
            },
          },
        });
      } catch (err) {
        console.error('경험치 획득 실패:', err);
        // 에러 발생 시 ref를 다시 false로 설정하여 재시도 가능하게
        if (isScreenFocusedRef.current && isFocused) {
          hasEarnedExperienceRef.current = false;
        }
      }
    };

    // 새 타이머 설정
    timerRef.current = setTimeout(() => {
      handleExperienceGain();
    }, readingTime * 1000);

    // cleanup: 컴포넌트 언마운트 또는 의존성 변경 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    readingTime,
    addExperience,
    showModal,
    isFocused,
    contentDetail,
    articleId,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header iconColor={COLORS.gray800} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.puple.main} />
          <Spacer num={16} />
          <Text>글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
      <Header
        iconColor={COLORS.gray800}
        backEventName="Back_ConfirmStandard_Reading"
      />
      <ScrollView
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 기사 내용 */}
        <ArticleContent content={contentDetail} />
        <Spacer num={48} />
      </ScrollView>
      {/* 하단 퀴즈 풀기 버튼 */}
      <Button
        title="퀴즈 풀기"
        onPress={() => {
          logEvent('StartQuiz_Reading');
          // @ts-ignore
          const returnTo = route.params?.returnTo || 'mission';
          navigation.navigate(RouteNames.QUIZ, {
            articleId: articleId || 0,
            returnTo,
          });
        }}
        variant="primary"
        style={styles.quizButton}
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
  content: {},
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
  quizButton: {
    marginHorizontal: scaleWidth(20),
  },
});

export default ArticleDetailScreen;
