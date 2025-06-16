import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLink?: string; // Optional link to navigate to
  actionText?: string; // Optional text for action button
}

interface NotificationState {
  notifications: Notification[];
  unseenCount: number;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotifications: () => Notification[];
}

const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unseenCount: 0,

      // Add a new notification
      addNotification: (notificationData) => {
        const notification: Notification = {
          id: `notification-${Date.now()}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          ...notificationData,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          unseenCount: state.unseenCount + 1,
        }));
      },

      // Mark a notification as read
      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          );

          const unreadCount = updatedNotifications.filter(
            (n) => !n.isRead
          ).length;

          return {
            notifications: updatedNotifications,
            unseenCount: unreadCount,
          };
        });
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
          unseenCount: 0,
        }));
      },

      // Clear a specific notification
      clearNotification: (id) => {
        set((state) => {
          const wasUnread =
            state.notifications.find((n) => n.id === id)?.isRead === false;

          return {
            notifications: state.notifications.filter(
              (notification) => notification.id !== id
            ),
            unseenCount: wasUnread ? state.unseenCount - 1 : state.unseenCount,
          };
        });
      },

      // Clear all notifications
      clearAllNotifications: () => {
        set({
          notifications: [],
          unseenCount: 0,
        });
      },

      // Get all unread notifications
      getUnreadNotifications: () => {
        return get().notifications.filter(
          (notification) => !notification.isRead
        );
      },
    }),
    {
      name: "trackbudgetpro-notifications",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationStore;
