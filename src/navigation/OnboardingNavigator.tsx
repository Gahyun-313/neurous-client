import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RouteNames } from '../../routes';
import LoginScreen from '../screens/auth/LoginScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import DifficultySettingScreen from '../screens/onboarding/DifficultySettingScreen';
import IntroCardList from '../screens/onboarding/IntroCardList';
import IntroFuction from '../screens/onboarding/IntroFuction';
import IntroSearch from '../screens/onboarding/IntroSearch';
import { useOnboardingStore } from '../store/onboardingStore';
import TermsOfServiceScreen from '../screens/myPage/TermOfServiceScreen';
import PrivacyPolicyScreen from '../screens/myPage/PrivacyPolicyScreen';
import TermsAgreementScreen from '../screens/onboarding/TermsAgreementScreen';

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  const currentStep = useOnboardingStore(state => state.currentStep);
  const navigation = useNavigation();
  const prevStepRef = useRef<typeof currentStep>(currentStep);

  // 현재 단계에 따라 초기 화면 결정
  // difficulty 단계에서도 관심분야 화면으로 돌아가서 선택한 관심분야를 확인할 수 있도록 함
  const getInitialRouteName = () => {
    switch (currentStep) {
      case 'interests':
      case 'difficulty':
        return RouteNames.INTERESTS;
      case 'completed':
        return RouteNames.INTERESTS; // 완료된 경우는 RootNavigator에서 처리
      case 'login':
      default:
        return RouteNames.SOCIAL_LOGIN;
    }
  };

  // currentStep 변경 시 네비게이션 업데이트
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      const targetRoute = getInitialRouteName();
      // 현재 화면이 targetRoute와 다르면 네비게이션
      const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index || 0]?.name;
      if (currentRoute !== targetRoute) {
        navigation.reset({
          index: 0,
          routes: [{ name: targetRoute }],
        });
      }
      prevStepRef.current = currentStep;
    }
  }, [currentStep, navigation]);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRouteName()}
    >
      <Stack.Screen
        name={RouteNames.INTRO_CARDLIST}
        component={IntroCardList}
      />
      <Stack.Screen name={RouteNames.INTRO_FUNCTION} component={IntroFuction} />
      <Stack.Screen name={RouteNames.INTRO_SEARCH} component={IntroSearch} />
      <Stack.Screen name={RouteNames.SOCIAL_LOGIN} component={LoginScreen} />
      <Stack.Screen name={RouteNames.INTERESTS} component={InterestsScreen} />
      <Stack.Screen
        name={RouteNames.DIFFICULTY_SETTING}
        component={DifficultySettingScreen}
      />
      <Stack.Screen
        name={RouteNames.TERMS_AGREEMENT}
        component={TermsAgreementScreen}
      />
      <Stack.Screen
        name={RouteNames.TERMS_OF_SERVICE}
        component={TermsOfServiceScreen}
      />
      <Stack.Screen
        name={RouteNames.PRIVACY_POLICY}
        component={PrivacyPolicyScreen}
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
