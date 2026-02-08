import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {COLORS, scaleWidth, BORDER_RADIUS} from '../styles/global';

interface ProgressBarProps {
  fill: number;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({fill, style}) => {
  return (
    <View style={[styles.container, style]}>
      {[...Array(2)].map((_, index) => {
        // fill이 1이면 첫 번째(index 0)가 fill, fill이 2이면 두 번째(index 1)가 fill
        const isFill =
          (fill === 1 && index === 0) || (fill === 2 && index === 1);
        return (
          <View
            key={index}
            style={[isFill ? styles.fill : styles.empty, styles.progressBar]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: scaleWidth(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
  },
  progressBar: {
    width: scaleWidth(172),
    height: scaleWidth(6),
    borderRadius: BORDER_RADIUS[16],
  },
  fill: {
    backgroundColor: COLORS.puple.main,
  },
  empty: {
    backgroundColor: COLORS.gray200,
  },
});

export default ProgressBar;
