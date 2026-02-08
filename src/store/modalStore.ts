import { create } from 'zustand';
import {
  ModalButton,
  NotificationModalProps,
} from '../components/NotificationModal';
import { StyleProp, TextStyle } from 'react-native';
import { ReactNode } from 'react';
import { ToastPosition } from '../components/ToastModal';

export type ModalType = 'notification' | 'bottomSheet' | 'toast';

interface NotificationModalState {
  type: 'notification';
  visible: boolean;
  title: string;
  description?: string;
  image?: NotificationModalProps['image'];
  imageSize?: { width: number; height: number };
  imageTopOffset?: number;
  imagePaddingTop?: number;
  closeButton?: boolean;
  primaryButton?: ModalButton;
  secondaryButton?: ModalButton;
  children?: ReactNode;
  titleDescriptionGapSize?: number;
  descriptionColor?: string;
  titleStyle?: StyleProp<TextStyle>;
  closeOnBackdropPress?: boolean;
  paddingHorizontal?: number;
}

interface BottomSheetModalState {
  type: 'bottomSheet';
  visible: boolean;
  children: ReactNode;
  closeOnBackdropPress?: boolean;
  paddingHorizontal?: number;
}

interface ToastModalState {
  type: 'toast';
  visible: boolean;
  message: string;
  duration?: number;
  position?: ToastPosition;
  backgroundColor?: string;
  opacity?: number;
  height?: number;
  width?: number;
  borderRadius?: number;
  onClose?: () => void;
}

type ModalState =
  | NotificationModalState
  | BottomSheetModalState
  | ToastModalState;

interface ModalStore {
  modalState: ModalState;
  showModal: (config: Omit<NotificationModalState, 'visible' | 'type'>) => void;
  showBottomSheetModal: (
    config: Omit<BottomSheetModalState, 'visible' | 'type'>,
  ) => void;
  showToastModal: (config: Omit<ToastModalState, 'visible' | 'type'>) => void;
  hideModal: () => void;
}

const defaultModalState: ModalState = {
  type: 'notification',
  visible: false,
  title: '',
  titleStyle: undefined,
  paddingHorizontal: undefined,
};

export const useModalStore = create<ModalStore>(set => ({
  modalState: defaultModalState,
  showModal: config =>
    set({
      modalState: {
        ...config,
        type: 'notification',
        visible: true,
      } as NotificationModalState,
    }),
  showBottomSheetModal: config =>
    set({
      modalState: {
        ...config,
        type: 'bottomSheet',
        visible: true,
      } as BottomSheetModalState,
    }),
  showToastModal: config =>
    set({
      modalState: {
        ...config,
        type: 'toast',
        visible: true,
      } as ToastModalState,
    }),
  hideModal: () =>
    set(state => ({
      modalState: {
        ...state.modalState,
        visible: false,
      },
    })),
}));

// 편의 훅: showModal만 필요한 경우
export const useShowModal = () => useModalStore(state => state.showModal);

// 편의 훅: showBottomSheetModal만 필요한 경우
export const useShowBottomSheetModal = () =>
  useModalStore(state => state.showBottomSheetModal);

// 편의 훅: showToastModal만 필요한 경우
export const useShowToastModal = () =>
  useModalStore(state => state.showToastModal);

// 편의 훅: hideModal만 필요한 경우
export const useHideModal = () => useModalStore(state => state.hideModal);

// 편의 훅: 모달 상태만 필요한 경우 (리렌더링 최적화)
export const useModalState = () => useModalStore(state => state.modalState);
