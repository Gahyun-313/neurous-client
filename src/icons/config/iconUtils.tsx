import React, { FC } from 'react';
import { ColorValue, Image, ImageStyle, StyleProp } from 'react-native';
import { SvgProps } from 'react-native-svg';

export interface IconProps {
  color?: ColorValue;
  [key: string]: any;
}

//svg
export const createIconComponent = (IconSVG: React.FC<any>, size: number) => {
  // IconSVG가 유효한 React 컴포넌트인지 확인
  if (typeof IconSVG !== 'function') {
    throw new Error(
      `Invalid IconSVG: expected a React component but got ${typeof IconSVG}. Make sure SVG files are properly imported and react-native-svg-transformer is configured.`,
    );
  }

  const IconComponent = ({ color, ...props }: IconProps) => (
    <IconSVG
      width={size}
      height={size}
      {...(color !== undefined && { color })}
      {...props}
    />
  );
  IconComponent.displayName = `IconComponent(${
    IconSVG.displayName || IconSVG.name || 'Icon'
  })`;
  return IconComponent;
};
export const createRectangleIconComponent = (
  IconSVG: FC<SvgProps>,
  width_: number,
  height: number,
) => {
  const RectangleIconComponent = ({ ...props }: IconProps) => (
    <IconSVG width={width_} height={height} {...props} />
  );
  RectangleIconComponent.displayName = `RectangleIconComponent(${
    IconSVG.displayName || IconSVG.name || 'Icon'
  })`;
  return RectangleIconComponent;
};

//png,gif 등
export const createImageIconComponent = (
  imgSource: any,
  width: number,
  height?: number,
): React.FC<{ style?: StyleProp<ImageStyle> }> => {
  const ImageIcon: React.FC<{ style?: StyleProp<ImageStyle> }> = ({
    style,
  }) => (
    <Image
      source={imgSource}
      style={[{ width, height: height ?? width }, style]}
      resizeMode="contain"
    />
  );
  ImageIcon.displayName = `ImageIcon(${imgSource?.uri || 'Image'})`;
  return ImageIcon;
};
