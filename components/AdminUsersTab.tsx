import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
} from "react-native";
import {
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  Edit3,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useAuthStore from "../store/auth-store";
import { AdminUser } from "../lib/firebaseAdmin";

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function AdminUsersTab() {
  const { colors } = useAppTheme();
  const {
    user, // Current logged-in user
    userId, // Current user ID
    firebaseUsers,
    fetchFirebaseUsers,
    updateFirebaseUser,
    disableFirebaseUser,
    enableFirebaseUser,
    sendPasswordReset,
    deleteFirebaseUser,
    setUserRole,
    searchFirebaseUsers,
  } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoize filtered users for performance
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return firebaseUsers;
    }

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    return firebaseUsers.filter(
      (user) =>
        user.email?.toLowerCase().includes(lowercaseSearch) ||
        user.displayName?.toLowerCase().includes(lowercaseSearch) ||
        user.uid.toLowerCase().includes(lowercaseSearch)
    );
  }, [firebaseUsers, debouncedSearchTerm]);

  // Optimized load users function
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await fetchFirebaseUsers();
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchFirebaseUsers]);

  // Load users on mount with cleanup
  useEffect(() => {
    let isMounted = true;

    const loadInitialUsers = async () => {
      if (isMounted) {
        try {
          setLoading(true);
          await fetchFirebaseUsers();
        } catch (error) {
          console.error("Error loading users:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialUsers();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  }, [loadUsers]);

  const handleUserAction = (targetUser: AdminUser, action: string) => {
    setSelectedUser(targetUser);

    // Check if admin is trying to modify their own account
    const isCurrentUser =
      targetUser.uid === userId || targetUser.email === user?.email;

    switch (action) {
      case "disable":
        if (isCurrentUser) {
          Alert.alert(
            "Cannot Disable Own Account",
            "You cannot disable your own admin account. Please have another admin disable your account if needed."
          );
          return;
        }
        confirmAction(
          "Disable User",
          "Are you sure you want to disable this user?",
          async () => {
            await disableFirebaseUser(targetUser.uid);
            loadUsers();
          }
        );
        break;
      case "enable":
        confirmAction(
          "Enable User",
          "Are you sure you want to enable this user?",
          async () => {
            await enableFirebaseUser(targetUser.uid);
            loadUsers();
          }
        );
        break;
      case "resetPassword":
        confirmAction(
          "Reset Password",
          "Send password reset email to this user?",
          async () => {
            await sendPasswordReset(targetUser.email);
            Alert.alert("Success", "Password reset email sent");
          }
        );
        break;
      case "makeAdmin":
        confirmAction(
          "Make Admin",
          "Grant admin privileges to this user?",
          async () => {
            await setUserRole(targetUser.uid, "admin");
            loadUsers();
          }
        );
        break;
      case "removeAdmin":
        if (isCurrentUser) {
          Alert.alert(
            "Cannot Remove Own Admin Role",
            "You cannot remove your own admin privileges. Please have another admin remove your admin role if needed."
          );
          return;
        }
        confirmAction(
          "Remove Admin",
          "Remove admin privileges from this user?",
          async () => {
            await setUserRole(targetUser.uid, "user");
            loadUsers();
          }
        );
        break;
      case "delete":
        if (isCurrentUser) {
          Alert.alert(
            "Cannot Delete Own Account",
            "You cannot delete your own admin account. Please have another admin delete your account if needed."
          );
          return;
        }
        confirmAction(
          "Delete User",
          "This will permanently delete the user account. Are you sure?",
          async () => {
            await deleteFirebaseUser(targetUser.uid);
            loadUsers();
          }
        );
        break;
      case "details":
        setModalVisible(true);
        break;
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          try {
            await action();
          } catch (error) {
            console.error("Action failed:", error);
            Alert.alert("Error", "Failed to perform action");
          }
        },
      },
    ]);
  };

  const UserCard = ({ user: targetUser }: { user: AdminUser }) => {
    const isAdmin = targetUser.customClaims?.role === "admin";
    const isDisabled = targetUser.disabled;
    const isCurrentUser =
      targetUser.uid === userId || targetUser.email === user?.email;

    return (
      <View
        style={[
          styles.userCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.userInfo}>
          <View
            style={[
              styles.userAvatar,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <User size={24} color={colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {targetUser.displayName || "No Name"}
              </Text>
              {isCurrentUser && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: "#3B82F620", marginLeft: 8 },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: "#3B82F6" }]}>
                    You
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.userEmail, { color: colors.subtext }]}>
              {targetUser.email}
            </Text>
            <View style={styles.userMeta}>
              <Text style={[styles.userMetaText, { color: colors.subtext }]}>
                Created:{" "}
                {new Date(
                  targetUser.metadata?.creationTime || ""
                ).toLocaleDateString()}
              </Text>
              {targetUser.metadata?.lastSignInTime && (
                <Text style={[styles.userMetaText, { color: colors.subtext }]}>
                  Last Login:{" "}
                  {new Date(
                    targetUser.metadata.lastSignInTime
                  ).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.userStatus}>
          {isAdmin && (
            <View style={[styles.badge, { backgroundColor: "#F59E0B20" }]}>
              <Shield size={14} color="#F59E0B" />
              <Text style={[styles.badgeText, { color: "#F59E0B" }]}>
                Admin
              </Text>
            </View>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: isDisabled ? "#EF444420" : "#10B98120" },
            ]}
          >
            {isDisabled ? (
              <UserX size={14} color="#EF4444" />
            ) : (
              <UserCheck size={14} color="#10B981" />
            )}
            <Text
              style={[
                styles.badgeText,
                { color: isDisabled ? "#EF4444" : "#10B981" },
              ]}
            >
              {isDisabled ? "Disabled" : "Active"}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.actionButton}
          onPress={() => handleUserAction(targetUser as AdminUser, "details")}
        >
          <MoreVertical size={20} color={colors.subtext} />
        </Pressable>
      </View>
    );
  };

  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    const isAdmin = selectedUser.customClaims?.role === "admin";
    const isDisabled = selectedUser.disabled;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              User Details
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View
              style={[styles.modalSection, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Basic Information
              </Text>
              <View style={styles.infoRow}>
                <Mail size={16} color={colors.subtext} />
                <Text style={[styles.infoText, { color: colors.subtext }]}>
                  {selectedUser.email}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <User size={16} color={colors.subtext} />
                <Text style={[styles.infoText, { color: colors.subtext }]}>
                  {selectedUser.displayName || "No display name"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Calendar size={16} color={colors.subtext} />
                <Text style={[styles.infoText, { color: colors.subtext }]}>
                  Created:{" "}
                  {new Date(
                    selectedUser.metadata.creationTime
                  ).toLocaleString()}
                </Text>
              </View>
              {selectedUser.metadata.lastSignInTime && (
                <View style={styles.infoRow}>
                  <Calendar size={16} color={colors.subtext} />
                  <Text style={[styles.infoText, { color: colors.subtext }]}>
                    Last Login:{" "}
                    {new Date(
                      selectedUser.metadata.lastSignInTime
                    ).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[styles.modalSection, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Actions
              </Text>

              <Pressable
                style={[
                  styles.actionItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  handleUserAction(
                    selectedUser,
                    isDisabled ? "enable" : "disable"
                  );
                }}
              >
                {isDisabled ? (
                  <UserCheck size={20} color="#10B981" />
                ) : (
                  <UserX size={20} color="#EF4444" />
                )}
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {isDisabled ? "Enable User" : "Disable User"}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  handleUserAction(selectedUser, "resetPassword");
                }}
              >
                <Key size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Send Password Reset
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  handleUserAction(
                    selectedUser,
                    isAdmin ? "removeAdmin" : "makeAdmin"
                  );
                }}
              >
                <Shield size={20} color="#F59E0B" />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {isAdmin ? "Remove Admin" : "Make Admin"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.actionItem]}
                onPress={() => {
                  setModalVisible(false);
                  handleUserAction(selectedUser, "delete");
                }}
              >
                <Trash2 size={20} color="#EF4444" />
                <Text style={[styles.actionText, { color: "#EF4444" }]}>
                  Delete User
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Loading users...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Search size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={colors.subtext}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: colors.subtext }]}>
          {filteredUsers.length} users found
        </Text>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredUsers.map((user) => (
          <UserCard key={user.uid} user={user as AdminUser} />
        ))}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <User size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No users found
            </Text>
          </View>
        )}
      </ScrollView>

      <UserDetailsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: "column",
  },
  userMetaText: {
    fontSize: 12,
  },
  userStatus: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    marginLeft: 16,
    fontSize: 16,
  },
});
