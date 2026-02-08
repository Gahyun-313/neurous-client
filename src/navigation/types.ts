import {
  NavigatorScreenParams,
  CompositeNavigationProp,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteNames } from '../../routes';
import { NewsCategory } from '../data/mock/searchData';
import { SocialLoginProvider } from '../services/socialLoginService';

// Onboarding Stack Param List
export type OnboardingStackParamList = {
  [RouteNames.DIFFICULTY_SETTING]: undefined;
  [RouteNames.INTERESTS]: { editMode?: boolean };
  [RouteNames.INTRO_CARDLIST]: undefined;
  [RouteNames.INTRO_FUNCTION]: undefined;
  [RouteNames.INTRO_SEARCH]: undefined;
  // 변경: 약관 화면에서 돌아올 때 agreedProvider를 params로 받을 수 있게 함(옵션)
  [RouteNames.SOCIAL_LOGIN]:
    | { agreedProvider?: SocialLoginProvider }
    | undefined;
  // 추가: 약관 동의 화면 진입 시 어떤 소셜인지 전달
  [RouteNames.TERMS_AGREEMENT]: { provider: SocialLoginProvider };
  [RouteNames.TERMS_OF_SERVICE]: undefined;
  [RouteNames.PRIVACY_POLICY]: undefined;
};

// Mission Stack Param List
export type MissionStackParamList = {
  [RouteNames.MISSION]: undefined;
};

// Character Stack Param List
export type CharacterStackParamList = {
  [RouteNames.CHARACTER]: undefined;
  [RouteNames.CHARACTER_CRITERIA]: undefined; // 기준 확인하기 (탭 2개 있는 화면)
  [RouteNames.CHARACTER_POINT_HISTORY]: undefined;
};

// Search Stack Param List
export type SearchStackParamList = {
  [RouteNames.SEARCH]:
    | {
        keyword?: string;
        initialCategory?: NewsCategory;
      }
    | undefined;
  [RouteNames.SEARCH_INPUT]: undefined; // 검색어 입력 화면
};

// MyPage Stack Param List
export type MyPageStackParamList = {
  [RouteNames.MY_PAGE]: undefined;
  [RouteNames.SETTINGS]: undefined;
  [RouteNames.LOGIN_INFO]: undefined;
  [RouteNames.INQUIRY]: undefined;
  [RouteNames.TERMS_OF_SERVICE]: undefined;
  [RouteNames.PRIVACY_POLICY]: undefined;
};

// Main Tab Param List (Bottom Tab Navigator)
export type MainTabParamList = {
  [RouteNames.MISSION_TAB]: NavigatorScreenParams<MissionStackParamList>;
  [RouteNames.CHARACTER_TAB]: NavigatorScreenParams<CharacterStackParamList>;
  [RouteNames.SEARCH_TAB]: NavigatorScreenParams<SearchStackParamList>;
  [RouteNames.MY_PAGE_TAB]: NavigatorScreenParams<MyPageStackParamList>;
};

// FullScreen Stack Param List (탭바 없는 전체 화면들)
export type FullScreenStackParamList = {
  [RouteNames.CHARACTER_CRITERIA]: undefined;
  [RouteNames.CHARACTER_NOTIFICATION]: undefined;
  [RouteNames.CHARACTER_POINT_HISTORY]: undefined;

  [RouteNames.ARTICLE_DETAIL]: {
    articleId: number;
    returnTo?: 'mission' | 'search';
    fromAd?: boolean;
  };
  [RouteNames.READ_ARTICLE_DETAIL]: {
    articleId: number;
  };
  [RouteNames.QUIZ]: { articleId: number; returnTo?: 'mission' | 'search' };
  [RouteNames.AD_LOADING]: {
    articleId: number;
    returnTo?: 'mission' | 'search';
  };

  // 탭바 없는 검색 화면들
  [RouteNames.SEARCH_INPUT]: undefined;
  [RouteNames.SEARCH_RESULT]: { keyword: string };

  // 탭바 없는 마이페이지 서브(FullScreenStack에서 쓰고 있으므로 포함)
  [RouteNames.SETTINGS]: undefined;
  [RouteNames.LOGIN_INFO]: undefined;
  [RouteNames.INQUIRY]: undefined;
  [RouteNames.TERMS_OF_SERVICE]: undefined;
  [RouteNames.PRIVACY_POLICY]: undefined;
};

// Root Stack Param List (최상위 네비게이터)
export type RootStackParamList = {
  [RouteNames.ONBOARDING]: NavigatorScreenParams<OnboardingStackParamList>;
  [RouteNames.MAIN_TAB]: NavigatorScreenParams<MainTabParamList>;
  [RouteNames.FULL_SCREEN_STACK]: NavigatorScreenParams<FullScreenStackParamList>;
};

export type MainTabNavigationProp<StackParamList extends Record<string, any>> =
  CompositeNavigationProp<
    NativeStackNavigationProp<StackParamList>,
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >;

export type FullScreenStackRouteProp<
  RouteName extends keyof FullScreenStackParamList,
> = RouteProp<FullScreenStackParamList, RouteName>;
