import React, { useCallback, useRef } from 'react';
import { Alert, ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useShowModal, useHideModal } from '../store/modalStore';
import { RouteNames } from '../../routes';
import { RootStackParamList } from '../navigation/types';
import { ARTICLE_READ_POINT_COST } from '../config/rewards';
import {
  ArticlePointModalContent,
  ArticlePointModalContentGet,
} from '../components/ArticlePointModalContent';
import { COLORS } from '../styles/global';
import { Heading_16B } from '../styles/typography';
import {
  fetchContentAccess,
  purchaseContentWithPoint,
} from '../api/missionApi';
import { getUserInfo } from '../services/authService';
import { usePointStore } from '../store/pointStore';
import { logEvent, logScreenView } from '../services/analyticsService';

type ReturnTo = 'mission' | 'search';

interface UseArticleNavigationOptions {
  returnTo: ReturnTo;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 기사 클릭 및 네비게이션 처리 커스텀 훅
 * 포인트 확인, 모달 표시, 네비게이션을 통합 관리
 */
export const useArticleNavigation = ({
  returnTo,
}: UseArticleNavigationOptions): {
  handleArticlePress: (articleId: number) => void;
} => {
  const navigation = useNavigation<NavigationProp>();
  const showModal = useShowModal();
  const hideModal = useHideModal();
  const isProcessingRef = useRef(false);
  const { points: storePoints } = usePointStore();

  const handleArticlePress = useCallback(
    async (articleId: number) => {
      // 중복 호출 방지
      if (isProcessingRef.current) {
        console.log('[useArticleNavigation] 이미 처리 중, 중복 호출 방지');
        return;
      }

      isProcessingRef.current = true;

      try {
        // 사용자 정보 가져오기
        const userInfo = await getUserInfo();
        if (!userInfo) {
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
          return;
        }

        // 글 접근 권한 확인 API 호출
        const accessResponse = await fetchContentAccess(
          userInfo.userId,
          articleId,
        );

        // console.log('[useArticleNavigation] 접근 권한 응답:', accessResponse);

        const accessData = accessResponse.data;

        // API 응답의 currentPoints가 없으면 스토어의 포인트 사용
        const currentPoints =
          accessData.currentPoints !== undefined
            ? accessData.currentPoints
            : storePoints;

        console.log('[useArticleNavigation] 포인트 확인:', {
          accessData,
          apiPoints: accessData.currentPoints,
          storePoints,
          currentPoints,
        });

        // readable이 false면 모달 표시
        // 포인트 확인
        if (currentPoints >= ARTICLE_READ_POINT_COST) {
          // 포인트가 충분한 경우 - 포인트 사용 모달
          // 모달 표시 시 애널리틱스 로그
          await logScreenView('Popup_Reading', undefined, true);

          showModal({
            title: '새로운 글을 읽으시겠어요?',
            description: `사용 가능한 포인트: ${currentPoints}p`,
            descriptionColor: COLORS.gray600,
            closeButton: true,
            children: React.createElement(ArticlePointModalContent),
            primaryButton: {
              title: '새 글 읽기',
              textStyle: Heading_16B,
              onPress: async () => {
                // 중복 호출 방지

                if (isProcessingRef.current) {
                  console.log(
                    '[useArticleNavigation] 포인트 구매 이미 처리 중, 중복 호출 방지',
                  );
                  // 로딩 모달 표시
                  showModal({
                    title: '처리 중...',
                    children: React.createElement(
                      View,
                      { style: { paddingVertical: 20, alignItems: 'center' } },
                      React.createElement(ActivityIndicator, {
                        size: 'large',
                        color: COLORS.puple.main,
                      }),
                    ),
                    closeButton: false,
                    closeOnBackdropPress: false,
                  });
                  logEvent('ReadNewArticle_Popup_Reading');
                  return;
                }

                isProcessingRef.current = true;

                // 로딩 모달 표시
                showModal({
                  title: '처리 중...',
                  children: React.createElement(
                    View,
                    { style: { paddingVertical: 20, alignItems: 'center' } },
                    React.createElement(ActivityIndicator, {
                      size: 'large',
                      color: COLORS.puple.main,
                    }),
                  ),
                  closeButton: false,
                  closeOnBackdropPress: false,
                });

                try {
                  // 사용자 정보 가져오기
                  const purchaseUserInfo = await getUserInfo();
                  if (!purchaseUserInfo) {
                    hideModal();
                    Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
                    isProcessingRef.current = false;
                    return;
                  }

                  // 포인트로 컨텐츠 구매 API 호출
                  const purchaseResponse = await purchaseContentWithPoint(
                    purchaseUserInfo.userId,
                    articleId,
                  );

                  console.log(
                    '[useArticleNavigation] 포인트 구매 응답:',
                    purchaseResponse,
                  );

                  // 구매 성공 후 글 상세 화면으로 이동
                  navigation.navigate(RouteNames.FULL_SCREEN_STACK, {
                    screen: RouteNames.ARTICLE_DETAIL,
                    params: {
                      articleId,
                      returnTo,
                    },
                  });
                } catch (error: any) {
                  console.error(
                    '[useArticleNavigation] 포인트 구매 에러:',
                    error,
                  );
                  hideModal();
                  Alert.alert(
                    '오류',
                    error.response?.data?.message ||
                      '포인트 구매에 실패했습니다.',
                  );
                } finally {
                  // 로딩 모달 닫기
                  hideModal();
                  // 네비게이션 후 리셋 (다음 기사 읽기 가능하도록)
                  setTimeout(() => {
                    isProcessingRef.current = false;
                  }, 1000);
                }
              },
            },
          });
        } else {
          // 포인트가 부족한 경우 - 광고 시청 모달
          // 모달 표시 시 애널리틱스 로그
          await logScreenView('Popup_Advertisement', undefined, true);

          showModal({
            title: '광고를 보고 포인트 받으시겠어요?',
            description: `부족한 포인트: ${currentPoints}p`,
            descriptionColor: COLORS.gray600,
            closeButton: true,
            children: React.createElement(ArticlePointModalContentGet),
            primaryButton: {
              title: '포인트 받고 글 읽기',
              textStyle: Heading_16B,
              onPress: () => {
                logEvent('GetAndRead_Popup_Advertisement');
                navigation.navigate(RouteNames.FULL_SCREEN_STACK, {
                  screen: RouteNames.AD_LOADING,
                  params: {
                    articleId,
                    returnTo,
                  },
                });
              },
            },
          });
        }
      } catch (error: any) {
        console.error('[useArticleNavigation] 에러:', error);
        Alert.alert('오류', '글 접근 권한을 확인하는 중 오류가 발생했습니다.');
      } finally {
        // 에러 발생 시에도 리셋
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [showModal, hideModal, navigation, returnTo, storePoints],
  );

  return { handleArticlePress };
};
