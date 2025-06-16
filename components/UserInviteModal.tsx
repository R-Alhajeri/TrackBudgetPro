import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppTheme from "../hooks/useAppTheme";

interface UserInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (email: string, role: "user" | "admin") => void;
}

const UserInviteModal = ({
  visible,
  onClose,
  onInvite,
}: UserInviteModalProps) => {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onInvite(email, role);
      setEmail("");
      setRole("user");
      onClose();
    } catch (error) {
      setError("Failed to send invitation");
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
              Invite New User
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 14, marginBottom: 4, color: colors.text }}
              >
                Email Address
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 16,
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: error ? "#e74c3c" : colors.border,
                }}
                placeholder="Enter email address"
                placeholderTextColor={colors.subtext}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? (
                <Text style={{ color: "#e74c3c", fontSize: 12, marginTop: 4 }}>
                  {error}
                </Text>
              ) : null}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ fontSize: 14, marginBottom: 4, color: colors.text }}
              >
                Role
              </Text>
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginRight: 8,
                    backgroundColor:
                      role === "user" ? colors.primary + "20" : undefined,
                  }}
                  onPress={() => setRole("user")}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: "#ccc",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                    }}
                  >
                    {role === "user" && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text style={{ fontSize: 16, color: colors.text }}>
                    Regular User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    marginRight: 8,
                    backgroundColor:
                      role === "admin" ? colors.primary + "20" : undefined,
                  }}
                  onPress={() => setRole("admin")}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: "#ccc",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                    }}
                  >
                    {role === "admin" && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text style={{ fontSize: 16, color: colors.text }}>
                    Administrator
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 10,
                backgroundColor: colors.primary,
              }}
              onPress={handleInvite}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} size="small" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color={colors.card} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                      color: colors.card,
                    }}
                  >
                    Send Invitation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserInviteModal;
