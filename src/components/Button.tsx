import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { BORDER_RADIUS, COLORS, scaleWidth } from '../styles/global';
import { Heading_18EB_Round } from '../styles/typography';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';

export interface PositionProps {
  position?: 'absolute' | 'relative';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}
export interface ButtonProps
  extends PositionProps,
    Omit<TouchableOpacityProps, 'style' | 'children'> {
  title?: string;
  variant?: ButtonVariant;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  hitslop?: number;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  textStyle,
  children,
  hitslop,
  style,
  ...props
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={hitslop ?? 10}
      {...props}
    >
      {children ? children : <Text style={textStyles}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS[16],
    height: scaleWidth(63),
  },
  // Variants
  primary: {
    backgroundColor: COLORS.puple.main,
    color: COLORS.white,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.puple.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Disabled
  disabled: {
    backgroundColor: COLORS.gray400,
  },
  // Text styles
  text: {
    ...Heading_18EB_Round,
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.puple.main,
  },
  ghostText: {
    color: COLORS.puple.main,
  },
  disabledText: {
    color: COLORS.gray800,
  },
});

export default Button;
