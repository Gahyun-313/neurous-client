import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  TextStyle,
  StyleProp,
} from 'react-native';
import { BORDER_RADIUS, COLORS, scaleWidth } from '../styles/global';

export type InputVariant = 'default' | 'outline';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'default',
  containerStyle,
  leftIcon,
  onLeftIconPress,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles: StyleProp<ViewStyle> = [
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error ? styles.error : undefined,
    containerStyle,
  ];

  const inputStyles: StyleProp<TextStyle> = [styles.input, style];

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={inputContainerStyles}>
        {leftIcon && (
          <TouchableOpacity
            onPress={onLeftIconPress}
            style={styles.leftIconContainer}
            disabled={!onLeftIconPress}
          >
            {leftIcon}
          </TouchableOpacity>
        )}
        <TextInput
          style={inputStyles}
          placeholderTextColor={COLORS.gray600}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: scaleWidth(16),
  },
  label: {
    fontSize: scaleWidth(14),
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: scaleWidth(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Variants
  default: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS[16],
    height: scaleWidth(44),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleWidth(12),
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.puple.main,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS[16],
    height: scaleWidth(44),
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleWidth(12),
  },
  // States
  focused: {
    borderWidth: 1,
    borderColor: COLORS.puple.main,
  },
  error: {
    borderColor: COLORS.red.main,
  },
  // Input
  input: {
    flex: 1,
    color: COLORS.black,
    padding: 0,
  },
  // left icon
  leftIconContainer: {
    marginRight: scaleWidth(8),
    padding: scaleWidth(4),
  },
});

export default Input;
