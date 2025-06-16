import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAppTheme from "../hooks/useAppTheme";
import useAuthStore from "../store/auth-store";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Typography, Shadows, BorderRadius } from "../constants/styleGuide";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  backgroundColor?: string;
  onPress?: () => void;
}

interface DashboardStatProps {
  title: string;
  data: any;
  chartConfig: any;
  chartType: "line" | "pie";
  height?: number;
}

const DashboardCard = React.memo(
  ({
    title,
    value,
    icon,
    color,
    backgroundColor,
    onPress,
  }: DashboardCardProps) => {
    const { colors } = useAppTheme();

    const cardStyle = useMemo(
      () => [
        styles.dashboardCard,
        { backgroundColor: backgroundColor || colors.card },
        Shadows.medium as any,
      ],
      [backgroundColor, colors.card]
    );

    const iconContainerStyle = useMemo(
      () => [styles.cardIconContainer, { backgroundColor: `${color}20` }],
      [color]
    );

    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={iconContainerStyle}>
          <Ionicons name={icon as any} size={28} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.subtext }]}>
            {title}
          </Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {value}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

const DashboardStat = React.memo(
  ({
    title,
    data,
    chartConfig,
    chartType,
    height = 200,
  }: DashboardStatProps) => {
    const { colors } = useAppTheme();
    const screenWidth = useMemo(() => Dimensions.get("window").width - 40, []);

    const containerStyle = useMemo(
      () => [
        styles.statContainer,
        { backgroundColor: colors.card },
        Shadows.medium as any,
      ],
      [colors.card]
    );

    return (
      <View style={containerStyle}>
        <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.chartContainer}>
          {chartType === "line" ? (
            <LineChart
              data={data}
              width={screenWidth}
              height={height}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <PieChart
              data={data}
              width={screenWidth}
              height={height}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          )}
        </View>
      </View>
    );
  }
);

interface AdminDashboardProps {
  activeTab: string;
  transactions: any[];
  categories: any[];
  subscriptions: any[];
  users: any[];
  colors: any;
}

