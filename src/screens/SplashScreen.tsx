import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../styles/global';
import { logScreenView } from '../services/analyticsService';
import { RouteNames } from '../../routes';

const SplashScreen = () => {
  useEffect(() => {
    // 스플래시 화면 조회 로그
    logScreenView(RouteNames.SPLASH, undefined, true);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Image
          source={require('../assets/png/SplashScreen.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
