import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppTheme from "../hooks/useAppTheme";

// Define User type locally (copy from admin/index.tsx)
type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | null;
  lastLogin?: string;
  status?: "active" | "inactive";
};

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  currentUserId: string; // Add currentUserId to know if user is modifying their own account
  onStatusChange: (userId: string, status: "active" | "inactive") => void;
  onResetPassword: (userId: string) => Promise<void>;
  onExportData: (userId: string) => void;
}

const UserDetailModal = ({
  visible,
  onClose,
  user,
  currentUserId,
  onStatusChange,
  onResetPassword,
  onExportData,
}: UserDetailModalProps) => {
  const { colors } = useAppTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!user) return null;

  const handleResetPassword = async () => {
    // Prevent resetting password of own account
    if (user.id === currentUserId) {
      Alert.alert(
        "Security Restriction",
        "For security reasons, you cannot reset your own password from the admin panel. Please use the account settings page instead.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      "Are you sure you want to reset this user's password?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            setIsResetting(true);
            try {
              await onResetPassword(user.id);
            } catch (error) {
              Alert.alert("Error", "Failed to reset password.");
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      onExportData(user.id);
    } catch (error) {
      Alert.alert("Error", "Failed to export user data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 20,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              borderRadius: 12,
              padding: 18,
              backgroundColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 8,
              maxWidth: 400,
              minWidth: 300,
              alignSelf: "center",
              width: "100%",
              minHeight: 420,
              justifyContent: "flex-start",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}
              >
                User Details
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
            >
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "bold",
                      color: colors.card,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                    color: colors.subtext,
                  }}
                >
                  Name
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {user.name}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                    color: colors.subtext,
                  }}
                >
                  Email
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {user.email}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                    color: colors.subtext,
                  }}
                >
                  Role
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor:
                      user.role === "admin" ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: user.role === "admin" ? colors.card : colors.text,
                      letterSpacing: 1,
                    }}
                  >
                    {user.role?.toUpperCase() || "USER"}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                    color: colors.subtext,
                  }}
                >
                  Last Login
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: colors.text,
                  }}
                >
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "Never"}
                </Text>
              </View>

              <View
                style={{
                  marginBottom: 20,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                    color: colors.subtext,
                  }}
                >
                  Status
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor:
                        user.status === "inactive" ? "#e74c3c" : "#2ecc71",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.card,
                        letterSpacing: 1,
                      }}
                    >
                      {user.status === "inactive" ? "INACTIVE" : "ACTIVE"}
                    </Text>
                  </View>
                  <Switch
                    value={user.status !== "inactive"}
                    onValueChange={(value) => {
                      // Prevent admins from deactivating their own account
                      if (user.id === currentUserId && !value) {
                        Alert.alert(
                          "Cannot Deactivate",
                          "You cannot deactivate your own account while logged in.",
                          [{ text: "OK" }]
                        );
                        return;
                      }
                      onStatusChange(user.id, value ? "active" : "inactive");
                    }}
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={colors.card}
                    // Disable switch if it's current user and trying to deactivate
                    disabled={
                      user.id === currentUserId && user.status !== "inactive"
                    }
                  />
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginVertical: 16,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    flex: 0.48,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                  }}
                  onPress={handleResetPassword}
                  disabled={isResetting}
                  activeOpacity={0.8}
                >
                  {isResetting ? (
                    <ActivityIndicator color={colors.card} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color={colors.card}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          marginLeft: 8,
                          color: colors.card,
                        }}
                      >
                        Reset Password
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    flex: 0.48,
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderWidth: 1.5,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                  onPress={handleExportData}
                  disabled={isExporting}
                  activeOpacity={0.8}
                >
                  {isExporting ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          marginLeft: 8,
                          color: colors.primary,
                        }}
                      >
                        Export Data
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default UserDetailModal;
