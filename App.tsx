import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/config/queryClient';
import { useOnboardingStore } from './src/store/onboardingStore';
import { Platform, StatusBar } from 'react-native';

const App = () => {
  const loadOnboardingStatus = useOnboardingStore(
    state => state.loadOnboardingStatus,
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // 전역 StatusBar 기본값
  useEffect(() => {
    StatusBar.setHidden(false);
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(false);
      StatusBar.setBackgroundColor('#FFFFFF');
    }
  }, []);

  useEffect(() => {
    try {
      // 이미 초기화된 앱이 있는지 확인
      const apps = getApps();
      if (apps.length === 0) {
        // 초기화되지 않았다면 GoogleService-Info.plist의 값으로 초기화
        const firebaseConfig = {
          apiKey: 'AIzaSyCvW-xajcxIsfsKoc96vnvOL1ihSn-3A0E',
          projectId: 'neurous-d632a',
          storageBucket: 'neurous-d632a.firebasestorage.app',
          messagingSenderId: '424320333528',
          appId: '1:424320333528:ios:afc28032174c603c48c9ad',
          databaseURL: 'https://neurous-d632a-default-rtdb.firebaseio.com',
        };
        initializeApp(firebaseConfig);
      } else {
        // 이미 초기화되어 있다면 확인만
        getApp();
      }
    } catch (error) {
      console.error('Firebase 초기화 오류:', error);
    }
  }, []);

  useEffect(() => {
    const initializeAppData = async () => {
      try {
        await Promise.all([loadOnboardingStatus()]);
        setIsInitialized(true);
      } catch (error) {
        console.error('앱 초기화 중 오류:', error);
        // 에러가 나도 앱은 실행되도록 (최소한 로그인 화면은 보여줌)
        setIsInitialized(true);
      }
    };

    initializeAppData();
  }, [loadOnboardingStatus]);

  // 초기화가 완료될 때까지 렌더링 지연
  if (!isInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

export default App;
