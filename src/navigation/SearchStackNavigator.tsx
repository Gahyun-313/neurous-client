// src/navigation/stacks/SearchStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RouteNames } from '../../routes';
import type { SearchStackParamList } from './types';

import SearchScreen from '../screens/search/SearchScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

/**
 * Search 탭 내부 스택
 * - "탐색 홈"만 둠 (탭바 유지)
 * - 검색/검색결과는 FullScreenStack로 보냄 (탭바 없음)
 */
const SearchStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={RouteNames.SEARCH} component={SearchScreen} />
    </Stack.Navigator>
  );
};

export default SearchStackNavigator;
