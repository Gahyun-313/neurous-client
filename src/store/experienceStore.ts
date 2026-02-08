/**
 * 포인트 상태 관리 Store
 */

import { create } from 'zustand';

interface ExperienceStore {
  experience: number;
  setExperience: (experience: number) => void;
  addExperience: (amount: number) => void;
  subtractExperience: (amount: number) => void;
}

export const useExperienceStore = create<ExperienceStore>((set, get) => ({
  experience: 0,
  setExperience: (experience: number) => {
    try {
      set({ experience });
    } catch (error) {
      console.error('경험치 저장 실패:', error);
    }
  },
  addExperience: (amount: number) => {
    try {
      set({ experience: get().experience + amount });
      console.log(
        '경험치 추가 성공:',
        get().experience + amount,
        '현재 경험치:',
        get().experience,
      );
    } catch (error) {
      console.error('경험치 추가 실패:', error);
    }
  },
  subtractExperience: (amount: number) => {
    try {
      set({ experience: get().experience - amount });
      console.log(
        '경험치 차감 성공:',
        get().experience - amount,
        '현재 경험치:',
        get().experience,
      );
    } catch (error) {
      console.error('경험치 차감 실패:', error);
    }
  },
}));
