import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAppTheme from "../hooks/useAppTheme";
import useNotificationStore, {
  Notification,
} from "../store/notification-store";

interface NotificationBellProps {
  color?: string;
}

const NotificationBell = ({ color }: NotificationBellProps) => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const {
    notifications,
    unseenCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotificationStore();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);

    // If there's an action link, navigate to it
    if (notification.actionLink) {
      router.push(notification.actionLink as any);
    }

    setIsModalVisible(false);
  };

  // Render a single notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const notificationDate = new Date(item.timestamp);
    const timeString = notificationDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateString = notificationDate.toLocaleDateString();

    let iconName = "information-circle";
    let iconColor = colors.primary;

    // Set icon and color based on notification type
    switch (item.type) {
      case "success":
        iconName = "checkmark-circle";
        iconColor = "#2ecc71";
        break;
      case "warning":
        iconName = "warning";
        iconColor = "#f39c12";
        break;
      case "error":
        iconName = "alert-circle";
        iconColor = "#e74c3c";
        break;
    }

    return (
      <Pressable
        style={({ pressed }) => [
          styles.notificationItem,
          {
            backgroundColor: item.isRead ? colors.background : colors.card,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {item.title}
            </Text>

            <TouchableOpacity
              onPress={() => clearNotification(item.id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={16} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.notificationMessage, { color: colors.text }]}>
            {item.message}
          </Text>

          <Text style={[styles.notificationTime, { color: colors.subtext }]}>
            {dateString} at {timeString}
          </Text>

          {item.actionText && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleNotificationPress(item)}
            >
              <Text style={[styles.actionText, { color: "#ffffff" }]}>
                {item.actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        style={styles.bellContainer}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="notifications" size={24} color={color || colors.text} />

        {unseenCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>
              {unseenCount > 99 ? "99+" : unseenCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Notifications
              </Text>

              <View style={styles.modalActions}>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    style={styles.markAllButton}
                  >
                    <Text
                      style={[styles.markAllText, { color: colors.primary }]}
                    >
                      Mark all as read
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off"
                  size={48}
                  color={colors.subtext}
                />
                <Text style={[styles.emptyText, { color: colors.subtext }]}>
                  No notifications yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.notificationsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  markAllButton: {
    marginRight: 16,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  notificationIcon: {
    marginRight: 12,
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  actionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default NotificationBell;
