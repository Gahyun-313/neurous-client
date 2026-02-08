import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { COLORS, scaleWidth } from '../styles/global';

// ... CAROUSEL_DATA는 동일합니다 ...
export const CAROUSEL_DATA = [
  {
    id: '1',
    title: '뇌세포1',
    description: '뇌세포',
    color: COLORS.grayMedium,
    imgUrl: <></>,
  },
  {
    id: '2',
    title: '뇌세포2',
    description: '뇌세포',
    color: COLORS.grayDark,
    imgUrl: <></>,
  },
  {
    id: '3',
    title: '퀴즈 모드',
    description: '뇌세포',
    color: COLORS.grayDarker,
    imgUrl: <></>,
  },
];

const FeatureCarousel = ({ data }: { data: any }) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  // 📐 치수 계산 (여기가 핵심입니다!)
  const CARD_SPACING = scaleWidth(10); // 카드 사이 간격
  const CARD_WIDTH = scaleWidth(width) - scaleWidth(60);
  const SNAP_INTERVAL = scaleWidth(CARD_WIDTH + CARD_SPACING);

  // 현재 페이지 감지 로직
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: (typeof CAROUSEL_DATA)[0] }) => (
    // 카드 wrapper 너비를 계산된 CARD_WIDTH로 고정
    <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
      {/* 이미지 박스 */}
      {item.imgUrl !== undefined && (
        <View style={[styles.imageBox, { backgroundColor: item.color }]}>
          <Text style={styles.icon}>🖼️</Text>
          <Text style={styles.placeholderText}>이미지 영역</Text>
        </View>
      )}
      {/* 텍스트 박스 */}
      {item.title !== '' && item.description !== '' && (
        <View style={styles.textBox}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.descText}>{item.description}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
        contentContainerStyle={{
          paddingHorizontal: scaleWidth(
            (width - CARD_WIDTH) / 2 - CARD_SPACING / 2,
          ),
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* 페이지네이션 (점) */}
      <View style={styles.pagination}>
        {CAROUSEL_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? COLORS.purpleDark : COLORS.grayMedium,
              },
              { width: index === activeIndex ? scaleWidth(24) : scaleWidth(8) },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ... styles는 이전과 동일합니다 ...
const styles = StyleSheet.create({
  container: { paddingVertical: 20 },
  cardWrapper: { justifyContent: 'center', alignItems: 'center' },
  imageBox: {
    width: '100%',
    height: scaleWidth(250),
    borderRadius: scaleWidth(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textBox: {
    width: '100%',
    paddingVertical: scaleWidth(20),
    paddingHorizontal: scaleWidth(10),
    backgroundColor: COLORS.grayLight,
    borderRadius: scaleWidth(12),
    alignItems: 'center',
  },
  icon: { fontSize: 40, marginBottom: 10 },
  placeholderText: { color: COLORS.white, fontWeight: 'bold' },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
});

export default FeatureCarousel;
