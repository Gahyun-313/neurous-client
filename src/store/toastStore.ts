import { create } from 'zustand';

interface ToastStore {
  toastMessage: string | null; // 토스트 메시지 (없으면 null)
  showToast: (message: string) => void; // 토스트 요청
  clearToast: () => void; // 토스트 메시지 제거(중복 방지)
}

export const useToastStore = create<ToastStore>(set => ({
  toastMessage: null,
  showToast: message => set({ toastMessage: message }),
  clearToast: () => set({ toastMessage: null }),
}));

// 편의 훅: showToast만 필요한 경우
export const useShowToast = () => useToastStore(state => state.showToast);

// 편의 훅: toastMessage만 필요한 경우
export const useToastMessage = () => useToastStore(state => state.toastMessage);

// 편의 훅: clearToast만 필요한 경우
export const useClearToast = () => useToastStore(state => state.clearToast);
