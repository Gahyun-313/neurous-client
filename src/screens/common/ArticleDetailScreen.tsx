/**
 * 글 상세 화면 (ArticleDetailScreen.tsx)
 *
 * 사용자가 선택한 글의 전체 내용을 표시하고, 일정 시간 읽으면 경험치를 지급한다.
 *
 * 주요 기능:
 *   1. 글 내용 표시 (API로 조회)
 *   2. 난이도별 읽기 시간 타이머 (초급 50초, 중급 90초, 고급 190초)
 *   3. 타이머 완료 시 경험치 획득 모달 표시
 *   4. 완독 여부 체크 API 호출 (레벨업 여부 확인)
 *   5. 퀴즈 풀기 버튼
 *
 * 복잡도 이유:
 *   - 화면 포커스 추적 (백그라운드 이동 시 타이머 중단 및 경험치 미지급)
 *   - 중복 경험치 지급 방지 (ref 사용)
 *   - 광고를 통해 열린 글인 경우 토스트 메시지 표시
 *   - 레벨업 발생 시 AsyncStorage에 저장 (MissionScreen에서 감지)
 */

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
  RouteProp,
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

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────

type NavigationProp = NativeStackNavigationProp<FullScreenStackParamList>;
type ArticleDetailRouteProp = RouteProp<
  FullScreenStackParamList,
  typeof RouteNames.ARTICLE_DETAIL
>;

// ──────────────────────────────────────────────
// 난이도별 읽기 시간 설정 (초 단위)
// ──────────────────────────────────────────────

/**
 * 난이도별 경험치 획득까지 필요한 최소 읽기 시간 (초)
 *
 * - BEGINNER (초급): 50초
 * - INTERMEDIATE (중급): 90초
 * - ADVANCED (고급): 190초 (3분 10초)
 *
 * 사용자의 난이도 설정에 따라 타이머가 자동으로 조정된다.
 */
const READING_TIME_BY_DIFFICULTY: Record<LevelCategory, number> = {
  [LevelCategory.BEGINNER]: 50,
  [LevelCategory.INTERMEDIATE]: 90,
  [LevelCategory.ADVANCED]: 190,
};

