import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRewardedAd } from 'react-native-google-mobile-ads';
import { COLORS } from '../../styles/global';
import { FullScreenStackParamList } from '../../navigation/types';
import { RouteNames } from '../../../routes';
import { usePointStore } from '../../store/pointStore';
import { AD_REWARD_POINTS } from '../../config/rewards';
import { purchaseContentWithAd } from '../../api/missionApi';
import { getUserInfo } from '../../services/authService';
import { REWARDED_AD_UNIT_ID } from '../../config/adConfig';

type NavigationProp = NativeStackNavigationProp<FullScreenStackParamList>;

const AdLoadingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { addPoints } = usePointStore();

  const articleId = (route.params as FullScreenStackParamList['ad-loading'])
    ?.articleId as number;
  const returnTo = (route.params as FullScreenStackParamList['ad-loading'])
    ?.returnTo;
  const { isLoaded, isClosed, load, show, reward, error } = useRewardedAd(
    REWARDED_AD_UNIT_ID,
    {
      requestNonPersonalizedAdsOnly: true,
    },
  );

  const [isAdShowing, setIsAdShowing] = useState(false);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);
  const hasAddedPointsRef = useRef(false);
  const hasPurchasedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownErrorRef = useRef(false);

  // 보상 감지
  useEffect(() => {
    if (reward) {
      setHasEarnedReward(true);
    }
  }, [reward]);

  // 광고 로드 에러 처리
  useEffect(() => {
    if (error && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      console.error('[AdLoadingScreen] 광고 로드 에러:', error);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      Alert.alert(
        '오류',
        '광고를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.',
        [
          {
            text: '확인',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
      );
    }
  }, [error, navigation]);

  // 화면 진입 시 광고 로드
  useEffect(() => {
    if (!isLoaded && !error) {
      load();

      // 10초 타임아웃 설정
      loadTimeoutRef.current = setTimeout(() => {
        if (!isLoaded && !hasShownErrorRef.current) {
          hasShownErrorRef.current = true;
          console.error('[AdLoadingScreen] 광고 로드 타임아웃');
          Alert.alert(
            '오류',
            '광고를 불러오는 데 시간이 오래 걸립니다. 다시 시도해주세요.',
            [
              {
                text: '확인',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ],
          );
        }
      }, 10000); // 10초
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isLoaded, load, error, navigation]);

  // 광고 로드 완료 후 자동 표시
  useEffect(() => {
    if (isLoaded && !isAdShowing && !error) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      setIsAdShowing(true);
      setHasEarnedReward(false);
      hasAddedPointsRef.current = false; // 새 광고 시청 시 리셋
      try {
        show();
      } catch (showError) {
        console.error('광고 표시 실패:', showError);
        Alert.alert('오류', '광고를 표시할 수 없습니다.');
        navigation.goBack();
      }
    }
  }, [isLoaded, isAdShowing, show, navigation, error]);

  // 광고 시청 완료 시 포인트 추가
  useEffect(() => {
    if (hasEarnedReward && !hasAddedPointsRef.current) {
      hasAddedPointsRef.current = true;
      addPoints(AD_REWARD_POINTS);
    }
  }, [hasEarnedReward, addPoints]);

  // 광고 시청 완료 후 컨텐츠 구매 API 호출
  useEffect(() => {
    const handlePurchase = async () => {
      if (
        hasEarnedReward &&
        isClosed &&
        isAdShowing &&
        !hasPurchasedRef.current
      ) {
        hasPurchasedRef.current = true;

        try {
          // 사용자 정보 가져오기
          const userInfo = await getUserInfo();
          if (!userInfo) {
            Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
            navigation.goBack();
            return;
          }

          // 광고로 컨텐츠 구매 API 호출
          const purchaseResponse = await purchaseContentWithAd(
            userInfo.userId,
            articleId,
          );

          console.log('[AdLoadingScreen] 광고 구매 응답:', purchaseResponse);

          // 구매 성공 후 글 상세 화면으로 이동
          navigation.replace(RouteNames.ARTICLE_DETAIL, {
            articleId,
            returnTo,
            fromAd: true,
          });
        } catch (purchaseError: any) {
          console.error('[AdLoadingScreen] 광고 구매 에러:', purchaseError);
          Alert.alert(
            '오류',
            purchaseError.response?.data?.message ||
              '컨텐츠 구매에 실패했습니다.',
          );
          navigation.goBack();
        }
      }
    };

    handlePurchase();
  }, [hasEarnedReward, isClosed, isAdShowing, articleId, navigation, returnTo]);

  // 광고 닫힘 처리 (보상 미지급 시)
  useEffect(() => {
    if (
      isClosed &&
      isAdShowing &&
      !hasEarnedReward &&
      !hasPurchasedRef.current
    ) {
      // 보상 미지급 - 알림 후 뒤로가기
      Alert.alert('알림', '광고를 끝까지 시청해야 포인트를 받을 수 있습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    }
  }, [isClosed, isAdShowing, hasEarnedReward, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.puple.main} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdLoadingScreen;
