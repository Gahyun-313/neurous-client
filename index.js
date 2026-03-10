/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// 앱 백그라운드/종료 상태에서 FCM 수신 시 OS가 호출하는 핸들러
// notificationStore 접근 불가 → 시스템이 알림바에 자동 표시
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (__DEV__) console.log('[FCM 백그라운드 핸들러]', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
