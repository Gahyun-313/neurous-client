/**
 * 포인트 상태 관리 Store
 */

import { create } from 'zustand';

interface PointStore {
  points: number;
  setPoints: (points: number) => void;
  addPoints: (amount: number) => void;
  subtractPoints: (amount: number) => void;
}

export const usePointStore = create<PointStore>((set, get) => ({
  points: 0,
  setPoints: (points: number) => {
    try {
      set({ points });
    } catch (error) {
      console.error('포인트 저장 실패:', error);
    }
  },
  addPoints: (amount: number) => {
    try {
      set({ points: get().points + amount });
      console.log(
        '포인트 추가 성공:',
        get().points + amount,
        '현재 포인트:',
        get().points,
      );
    } catch (error) {
      console.error('포인트 추가 실패:', error);
    }
  },
  subtractPoints: (amount: number) => {
    try {
      set({ points: get().points - amount });
      console.log(
        '포인트 차감 성공:',
        get().points - amount,
        '현재 포인트:',
        get().points,
      );
    } catch (error) {
      console.error('포인트 차감 실패:', error);
    }
  },
}));
