import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

const IconButton: React.FC<TouchableOpacityProps> = ({
  children,
  style,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} style={style}>
      {children}
    </TouchableOpacity>
  );
};

export default IconButton;
