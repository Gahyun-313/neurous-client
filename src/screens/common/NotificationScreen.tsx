import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '../../components/Header';
import { COLORS, scaleWidth } from '../../styles/global';

import { useNotificationStore } from '../../store/notificationStore';

/**
 * NotificationScreen
 *
 * - 알림 목록 화면
 * - 알림 클릭 시 해당 항목을 읽음 처리(isRead = true)
 * - 읽지 않은 알림은 배경색으로 강조 표시
 */
const NotificationScreen = () => {
  /** 뒤로가기용 내비게이션 */
  const navigation = useNavigation<any>();

  const list = useNotificationStore(s => s.list);
  const markRead = useNotificationStore(s => s.markRead);

  /**
   * 뒤로가기 처리
   * - 일반적으로는 goBack()
   * - 스택이 없을 수 있는 상황을 대비해 popToTop()을 fallback으로 사용
   */
  const onPressBack = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
  };

  /**
   * 알림 클릭 시 읽음 처리
   * - 클릭된 알림의 id와 일치하는 항목만 isRead를 true로 변경
   */
  const onPressItem = (id: string) => {
    markRead(id);
  };

  /**
   * FlatList 아이템 렌더링
   * - 읽지 않은 알림(!isRead)만 배경색으로 하이라이트
   */
  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !item.isRead;

    return (
      <Pressable
        onPress={() => onPressItem(item.id)}
        style={[styles.row, isUnread && styles.rowUnread]}
      >
        <Text style={[styles.title, isUnread && styles.titleUnread]}>
          {item.title}
        </Text>

        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.date}>{item.createdAt}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        title="알림"
        goBackAction={onPressBack}
        backEventName="Back_Alarm"
      />

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              7일 전 알림까지 확인할 수 있어요
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingBottom: scaleWidth(48),
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: COLORS.white,
  },
  rowUnread: {
    backgroundColor: COLORS.puple[3],
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  titleUnread: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.gray600,
  },
  date: {
    marginTop: 13,
    fontSize: 12,
    color: COLORS.gray500,
  },
  footer: {
    paddingVertical: 22,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray500,
  },
});
