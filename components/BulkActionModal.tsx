import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppTheme from "../hooks/useAppTheme";

type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | null;
  lastLogin?: string;
  status?: "active" | "inactive";
};

interface BulkActionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onBulkAction: (actionType: string) => void;
}

const BulkActionModal = ({
  visible,
  onClose,
  selectedUsers,
  onBulkAction,
}: BulkActionModalProps) => {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionType: string) => {
    setLoading(true);
    try {
      await onBulkAction(actionType);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to perform bulk action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            padding: 20,
            maxHeight: "80%",
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}
            >
              Bulk Actions
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 16, marginBottom: 16, color: colors.text }}
            >
              Selected {selectedUsers.length} user
              {selectedUsers.length !== 1 ? "s" : ""}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginHorizontal: 4,
                  backgroundColor: colors.primary,
                }}
                onPress={() => handleAction("activate")}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.card} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={colors.card}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        marginLeft: 8,
                        color: colors.card,
                      }}
                    >
                      Activate All
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginHorizontal: 4,
                  backgroundColor: "#e74c3c",
                }}
                onPress={() => handleAction("deactivate")}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.card} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={colors.card}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        marginLeft: 8,
                        color: colors.card,
                      }}
                    >
                      Deactivate All
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 8,
                marginHorizontal: 4,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: 12,
              }}
              onPress={() => handleAction("export")}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.text}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                      color: colors.text,
                    }}
                  >
                    Export User Data
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BulkActionModal;