const ArticleDetailScreen = () => {
  const route = useRoute<ArticleDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const difficulty = useOnboardingStore(state => state.difficulty);
  const showModal = useShowModal();
  const showToastModal = useShowToastModal();
  const { addExperience } = useExperienceStore();
  const isFocused = useIsFocused();

  // ──────────────────────────────────────────────
  // Route Params (타입 안전)
  // ──────────────────────────────────────────────

  /** 표시할 글 ID */
  const articleId = route.params.articleId;

  /** 글을 읽은 후 돌아갈 화면 ('mission' | 'search') */
  const returnTo = route.params.returnTo;

  /** 광고를 통해 열린 글인지 여부 (토스트 메시지 표시용) */
  const fromAd = route.params.fromAd;

  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────

  /** 글 상세 내용 (API 응답 데이터) */
  const [contentDetail, setContentDetail] = useState<ContentDetail | null>(
    null,
  );

  /** 글 로딩 중 여부 */
  const [isLoading, setIsLoading] = useState(true);

  /** 에러 메시지 */
  const [error, setError] = useState<string | null>(null);

  // ──────────────────────────────────────────────
  // Refs
  // ──────────────────────────────────────────────

  /** 경험치 획득 타이머 */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 경험치를 이미 획득했는지 여부 (중복 지급 방지) */
  const hasEarnedExperienceRef = useRef(false);

  /** 화면이 현재 포커스되어 있는지 여부 (백그라운드 감지용) */
  const isScreenFocusedRef = useRef(true);

  /** 화면 진입 시각 (완독 체류 시간 계산용) */
  const screenEnterTimeRef = useRef<number | null>(null);

  /** 완독 여부 체크 API를 이미 호출했는지 여부 (중복 호출 방지) */
  const hasCheckedReadStatusRef = useRef(false);

  /** "새로운 글이 열렸어요" 토스트를 이미 표시했는지 여부 (중복 방지) */
  const hasShownNewArticleToastRef = useRef(false);

  /** 토스트 메시지 타이머 */
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ──────────────────────────────────────────────
  // Effect 1: 글 상세 정보 API 조회
  // ──────────────────────────────────────────────

  /**
   * 화면 진입 시 글 상세 정보를 API로 조회한다.
   *
   * 처리 흐름:
   *   1. articleId 유효성 검사
   *   2. getUserInfo()로 현재 사용자 정보 조회
   *   3. fetchContentDetail() API 호출
   *   4. 응답 데이터를 contentDetail 상태에 저장
   *
   * 에러 처리:
   *   - articleId 없음: "컨텐츠 ID가 없습니다" 에러
   *   - 사용자 정보 없음: "사용자 정보를 찾을 수 없습니다" 에러
   *   - API 실패: "글을 불러오는데 실패했습니다" 에러
   */
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

  // ──────────────────────────────────────────────
  // 난이도별 읽기 시간 계산
  // ──────────────────────────────────────────────

  /**
   * 사용자의 난이도 설정에 따라 경험치 획득까지 필요한 읽기 시간을 계산한다.
   *
   * - difficulty가 없으면 BEGINNER 기본값 사용
   * - difficulty가 문자열이면 대문자로 변환하여 LevelCategory enum과 매칭
   * - 매칭되는 시간이 없으면 BEGINNER 시간 사용 (안전장치)
   */
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

  // ──────────────────────────────────────────────
  // Effect 2: 화면 포커스 상태 추적 (useFocusEffect)
  // ──────────────────────────────────────────────

  /**
   * 화면 포커스/블러 시 타이머와 상태를 초기화한다.
   *
   * useFocusEffect를 사용하는 이유:
   *   - 탭 전환이나 다른 화면 이동 시 useEffect는 트리거되지 않음
   *   - useFocusEffect는 화면이 포커스될 때마다 실행됨
   *
   * 처리:
   *   1. 화면 포커스 시: 기존 타이머 정리, isScreenFocusedRef를 true로 설정
   *   2. 화면 블러 시: isScreenFocusedRef를 false로 설정, 타이머 정리
   *
   * 주의:
   *   - hasShownNewArticleToastRef는 리셋하지 않음 (한 번만 표시)
   */
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

      // cleanup: 화면이 블러될 때
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

  // ──────────────────────────────────────────────
  // Effect 3: 광고 통해 열린 글 토스트 메시지 표시
  // ──────────────────────────────────────────────

  /**
   * 광고를 통해 열린 글인 경우 "새로운 글이 열렸어요" 토스트 메시지를 표시한다.
   *
   * 조건:
   *   - fromAd: true (광고를 통해 열린 글)
   *   - !hasShownNewArticleToastRef.current: 아직 토스트를 표시하지 않음
   *
   * 타이밍:
   *   - 화면 진입 후 0.5초 뒤에 토스트 표시 (부드러운 UX)
   *
   * 토스트 설정:
   *   - 위치: 화면 중앙
   *   - 배경색: 반투명 회색
   *   - 크기: 148x39
   */
  useEffect(() => {
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

  // ──────────────────────────────────────────────
  // Effect 4: articleId 변경 시 상태 리셋
  // ──────────────────────────────────────────────

  /**
   * articleId가 변경되면 모든 상태와 타이머를 리셋한다.
   *
   * 이유:
   *   - 같은 화면에서 다른 글로 이동할 수 있음 (navigation.push)
   *   - 각 글마다 독립적인 경험치 획득 상태가 필요
   *
   * 리셋 항목:
   *   - 경험치 획득 타이머
   *   - 경험치 획득 여부
   *   - 완독 체크 API 호출 여부
   *   - 토스트 표시 여부
   *   - 화면 진입 시각
   */
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    hasEarnedExperienceRef.current = false;
    hasCheckedReadStatusRef.current = false;
    hasShownNewArticleToastRef.current = false;
    screenEnterTimeRef.current = Date.now();
    isScreenFocusedRef.current = isFocused;
  }, [articleId, isFocused]);

  // ──────────────────────────────────────────────
  // Effect 5: 페이지 이탈 전 타이머 정리
  // ──────────────────────────────────────────────

  /**
   * 네비게이션 이벤트를 감지하여 페이지 이탈 전 타이머를 정리한다.
   *
   * 'beforeRemove' 이벤트:
   *   - 뒤로가기, 화면 전환 등으로 이 화면을 떠나기 직전에 발생
   *   - 타이머를 정리하여 메모리 누수 방지
   *   - isScreenFocusedRef를 false로 설정하여 경험치 지급 방지
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      isScreenFocusedRef.current = false;
    });

    return unsubscribe;
  }, [navigation]);

  // ──────────────────────────────────────────────
  // Effect 6: 경험치 획득 타이머 설정 (핵심 로직)
  // ──────────────────────────────────────────────

  /**
   * 난이도별 읽기 시간이 경과하면 경험치를 지급한다.
   *
   * 타이머 설정 조건:
   *   - contentDetail 존재 (글 내용이 로드됨)
   *   - !hasEarnedExperienceRef.current (아직 경험치를 받지 않음)
   *   - isFocused && isScreenFocusedRef.current (화면이 포커스되어 있음)
   *
   * 경험치 지급 조건 (타이머 완료 시점):
   *   1. 화면 포커스 확인 (백그라운드나 다른 화면으로 이동하지 않았는지)
   *   2. hasEarnedExperienceRef 중복 체크
   *   3. 모든 조건 충족 시 경험치 지급 + 모달 표시
   *
   * 처리 흐름 (handleExperienceGain):
   *   1. 화면 포커스 최종 확인
   *   2. hasEarnedExperienceRef를 true로 설정 (중복 방지)
   *   3. addExperience() 호출 (경험치 추가)
   *   4. 완독 여부 체크 API 호출 (checkReadStatus)
   *   5. 레벨업 발생 시 AsyncStorage에 저장
   *   6. 경험치 획득 모달 표시
   *
   * 에러 처리:
   *   - 경험치 지급 실패 시: hasEarnedExperienceRef를 false로 리셋하여 재시도 가능하게
   *   - 완독 체크 실패 시: 에러 로그만 남기고 모달은 표시 (UX 우선)
   */
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 타이머 설정 조건 체크
    if (
      !contentDetail ||
      hasEarnedExperienceRef.current ||
      !isFocused ||
      !isScreenFocusedRef.current
    ) {
      return;
    }

    /**
     * 경험치 획득 처리 함수
     *
     * 다중 화면 포커스 검증:
     *   - 타이머 시작 시점, 타이머 완료 시점, 경험치 추가 후 등
     *     여러 시점에서 화면 포커스를 체크하여 안전성 확보
     */
    const handleExperienceGain = async () => {
      // 1차 화면 포커스 확인
      if (!isScreenFocusedRef.current || !isFocused) {
        console.log(
          '[ArticleDetailScreen] 화면 포커스 없음으로 인해 경험치 지급 취소',
        );
        return;
      }

      // 중복 실행 방지
      if (hasEarnedExperienceRef.current) {
        return;
      }

      // 2차 화면 포커스 확인 (타이머 실행 시점에 백그라운드로 이동했을 수 있음)
      if (!isScreenFocusedRef.current || !isFocused) {
        console.log(
          '[ArticleDetailScreen] 화면 포커스 없음으로 인해 경험치 지급 취소',
        );
        return;
      }

      // ref를 먼저 true로 설정하여 중복 실행 방지
      hasEarnedExperienceRef.current = true;

      try {
        // 경험치 추가
        addExperience(ARTICLE_READ_EXPERIENCE);

        // 3차 화면 포커스 확인 (경험치 추가 후 백그라운드 이동 감지)
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
                true, // isCompleted: 완독으로 처리
              );

              console.log(
                '[ArticleDetailScreen] 완독 체크 응답:',
                readStatusResponse.data,
              );

              const readStatusData = readStatusResponse.data;

              // 레벨업이 발생한 경우 레벨업 정보를 AsyncStorage에 저장
              // MissionScreen에서 이 정보를 감지하여 레벨업 모달 표시
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
            // 완독 체크 실패해도 경험치 모달은 표시 (UX 우선)
          }
        }

        // 경험치 획득 모달 표시
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

  // ──────────────────────────────────────────────
  // UI 렌더링
  // ──────────────────────────────────────────────

  // 로딩 중
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

  // 정상 렌더링
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
          navigation.navigate(RouteNames.QUIZ, {
            articleId: articleId,
            returnTo: returnTo || 'mission',
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
