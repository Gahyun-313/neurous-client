import { create } from 'zustand';

export type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  isRead: boolean;
  raw?: any;
};

type State = {
  list: NotificationItem[];
  add: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  setAll: (items: NotificationItem[]) => void;
  clear: () => void;
};

export const useNotificationStore = create<State>(set => ({
  list: [],

  add: item =>
    set(state => ({
      list: [item, ...state.list],
    })),

  markRead: id =>
    set(state => ({
      list: state.list.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    })),

  setAll: items => set({ list: items }),

  clear: () => set({ list: [] }),
}));
