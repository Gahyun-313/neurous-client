/**
 * 마이페이지 데이터 로드 커스텀 훅
 *
 * 화면 포커스 시마다 마이페이지 API를 호출해 유저 정보와
 * 읽은 글 목록을 최신 상태로 유지함.
 * 동시에 최근 로그인 정보도 AsyncStorage에서 조회함.
 *
 * [useFocusEffect 사용 이유]
 * 다른 화면에서 관심분야/레벨을 수정하고 돌아왔을 때
 * 마이페이지 데이터가 자동으로 갱신되도록 하기 위함.
 * useEffect를 쓰면 컴포넌트 마운트 시에만 실행되므로 부적합.
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyPage, MyPageData } from '../api/userApi';
import {
  getRecentLogin,
  RecentLoginInfo,
} from '../services/authStorageService';
import { useOnboardingStore } from '../store/onboardingStore';
import { nameToCategoryMap } from '../utils/myPageUtils';

/**
 * 마이페이지 데이터 로드 훅
 *
 * [동작 방식]
 * 1. 화면 포커스 시 fetchMyPage 호출
 * 2. 응답의 interests를 { 카테고리: 우선순위 } 형태로 변환해 onboardingStore에 저장
 *    (관심분야 설정 화면에서 현재 선택 상태를 동기화하기 위함)
 * 3. AsyncStorage에서 최근 로그인 정보 조회
 * 4. API 실패 시에도 로컬 로그인 정보는 표시 (부분 fallback 처리)
 *
 * @param startDate  읽은 글 목록 조회 기준 시작 날짜 (YYYY-MM-DD)
 * @returns          recentLogin   — 최근 로그인 정보 (없으면 null)
 *                   myPageData    — 마이페이지 전체 데이터 (없으면 null)
 *                   setMyPageData — 외부에서 직접 데이터 갱신이 필요할 때 사용
 */
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

            // 서버 interests 배열 → { 카테고리Enum: 우선순위 } 객체로 변환
            // 우선순위는 배열 인덱스 + 1 (첫 번째 선택 = 1순위)
            if (response.data.interests && response.data.interests.length > 0) {
              const interestsData: Record<string, number> = {};
              response.data.interests.forEach((interest, index) => {
                // nameToCategoryMap으로 한글 이름 → enum 변환
                // 이미 enum 형태면 그대로 사용
                const categoryEnum = nameToCategoryMap[interest] || interest;
                const priority = index + 1;
                interestsData[categoryEnum] = priority;
              });
              await setInterests(interestsData);
            }
          }

          // 최근 로그인 정보 조회 (소셜 로그인 제공자 표시 등에 사용)
          const loginInfo = await getRecentLogin();
          setRecentLogin(loginInfo);
        } catch (error) {
          console.error('[마이페이지] 데이터 로드 실패:', error);
          // API 실패 시에도 로컬 로그인 정보는 표시 (부분 fallback)
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
    setMyPageData, // 외부(화면)에서 낙관적 업데이트 등이 필요할 때 사용
  };
};
