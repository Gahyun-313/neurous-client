import React from 'react';
import { View } from 'react-native';
import { scaleWidth } from '../styles/global';

const Spacer = ({
  num,
  horizontal = false,
}: {
  num: number;
  horizontal?: boolean;
}) => {
  if (horizontal) {
    return <View style={{ width: scaleWidth(num) }} />;
  }
  return <View style={{ height: scaleWidth(num) }} />;
};

export default Spacer;
