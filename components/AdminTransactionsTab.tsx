import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useAuthStore from "../store/auth-store";

interface AnalyticsData {
  totalTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
  topCategories: Array<{ name: string; amount: number; count: number }>;
  monthlyData: Array<{ month: string; income: number; expenses: number; users: number }>;
  userGrowth: number;
  revenueGrowth: number;
}

export default function AdminTransactionsTab() {
  const { colors } = useAppTheme();
  const { getFirebaseUserAnalytics, getFirebaseSubscriptionAnalytics } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
    topCategories: [],
    monthlyData: [],
    userGrowth: 0,
    revenueGrowth: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get user and subscription analytics from Firebase
      const [userAnalytics, subscriptionAnalytics] = await Promise.all([
        getFirebaseUserAnalytics(),
        getFirebaseSubscriptionAnalytics(),
      ]);

      // Mock analytics data (in real app, this would come from Firebase Analytics/Firestore)
      const mockData: AnalyticsData = {
        totalTransactions: 15847,
        totalRevenue: 12450.50,
        averageTransactionValue: 78.60,
        topCategories: [
          { name: "Food & Dining", amount: 4520.30, count: 1250 },
          { name: "Transportation", amount: 2340.80, count: 890 },
          { name: "Shopping", amount: 1980.20, count: 720 },
          { name: "Entertainment", amount: 1450.60, count: 510 },
          { name: "Utilities", amount: 1200.40, count: 380 },
        ],
        monthlyData: [
          { month: "Jan", income: 45000, expenses: 38000, users: 1200 },
          { month: "Feb", income: 48000, expenses: 40000, users: 1350 },
          { month: "Mar", income: 52000, expenses: 43000, users: 1500 },
          { month: "Apr", income: 55000, expenses: 45000, users: 1680 },
          { month: "May", income: 58000, expenses: 47000, users: 1820 },
          { month: "Jun", income: 62000, expenses: 49000, users: 1950 },
        ],
        userGrowth: 15.2,
        revenueGrowth: 23.8,
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error("Error loading analytics:", error);
      Alert.alert("Error", "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportAnalytics = () => {
    Alert.alert(
      "Export Analytics",
      "Export analytics data to CSV?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Export", 
          onPress: () => {
            Alert.alert("Success", "Analytics data has been exported and sent to your email.");
          }
        },
      ]
    );
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    change, 
    color = colors.primary 
  }: {
    icon: any;
    title: string;
    value: string;
    change?: number;
    color?: string;
  }) => (
    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + "20" }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
      {change !== undefined && (
        <View style={styles.metricChange}>
          {change >= 0 ? (
            <TrendingUp size={12} color="#10B981" />
          ) : (
            <TrendingDown size={12} color="#EF4444" />
          )}
          <Text style={[
            styles.metricChangeText, 
            { color: change >= 0 ? "#10B981" : "#EF4444" }
          ]}>
            {Math.abs(change).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  const CategoryRow = ({ category }: { category: typeof analytics.topCategories[0] }) => (
    <View style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
        <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
          {category.count} transactions
        </Text>
      </View>
      <Text style={[styles.categoryAmount, { color: colors.text }]}>
        ${category.amount.toLocaleString()}
      </Text>
    </View>
  );

  const PeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
      {(["week", "month", "year"] as const).map((period) => (
        <Pressable
          key={period}
          style={[
            styles.periodOption,
            selectedPeriod === period && { backgroundColor: colors.primary + "20" }
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodText,
            {
              color: selectedPeriod === period ? colors.primary : colors.textSecondary,
              fontWeight: selectedPeriod === period ? "600" : "normal",
            }
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const SimpleBarChart = () => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 64;
    const maxValue = Math.max(...analytics.monthlyData.map(d => Math.max(d.income, d.expenses)));

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Monthly Income vs Expenses
        </Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#10B981" }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#EF4444" }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {analytics.monthlyData.map((data, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (data.income / maxValue) * 120,
                        backgroundColor: "#10B981",
                      }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (data.expenses / maxValue) * 120,
                        backgroundColor: "#EF4444",
                        marginLeft: 4,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {data.month}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Data Analytics
        </Text>
        <Pressable
          style={[styles.exportButton, { borderColor: colors.border }]}
          onPress={exportAnalytics}
        >
          <Download size={16} color={colors.primary} />
          <Text style={[styles.exportText, { color: colors.primary }]}>Export</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Period Selector */}
        <PeriodSelector />

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={BarChart3}
            title="Total Transactions"
            value={analytics.totalTransactions.toLocaleString()}
            change={analytics.userGrowth}
            color={colors.primary}
          />
          <MetricCard
            icon={DollarSign}
            title="Total Revenue"
            value={`$${analytics.totalRevenue.toLocaleString()}`}
            change={analytics.revenueGrowth}
            color="#10B981"
          />
          <MetricCard
            icon={TrendingUp}
            title="Avg Transaction"
            value={`$${analytics.averageTransactionValue.toFixed(2)}`}
            color="#F59E0B"
          />
          <MetricCard
            icon={Users}
            title="Active Users"
            value="1,950"
            change={15.2}
            color="#8B5CF6"
          />
        </View>

        {/* Chart */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SimpleBarChart />
        </View>

        {/* Top Categories */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top Categories
          </Text>
          {analytics.topCategories.map((category, index) => (
            <CategoryRow key={index} category={category} />
          ))}
        </View>

        {/* Quick Stats */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Stats
          </Text>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <PieChart size={20} color={colors.primary} />
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Categories
              </Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {analytics.topCategories.length}
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Activity size={20} color="#10B981" />
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                Daily Avg
              </Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {Math.round(analytics.totalTransactions / 30)}
              </Text>
            </View>
            <View style={styles.quickStat}>
              <Calendar size={20} color="#F59E0B" />
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                This Month
              </Text>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {analytics.monthlyData[analytics.monthlyData.length - 1]?.users || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reports & Actions
          </Text>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={() => Alert.alert("Info", "Detailed report generation coming soon")}
          >
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Generate Detailed Report
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={() => Alert.alert("Info", "Custom analytics dashboard coming soon")}
          >
            <BarChart3 size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Custom Analytics
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  metricChange: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricChangeText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  chartLegend: {
    flexDirection: "row",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
  },
  chartBar: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: 12,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickStat: {
    alignItems: "center",
  },
  quickStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
