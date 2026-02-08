import React from 'react';
import { View } from 'react-native';
import { COLORS, scaleWidth } from '../styles/global';

const ActivityIndicator = ({
  activeIndex,
  dotCount = 3,
}: {
  activeIndex: number;
  dotCount?: number;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: scaleWidth(6),
      }}
    >
      {[...Array(dotCount)].map((_, index) => (
        <View
          key={index}
          style={[
            { height: scaleWidth(6), borderRadius: 99 },
            {
              backgroundColor:
                index === activeIndex ? COLORS.puple.main : COLORS.gray300,
            },
            { width: index === activeIndex ? scaleWidth(24) : scaleWidth(6) },
          ]}
        />
      ))}
    </View>
  );
};

export default ActivityIndicator;
