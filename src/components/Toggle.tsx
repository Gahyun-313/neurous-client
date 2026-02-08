import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { COLORS, scaleWidth } from '../styles/global';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

const TRACK_WIDTH = scaleWidth(56);
const TRACK_HEIGHT = scaleWidth(34);
const THUMB_SIZE = scaleWidth(26);

const Toggle = ({ value, onChange, disabled = false }: Props) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const padding = (TRACK_HEIGHT - THUMB_SIZE) / 2;

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, TRACK_WIDTH - THUMB_SIZE - padding],
  });

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      hitSlop={10}
      style={[
        styles.track,
        {
          backgroundColor: value ? COLORS.puple.main : COLORS.gray300,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
};

export default Toggle;

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },

  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.white,

    shadowOpacity: 0,
    elevation: 0,
  },
});
