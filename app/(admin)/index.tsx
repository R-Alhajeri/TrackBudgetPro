import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Users,
  Settings,
  ArrowLeft,
  BarChart3,
  Shield,
  Database,
} from "lucide-react-native";
import useAppTheme from "../../hooks/useAppTheme";
import useAuthStore from "../../store/auth-store";
import AdminUsersTab from "../../components/AdminUsersTab";
import AdminSettingsTab from "../../components/AdminSettingsTab";

type TabType = "dashboard" | "users" | "settings";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  newUsersToday: number;
}

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
}

export default function AdminPanel() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { userRole, user, firebaseUsers, fetchFirebaseUsers } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    disabledUsers: 0,
    newUsersToday: 0,
  });

  // Memoize tab configuration to prevent re-renders
  const tabs: TabConfig[] = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "users", label: "Users", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    []
  );

  // Memoize user statistics calculation
  const calculateUserStats = useCallback(
    (users: typeof firebaseUsers): UserStats => {
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => !u.disabled).length;
      const disabledUsers = users.filter((u) => u.disabled).length;
      const today = new Date().toDateString();
      const newUsersToday = users.filter((u) => {
        if (!u.metadata?.creationTime) return false;
        return new Date(u.metadata.creationTime).toDateString() === today;
      }).length;

      return { totalUsers, activeUsers, disabledUsers, newUsersToday };
    },
    []
  );

  // Optimized data loading with better error handling
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchFirebaseUsers();
      // Calculate stats after fetch completes
      const stats = calculateUserStats(firebaseUsers);
      setUserStats(stats);
    } catch (error) {
      console.error("Error loading admin data:", error);
      // Graceful fallback to empty stats
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        disabledUsers: 0,
        newUsersToday: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []); // Remove unstable dependencies

  // Access control with cleanup
  useEffect(() => {
    let isMounted = true;

    if (userRole !== "admin") {
      Alert.alert(
        "Access Denied",
        "You don't have permission to access this area."
      );
      router.back();
      return;
    }

    if (isMounted) {
      loadAdminData();
    }

    return () => {
      isMounted = false;
    };
  }, [userRole, router]); // Remove loadAdminData dependency

  // Update stats when firebaseUsers changes
  useEffect(() => {
    if (firebaseUsers.length > 0) {
      const stats = calculateUserStats(firebaseUsers);
      setUserStats(stats);
    }
  }, [firebaseUsers, calculateUserStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAdminData();
    } finally {
      setRefreshing(false);
    }
  }, []); // Remove loadAdminData dependency

  const StatCard = React.memo(
    ({ title, value, icon: Icon, color }: StatCardProps) => (
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, { color: colors.subtext }]}>
            {title}
          </Text>
        </View>
      </View>
    )
  );

  const renderDashboard = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        User Management Overview
      </Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={userStats.totalUsers}
          icon={Users}
          color="#3B82F6"
        />
        <StatCard
          title="Active Users"
          value={userStats.activeUsers}
          icon={Shield}
          color="#10B981"
        />
        <StatCard
          title="Disabled Users"
          value={userStats.disabledUsers}
          icon={Database}
          color="#EF4444"
        />
        <StatCard
          title="New Today"
          value={userStats.newUsersToday}
          icon={Users}
          color="#F59E0B"
        />
      </View>

      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          System Information
        </Text>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            App Version:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            Database Status:
          </Text>
          <Text style={[styles.infoValue, { color: "#10B981" }]}>
            Connected
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            Environment:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            Production
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Admin Panel
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            Loading admin data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Admin Panel
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.adminBadge, { color: colors.primary }]}>
            Admin
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                isActive && {
                  backgroundColor: colors.primary + "20",
                  borderBottomColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab(tab.id as TabType)}
            >
              <Icon
                size={20}
                color={isActive ? colors.primary : colors.subtext}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.primary : colors.subtext,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "users" && <AdminUsersTab />}
      {activeTab === "settings" && <AdminSettingsTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  adminBadge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});
