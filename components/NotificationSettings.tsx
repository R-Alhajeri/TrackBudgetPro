import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import LocalNotificationManager from "../utils/LocalNotificationManager";

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const [budgetReminders, setBudgetReminders] = useState(true);
  const [categoryAlerts, setCategoryAlerts] = useState(true);
  const [goalNotifications, setGoalNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await Promise.all([
        AsyncStorage.getItem("budgetRemindersEnabled"),
        AsyncStorage.getItem("categoryAlertsEnabled"),
        AsyncStorage.getItem("goalNotificationsEnabled"),
        AsyncStorage.getItem("weeklyReportsEnabled"),
      ]);

      setBudgetReminders(settings[0] !== "false");
      setCategoryAlerts(settings[1] !== "false");
      setGoalNotifications(settings[2] !== "false");
      setWeeklyReports(settings[3] !== "false");
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetRemindersToggle = async (value: boolean) => {
    setBudgetReminders(value);
    await AsyncStorage.setItem("budgetRemindersEnabled", value.toString());

    const notificationManager = LocalNotificationManager.getInstance();
    if (value) {
      await notificationManager.scheduleBudgetReminders();
    } else {
      await notificationManager.cancelBudgetReminders();
    }
  };

  const handleCategoryAlertsToggle = async (value: boolean) => {
    setCategoryAlerts(value);
    await AsyncStorage.setItem("categoryAlertsEnabled", value.toString());
  };

  const handleGoalNotificationsToggle = async (value: boolean) => {
    setGoalNotifications(value);
    await AsyncStorage.setItem("goalNotificationsEnabled", value.toString());
  };

  const handleWeeklyReportsToggle = async (value: boolean) => {
    setWeeklyReports(value);
    await AsyncStorage.setItem("weeklyReportsEnabled", value.toString());
  };

  const testNotification = async () => {
    const notificationManager = LocalNotificationManager.getInstance();
    await notificationManager.scheduleNotification({
      title: "🧪 Test Notification",
      body: "Your notifications are working perfectly!",
      data: { type: "test" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });

    Alert.alert(
      "Test Notification Sent",
      "You should receive a test notification in 2 seconds.",
      [{ text: "OK" }]
    );
  };

  const requestPermissions = async () => {
    const notificationManager = LocalNotificationManager.getInstance();
    const granted = await notificationManager.initialize();

    if (granted) {
      Alert.alert(
        "Permissions Granted",
        "Notification permissions have been granted successfully.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Permissions Denied",
        "Please enable notifications in your device settings to receive budget reminders.",
        [{ text: "OK" }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading notification settings...
        </Text>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notification Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Notification Preferences
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Configure when and how you'd like to receive notifications
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="alarm" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Daily Budget Reminders
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.subtext },
                    ]}
                  >
                    Get reminded to log expenses at 7 PM daily
                  </Text>
                </View>
              </View>
              <Switch
                value={budgetReminders}
                onValueChange={handleBudgetRemindersToggle}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "70",
                }}
                thumbColor={budgetReminders ? colors.primary : colors.card}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.warning || "#f39c12"}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Category Budget Alerts
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.subtext },
                    ]}
                  >
                    Get alerted when approaching category limits
                  </Text>
                </View>
              </View>
              <Switch
                value={categoryAlerts}
                onValueChange={handleCategoryAlertsToggle}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "70",
                }}
                thumbColor={categoryAlerts ? colors.primary : colors.card}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons
                  name="trophy"
                  size={24}
                  color={colors.success || "#2ecc71"}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Goal Achievements
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.subtext },
                    ]}
                  >
                    Celebrate when you reach savings goals
                  </Text>
                </View>
              </View>
              <Switch
                value={goalNotifications}
                onValueChange={handleGoalNotificationsToggle}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "70",
                }}
                thumbColor={goalNotifications ? colors.primary : colors.card}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Weekly Reports
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.subtext },
                    ]}
                  >
                    Sunday evening spending summaries
                  </Text>
                </View>
              </View>
              <Switch
                value={weeklyReports}
                onValueChange={handleWeeklyReportsToggle}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "70",
                }}
                thumbColor={weeklyReports ? colors.primary : colors.card}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Notification Actions
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={testNotification}
            >
              <Ionicons name="notifications" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                Send Test Notification
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border }]}
              onPress={requestPermissions}
            >
              <Ionicons name="settings" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Check Permissions
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                About Local Notifications
              </Text>
              <Text style={[styles.infoDescription, { color: colors.subtext }]}>
                These notifications work without an internet connection and are
                scheduled directly on your device.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationSettings;
