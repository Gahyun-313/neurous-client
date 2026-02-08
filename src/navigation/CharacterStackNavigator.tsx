import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RouteNames } from '../../routes';

import CharacterScreen from '../screens/main/CharacterScreen';

import { CharacterStackParamList } from './types';

const Stack = createNativeStackNavigator<CharacterStackParamList>();

const CharacterStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={RouteNames.CHARACTER} component={CharacterScreen} />
    </Stack.Navigator>
  );
};

export default CharacterStackNavigator;