const AdminDashboard = React.memo(({
  activeTab,
  transactions,
  categories,
  subscriptions,
  users,
  colors,
}: AdminDashboardProps) => {
  const { isDark } = useAppTheme();
  const router = useRouter();
  const {
    getFirebaseUserAnalytics,
    getFirebaseSubscriptionAnalytics,
    firebaseUsers,
  } = useAuthStore();

  const [userAnalytics, setUserAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  });

  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual refresh function for pull-to-refresh
  const refreshAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setError(null);
    try {
      const [userStats, subscriptionStats] = await Promise.all([
        getFirebaseUserAnalytics(),
        getFirebaseSubscriptionAnalytics(),
      ]);
      setUserAnalytics(userStats);
      setSubscriptionAnalytics(subscriptionStats);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []); // Remove unstable dependencies

  useEffect(() => {
    // Load analytics on mount only
    const loadInitialAnalytics = async () => {
      setAnalyticsLoading(true);
      setError(null);
      try {
        const [userStats, subscriptionStats] = await Promise.all([
          getFirebaseUserAnalytics(),
          getFirebaseSubscriptionAnalytics(),
        ]);
        setUserAnalytics(userStats);
        setSubscriptionAnalytics(subscriptionStats);
      } catch (error) {
        console.error("Error loading analytics:", error);
        setError("Failed to load analytics data");
        // Fall back to mock data
        setUserAnalytics({
          totalUsers: users?.length || 0,
          activeUsers: users?.filter((u) => u.status !== "inactive")?.length || 0,
          newUsersToday: 2,
          newUsersThisWeek: 8,
          newUsersThisMonth: 15,
        });
        setSubscriptionAnalytics({
          totalSubscriptions: subscriptions?.length || 0,
          activeSubscriptions:
            subscriptions?.filter((s) => s.status === "active")?.length || 0,
          expiredSubscriptions:
            subscriptions?.filter((s) => s.status === "expired")?.length || 0,
          monthlyRevenue: 150.5,
          yearlyRevenue: 1250.99,
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadInitialAnalytics();
  }, []); // Empty dependency array - only run on mount

  // Memoized computed values
  const displayUserCount = useMemo(
    () =>
      firebaseUsers.length > 0 ? userAnalytics.totalUsers : users?.length || 0,
    [firebaseUsers.length, userAnalytics.totalUsers, users?.length]
  );

  const displayActiveSubscriptions = useMemo(
    () =>
      firebaseUsers.length > 0
        ? subscriptionAnalytics.activeSubscriptions
        : subscriptions?.length || 0,
    [
      firebaseUsers.length,
      subscriptionAnalytics.activeSubscriptions,
      subscriptions?.length,
    ]
  );

  const chartConfig = useMemo(
    () => ({
      backgroundColor: colors.card,
      backgroundGradientFrom: colors.card,
      backgroundGradientTo: colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      labelColor: (opacity = 1) => colors.text,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: colors.primary,
      },
    }),
    [colors.card, colors.text, colors.primary]
  );

  const handleNavigateToUsers = useCallback(() => {
    router.push("/(admin)/users" as any);
  }, [router]);

  const handleNavigateToSubscriptions = useCallback(() => {
    router.push("/(admin)/subscriptions" as any);
  }, [router]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {activeTab === "dashboard" && (
        <>
          {/* Error message */}
          {error && (
            <View
              style={[styles.errorContainer, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={loadAnalytics}
                style={styles.retryButton}
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dashboard Cards */}
          <View style={styles.cardsContainer}>
            <DashboardCard
              title="Total Users"
              value={analyticsLoading ? "..." : displayUserCount.toString()}
              icon="people"
              color="#007AFF"
              onPress={handleNavigateToUsers}
            />
            <DashboardCard
              title="Active Subscriptions"
              value={
                analyticsLoading ? "..." : displayActiveSubscriptions.toString()
              }
              icon="cash"
              color="#4CD964"
              onPress={handleNavigateToSubscriptions}
            />
            <DashboardCard
              title="Monthly Revenue"
              value={
                analyticsLoading
                  ? "..."
                  : `$${subscriptionAnalytics.monthlyRevenue.toFixed(2)}`
              }
              icon="trending-up"
              color="#FF9500"
            />
            <DashboardCard
              title="New Users (Month)"
              value={
                analyticsLoading
                  ? "..."
                  : userAnalytics.newUsersThisMonth.toString()
              }
              icon="person-add"
              color="#5856D6"
            />
          </View>

          {/* Loading indicator for analytics */}
          {analyticsLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.subtext }]}>
                Loading analytics...
              </Text>
            </View>
          )}

          {/* Additional Analytics Cards */}
          <View style={styles.cardsContainer}>
            <DashboardCard
              title="Active Users"
              value={
                analyticsLoading ? "..." : userAnalytics.activeUsers.toString()
              }
              icon="pulse"
              color="#34C759"
            />
            <DashboardCard
              title="New Today"
              value={
                analyticsLoading
                  ? "..."
                  : userAnalytics.newUsersToday.toString()
              }
              icon="today"
              color="#FF3B30"
            />
            <DashboardCard
              title="Expired Subs"
              value={
                analyticsLoading
                  ? "..."
                  : subscriptionAnalytics.expiredSubscriptions.toString()
              }
              icon="time"
              color="#FF9500"
            />
            <DashboardCard
              title="Transactions"
              value={transactions?.length?.toString() || "0"}
              icon="swap-horizontal"
              color="#FF9500"
              onPress={() => router.push("/(admin)/transactions" as any)}
            />
            <DashboardCard
              title="Revenue"
              value={`$${calculateRevenue(subscriptions)}`}
              icon="trending-up"
              color="#FF3B30"
              onPress={() => router.push("/(admin)/subscriptions" as any)}
            />
          </View>

          {/* User Growth Chart */}
          <DashboardStat
            title="User Growth"
            data={generateUserStats(users)}
            chartConfig={chartConfig}
            chartType="line"
          />

          {/* Transaction Stats */}
          <DashboardStat
            title="Transaction Volume"
            data={generateTransactionStats(transactions)}
            chartConfig={chartConfig}
            chartType="line"
          />

          {/* Category Distribution */}
          <DashboardStat
            title="Category Distribution"
            data={generateCategoryData(categories, transactions)}
            chartConfig={chartConfig}
            chartType="pie"
          />

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            {" "}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.card },
                  Shadows.small as any,
                ]}
                onPress={() => router.push("/(admin)/users" as any)}
              >
                <Ionicons name="person-add" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Invite User
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.card },
                  Shadows.small as any,
                ]}
                onPress={() => router.push("/(admin)/maintenance" as any)}
              >
                <Ionicons name="build" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Maintenance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.card },
                  Shadows.small as any,
                ]}
                onPress={() => router.push("/(admin)/transactions" as any)}
              >
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Analytics
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.card },
                  Shadows.small as any,
                ]}
                onPress={() => router.push("/(admin)/transactions" as any)}
              >
                <Ionicons name="download" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  Export Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {activeTab === "users" && (
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, { color: colors.text }]}>
            User Management
          </Text>
          <Text style={[styles.tabDescription, { color: colors.subtext }]}>
            {users?.length || 0} registered users
          </Text>
          {/* User list content would go here */}
        </View>
      )}

      {activeTab === "transactions" && (
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, { color: colors.text }]}>
            Transaction Management
          </Text>
          <Text style={[styles.tabDescription, { color: colors.subtext }]}>
            {transactions?.length || 0} transactions recorded
          </Text>
          {/* Transaction list content would go here */}
        </View>
      )}

      {activeTab === "subscriptions" && (
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, { color: colors.text }]}>
            Subscription Management
          </Text>
          <Text style={[styles.tabDescription, { color: colors.subtext }]}>
            {subscriptions?.length || 0} active subscriptions
          </Text>
          {/* Subscription list content would go here */}
        </View>
      )}

      {activeTab === "settings" && (
        <View style={styles.tabContent}>
          <Text style={[styles.tabTitle, { color: colors.text }]}>
            Admin Settings
          </Text>
          <Text style={[styles.tabDescription, { color: colors.subtext }]}>
            System maintenance and configuration
          </Text>
          {/* Settings content would go here */}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dashboardCard: {
    width: "48%",
    borderRadius: BorderRadius.medium,
    padding: 16,
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statContainer: {
    borderRadius: BorderRadius.medium,
    padding: 16,
    marginBottom: 16,
    width: "100%",
  },
  statTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  quickActionsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  actionText: {
    marginTop: 8,
    fontWeight: "500",
  },
  tabContent: {
    padding: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  tabDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 16,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

// Utility functions for generating chart data
const generateUserStats = (users: any[]) => {
  // Default data if no users
  if (!users || users.length === 0) {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }

  // In a real app, you would process user signup dates to create monthly data
  // This is a placeholder implementation
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyData = [5, 8, 12, 15, 22, users.length]; // Sample growth data

  return {
    labels: monthLabels,
    datasets: [
      {
        data: monthlyData,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

const generateTransactionStats = (transactions: any[]) => {
  // Default data if no transactions
  if (!transactions || transactions.length === 0) {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }

  // In a real app, you would process transaction dates to create monthly data
  // This is a placeholder implementation
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyData = [10, 15, 25, 30, 45, transactions.length]; // Sample transaction volume data

  return {
    labels: monthLabels,
    datasets: [
      {
        data: monthlyData,
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
};

const generateCategoryData = (categories: any[], transactions: any[]) => {
  // Default data if no categories or transactions
  if (
    !categories ||
    categories.length === 0 ||
    !transactions ||
    transactions.length === 0
  ) {
    return [
      {
        name: "No Data",
        value: 1,
        color: "#CCCCCC",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];
  }

  // In a real app, you would process transactions to count by category
  // This is a placeholder implementation
  const categoryColors = [
    "#FF9500",
    "#FF3B30",
    "#4CD964",
    "#007AFF",
    "#5856D6",
    "#FF2D55",
    "#FFCC00",
    "#8E8E93",
    "#34C759",
    "#5AC8FA",
  ];

  // Take first 5 categories or fewer if there are less than 5
  const displayCategories = categories.slice(0, 5);

  return displayCategories.map((category, index) => {
    // In a real app, you'd count actual transactions in this category
    const value = Math.floor(Math.random() * 50) + 5; // Random number 5-55

    return {
      name: category.name || `Category ${index + 1}`,
      value,
      color: categoryColors[index % categoryColors.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    };
  });
};

const calculateRevenue = (subscriptions: any[]) => {
  // Default return if no subscriptions
  if (!subscriptions || subscriptions.length === 0) {
    return "0.00";
  }

  // In a real app, you would sum up actual subscription prices
  // This is a placeholder implementation
  const total = subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0);
  return total.toFixed(2);
};

// Add display names for better debugging
DashboardCard.displayName = 'DashboardCard';
DashboardStat.displayName = 'DashboardStat';
AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
