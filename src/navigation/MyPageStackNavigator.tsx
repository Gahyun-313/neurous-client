import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RouteNames } from '../../routes';

import MyPageScreen from '../screens/main/MyPageScreen';

const Stack = createNativeStackNavigator();

const MyPageStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={RouteNames.MY_PAGE}
      screenOptions={{ headerShown: false }}
    >
      {/* 마이페이지 메인 */}
      <Stack.Screen name={RouteNames.MY_PAGE} component={MyPageScreen} />
    </Stack.Navigator>
  );
};

export default MyPageStackNavigator;
