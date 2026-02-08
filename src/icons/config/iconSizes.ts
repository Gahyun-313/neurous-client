import { scaleWidth } from '../../styles/global';

// 아이콘 사이즈 상수
export const ICON_SIZES = {
  S: scaleWidth(12),
  M: scaleWidth(16),
  L: scaleWidth(20),
  XL: scaleWidth(24),
  XXL: scaleWidth(32),
  X3L: scaleWidth(40),
  X4L: scaleWidth(48),
} as const;

// 아이콘 사이즈 타입
export type IconSize = keyof typeof ICON_SIZES;
