import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyPage, MyPageData } from '../api/userApi';
import {
  getRecentLogin,
  RecentLoginInfo,
} from '../services/authStorageService';
import { useOnboardingStore } from '../store/onboardingStore';
import { nameToCategoryMap } from '../utils/myPageUtils';

export const useMyPage = (startDate: string) => {
  const [recentLogin, setRecentLogin] = useState<RecentLoginInfo | null>(null);
  const [myPageData, setMyPageData] = useState<MyPageData | null>(null);
  const setInterests = useOnboardingStore(state => state.setInterests);

  useFocusEffect(
    useCallback(() => {
      const loadUserInfo = async () => {
        try {
          // 마이페이지 API 호출
          const response = await fetchMyPage(startDate);
          if (response.data) {
            setMyPageData(response.data);
            if (response.data.interests && response.data.interests.length > 0) {
              const interestsData: Record<string, number> = {};
              response.data.interests.forEach((interest, index) => {
                const categoryEnum = nameToCategoryMap[interest] || interest; // 이미 enum이면 그대로 사용
                const priority = index + 1;
                interestsData[categoryEnum] = priority;
              });
              await setInterests(interestsData);
            }
          }

          const loginInfo = await getRecentLogin();
          setRecentLogin(loginInfo);
        } catch (error) {
          console.error('[마이페이지] 데이터 로드 실패:', error);
          // API 실패 시 로컬 저장된 정보 사용
          const loginInfo = await getRecentLogin();
          setRecentLogin(loginInfo);
        }
      };
      loadUserInfo();
    }, [setInterests, startDate]),
  );

  return {
    recentLogin,
    myPageData,
    setMyPageData,
  };
};
