import { CommonActions } from '@react-navigation/native';
import { RouteNames } from '../../routes';

type ReturnTo = 'mission' | 'search';

/**
 * 퀴즈 완료 후 원래 화면으로 이동하는 네비게이션 리셋 액션 생성
 */
export const createQuizCompleteNavigation = (
  returnTo: ReturnTo,
): ReturnType<typeof CommonActions.reset> => {
  const targetTab =
    returnTo === 'search' ? RouteNames.SEARCH_TAB : RouteNames.MISSION_TAB;
  const targetScreen =
    returnTo === 'search' ? RouteNames.SEARCH : RouteNames.MISSION;

  return CommonActions.reset({
    index: 0,
    routes: [
      {
        name: RouteNames.MAIN_TAB,
        state: {
          routes: [
            {
              name: targetTab,
              state: {
                routes: [
                  {
                    name: targetScreen,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
};
