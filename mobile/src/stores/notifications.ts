import { create } from "zustand";

type NotificationState = {
  unreadCount: number;
  incrementUnreadCount: () => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  markAllRead: () => set({ unreadCount: 0 }),
  setUnreadCount: (unreadCount) => set({ unreadCount: Math.max(0, unreadCount) }),
}));
