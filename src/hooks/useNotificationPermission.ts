import { useState, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import { logEvent, logScreenView } from '../services/analyticsService';

interface UseNotificationPermissionOptions {
  onSettingsOpened?: (isExistingUser?: boolean) => void;
  onCancel?: () => void;
}

export const useNotificationPermission = (
  options?: UseNotificationPermissionOptions,
) => {
  const [isChecking, setIsChecking] = useState(false);
  const { onSettingsOpened, onCancel } = options || {};

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await checkNotifications();
      return status !== RESULTS.GRANTED;
    } catch (error) {
      console.error('알림 권한 확인 중 오류:', error);
      return true;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { status } = await requestNotifications([
        'alert',
        'badge',
        'sound',
      ]);

      if (status === RESULTS.GRANTED) {
        const { settings } = await checkNotifications();
        const isNotificationEnabled =
          Platform.OS === 'ios'
            ? settings?.alert === true || settings?.notificationCenter === true
            : true;

        if (Platform.OS === 'ios' && !isNotificationEnabled) {
          logScreenView('Popup_Local_Notification_Local', undefined, true);
          return new Promise<boolean>(resolve => {
            Alert.alert(
              '‘뉴로스’에서 알림을 보내고자 합니다.',
              '경고, 사운드 및 아이콘 배지가 알림에 포함될 수 있습니다. 설정에서 이를 구성할 수 있습니다',
              [
                {
                  text: '허용 안 함',
                  style: 'cancel',
                  onPress: () => {
                    onCancel?.();
                    resolve(false);
                    logEvent('Dismiss_Popup_Local_Notification_Local');
                  },
                },
                {
                  text: '허용',
                  onPress: async () => {
                    try {
                      onSettingsOpened?.();
                      logEvent(
                        'EnableNotifications_Popup_Local_Notification_Local',
                      );
                      await Linking.openSettings();
                      // 설정 화면으로 이동했으므로 false 반환 (AppState에서 처리)
                      resolve(false);
                    } catch (error) {
                      console.error('설정 열기 실패:', error);
                      // 최종 fallback
                      try {
                        await Linking.openSettings();
                        resolve(false);
                      } catch (err) {
                        console.error('설정 열기 실패 (fallback):', err);
                        resolve(false);
                      }
                    }
                  },
                },
              ],
            );
          });
        }

        return true;
      } else if (status === RESULTS.BLOCKED) {
        return new Promise<boolean>(resolve => {
          Alert.alert(
            "'뉴로스'에서 알림을 보내고자 합니다.",
            '경고, 사운드 및 아이콘 배지가 알림에 포함될 수 있습니다. 설정에서 이를 구성할 수 있습니다',
            [
              {
                text: '취소',
                style: 'cancel',
                onPress: () => {
                  onCancel?.();
                  resolve(false);
                },
              },
              {
                text: '설정으로 이동',
                onPress: async () => {
                  try {
                    onSettingsOpened?.();
                    await Linking.openSettings();
                    // 설정 화면으로 이동했으므로 false 반환 (AppState에서 처리)
                    resolve(false);
                  } catch (error) {
                    console.error('설정 열기 실패:', error);
                    // 최종 fallback
                    try {
                      await Linking.openSettings();
                      resolve(false);
                    } catch (err) {
                      console.error('설정 열기 실패 (fallback):', err);
                      resolve(false);
                    }
                  }
                },
              },
            ],
          );
        });
      }

      return false;
    } catch (error) {
      console.warn('알림 권한 요청 중 오류:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [onSettingsOpened, onCancel]);

  return {
    checkPermission,
    requestPermission,
    isChecking,
  };
};
