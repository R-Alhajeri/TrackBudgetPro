import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure how notifications should be handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data?: any;
  trigger?:
    | {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL;
        seconds: number;
        repeats?: boolean;
      }
    | {
        type: Notifications.SchedulableTriggerInputTypes.DATE;
        date: Date;
      }
    | {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR;
        hour?: number;
        minute?: number;
        weekday?: number;
        repeats?: boolean;
      }
    | {
        type: Notifications.SchedulableTriggerInputTypes.DAILY;
        hour: number;
        minute: number;
      }
    | {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY;
        weekday: number;
        hour: number;
        minute: number;
      }
    | null;
}

class LocalNotificationManager {
  private static instance: LocalNotificationManager;

  private constructor() {}

  static getInstance(): LocalNotificationManager {
    if (!LocalNotificationManager.instance) {
      LocalNotificationManager.instance = new LocalNotificationManager();
    }
    return LocalNotificationManager.instance;
  }

  // Static methods for easy access
  static async initialize(): Promise<boolean> {
    return LocalNotificationManager.getInstance().initialize();
  }

  static async sendCategoryBudgetAlert(
    categoryName: string,
    spent: number,
    budget: number
  ): Promise<void> {
    const settings = await LocalNotificationManager.getSettings();
    if (!settings.budgetAlerts) return;

    const percentage = Math.round((spent / budget) * 100);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Budget Alert",
        body: `${categoryName} is ${percentage}% over budget! Spent: $${spent.toFixed(
          2
        )} of $${budget.toFixed(2)}`,
        data: {
          type: "budget_alert",
          categoryName,
          spent,
          budget,
          screen: "budget",
        },
        sound: true,
        priority: "high" as const,
      },
      trigger: null, // Send immediately
    });

    // Update badge count
    await LocalNotificationManager.updateBadgeCount();
  }

  static async getSettings(): Promise<{
    dailyReminders: boolean;
    weeklyReports: boolean;
    budgetAlerts: boolean;
    goalAchievements: boolean;
  }> {
    const settings = await AsyncStorage.getItem("notificationSettings");
    if (settings) {
      return JSON.parse(settings);
    }

    // Default settings
    return {
      dailyReminders: true,
      weeklyReports: true,
      budgetAlerts: true,
      goalAchievements: true,
    };
  }

  static async updateBadgeCount(): Promise<void> {
    // Get current badge count and increment
    const currentCount = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(currentCount + 1);
  }

  // Initialize notification permissions
  async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return false;
    }

    // Set up notification categories for iOS
    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync("budget_reminder", [
        {
          identifier: "VIEW_BUDGET",
          buttonTitle: "View Budget",
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }

    return true;
  }

  // Schedule a local notification
  async scheduleNotification(
    options: LocalNotificationOptions
  ): Promise<string | null> {
    try {
      let trigger: Notifications.NotificationTriggerInput | null = null;

      if (options.trigger) {
        if (
          options.trigger.type ===
          Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
        ) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: options.trigger.seconds,
            repeats: options.trigger.repeats || false,
          };
        } else if (
          options.trigger.type ===
          Notifications.SchedulableTriggerInputTypes.DATE
        ) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: options.trigger.date,
          };
        } else if (
          options.trigger.type ===
          Notifications.SchedulableTriggerInputTypes.CALENDAR
        ) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: options.trigger.hour,
            minute: options.trigger.minute,
            weekday: options.trigger.weekday,
            repeats: options.trigger.repeats || false,
          };
        } else if (
          options.trigger.type ===
          Notifications.SchedulableTriggerInputTypes.DAILY
        ) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: options.trigger.hour,
            minute: options.trigger.minute,
          };
        } else if (
          options.trigger.type ===
          Notifications.SchedulableTriggerInputTypes.WEEKLY
        ) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: options.trigger.weekday,
            hour: options.trigger.hour,
            minute: options.trigger.minute,
          };
        }
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: "default",
          badge: 1,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  // Schedule recurring budget reminders
  async scheduleBudgetReminders(): Promise<void> {
    const isEnabled = await AsyncStorage.getItem("budgetRemindersEnabled");
    if (isEnabled === "false") return;

    // Cancel existing reminders
    await this.cancelBudgetReminders();

    // Daily expense reminder at 7 PM
    await this.scheduleNotification({
      title: "💰 Budget Reminder",
      body: "Don't forget to log today's expenses!",
      data: { type: "daily_reminder", route: "/(tabs)/" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19, // 7 PM
        minute: 0,
      },
    });

    // Weekly budget review on Sundays at 6 PM
    await this.scheduleNotification({
      title: "📊 Weekly Budget Review",
      body: "Time to review your weekly spending and plan ahead!",
      data: { type: "weekly_review", route: "/(tabs)/transactions" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18, // 6 PM
        minute: 0,
      },
    });
  }

  // Schedule category budget alerts
  async scheduleCategoryAlert(
    categoryName: string,
    percentage: number
  ): Promise<void> {
    await this.scheduleNotification({
      title: "⚠️ Budget Alert",
      body: `You've used ${percentage}% of your ${categoryName} budget this month.`,
      data: {
        type: "category_alert",
        category: categoryName,
        route: "/(tabs)/",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      }, // Immediate
    });
  }

  // Schedule goal achievement notification
  async scheduleGoalAchievement(message: string): Promise<void> {
    await this.scheduleNotification({
      title: "🎉 Goal Achieved!",
      body: message,
      data: { type: "goal_achievement", route: "/(tabs)/" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });
  }

  // Cancel all budget reminders
  async cancelBudgetReminders(): Promise<void> {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data;
      if (data?.type === "daily_reminder" || data?.type === "weekly_review") {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Handle notification response (when user taps notification)
  setupNotificationResponseHandler(
    navigationCallback: (route: string) => void
  ): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.route && typeof data.route === "string") {
        navigationCallback(data.route);
      }
    });
  }

  // Set notification badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear notification badge
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export default LocalNotificationManager;
