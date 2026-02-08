import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RouteNames } from '../../routes';
import MissionScreen from '../screens/main/MissionScreen';

const Stack = createNativeStackNavigator();

const MissionStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={RouteNames.MISSION} component={MissionScreen} />
    </Stack.Navigator>
  );
};

export default MissionStackNavigator;
