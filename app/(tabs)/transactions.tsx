import React, { useState, useMemo, useEffect } from "react";
import { Animated } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Plus, TrendingUp, TrendingDown, MinusIcon } from "lucide-react-native";
import TransactionItem from "../../components/TransactionItem";
import AddTransactionModal from "../../components/AddTransactionModal";
import EmptyState from "../../components/EmptyState";
import MonthSelector from "../../components/MonthSelector";
import useBudgetStore from "../../store/budget-store";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import { useMonthContext } from "../../store/month-context";
import { PieChart, BarChart } from "react-native-chart-kit";
import * as SVG from "react-native-svg";
import { SubscriptionPaywall } from "../../components/SubscriptionPaywall";
import useSubscriptionStore from "../../store/subscription-store";
import { useProgressiveRestrictions } from "../../hooks/useProgressiveRestrictions";
import { useRouter } from "expo-router";
import { UpgradePromptModal } from "../../components/UpgradePromptModal";

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    deleteTransaction,
    categories,
    income,
    baseCurrency,
    currencies,
  } = useBudgetStore();
  const { activeMonth } = useMonthContext();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isSubscribed, isDemoMode, isGuestMode } = useSubscriptionStore();
  const { getCurrentRestrictions, checkRestriction, trackRestrictionHit } =
    useProgressiveRestrictions();
  const [addTransactionModalVisible, setAddTransactionModalVisible] =
    useState(false);
  const [upgradePromptVisible, setUpgradePromptVisible] = useState(false);

  // Animation values
  const [chartAnimation] = useState(new Animated.Value(0));

  const restrictions = getCurrentRestrictions();
  const transactionLimit = restrictions.transactionLimit;
  const transactionCheck = checkRestriction(
    "transactionLimit",
    transactions.length
  );

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(activeMonth)
    );
  }, [transactions, activeMonth]);

  // Limit transactions in demo mode and guest mode using progressive restrictions
  const displayedTransactions =
    isDemoMode || isGuestMode
      ? filteredTransactions.slice(0, transactionLimit)
      : filteredTransactions;

  // Sort transactions by date (newest first)
  const sortedTransactions = [...displayedTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group transactions by date
  const groupedTransactions = sortedTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, typeof transactions>
  );

  // Convert grouped transactions to array for rendering
  const sections = Object.keys(groupedTransactions).map((date) => ({
    date,
    data: groupedTransactions[date],
  }));

  // Removed bar chart data preparation - chart has been removed per user request

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalSpent = displayedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const count = displayedTransactions.length;
    const average = count > 0 ? totalSpent / count : 0;

    // Removed trend calculation since bar chart was removed
    let trend = 0; // Simplified trend calculation

    return {
      total: totalSpent,
      count,
      average,
      trend,
    };
  }, [displayedTransactions]); // Removed barData dependency

  // Chart animation effect
  useEffect(() => {
    if (displayedTransactions.length > 0) {
      Animated.timing(chartAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [displayedTransactions.length]);

  // Prepare data for pie chart (spending by category)
  const pieData = useMemo(() => {
    const categorySpend = categories
      .map((cat) => {
        const total = displayedTransactions
          .filter((t) => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          value: Math.max(0.1, total), // Ensure minimum value for visibility
          svg: {
            fill: total > 0 ? cat.color : colors.border,
            strokeWidth: total > 0 ? 1 : 0,
            stroke: total > 0 ? "rgba(0,0,0,0.1)" : "transparent",
          },
          key: cat.id,
          label: cat.name,
          amount: total,
        };
      })
      .filter((item) => item.amount > 0);

    // If we have no data, provide a placeholder
    return categorySpend.length > 0
      ? categorySpend
      : [
          {
            value: 1,
            svg: { fill: colors.border },
            key: "no-data",
            label: t("noTransactionsYet"),
            amount: 0,
          },
        ];
  }, [categories, displayedTransactions, colors.border, t]);

  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
        {date}
      </Text>
    </View>
  );

  const renderTransactionSection = (section: {
    date: string;
    data: typeof transactions;
  }) => (
    <View key={section.date}>
      {renderSectionHeader(section.date)}
      {section.data.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onDelete={() => deleteTransaction(transaction.id)}
        />
      ))}
    </View>
  );

  const handleAddTransaction = () => {
    if (!isSubscribed && !isDemoMode) {
      router.push("/subscription" as any);
      return;
    }

    // Check progressive restrictions for demo/guest mode
    if ((isDemoMode || isGuestMode) && !isSubscribed) {
      const currentTransactionCount = filteredTransactions.length;
      if (currentTransactionCount >= transactionLimit) {
        trackRestrictionHit("transactionLimit", currentTransactionCount);
        setUpgradePromptVisible(true);
        return;
      }
    }

    setAddTransactionModalVisible(true);
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {!isSubscribed && !isDemoMode ? (
          <SubscriptionPaywall />
        ) : income === 0 ? (
          <View style={styles.contentContainer}>
            <EmptyState
              title={t("welcomeToBudget")}
              description={t("startBySettingIncome")}
              buttonText={t("setIncome")}
              onPress={() => router.push("/(tabs)" as any)}
            />
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.contentContainer}>
            <EmptyState
              title={t("noCategoriesYet")}
              description={t("createCategories")}
              buttonText={t("back")}
              onPress={() => router.push("/" as any)}
            />
          </View>
        ) : displayedTransactions.length === 0 ? (
          <View style={styles.contentContainer}>
            <EmptyState
              title={t("noTransactions")}
              description={t("addYourFirstTransaction")}
              buttonText={t("addTransaction")}
              onPress={() => setAddTransactionModalVisible(true)}
            />
            <Pressable
              style={styles.fabContainer}
              onPress={() => setAddTransactionModalVisible(true)}
              accessibilityLabel={t("addTransaction")}
            >
              <View style={[styles.fab, { backgroundColor: colors.primary }]}>
                <Plus size={32} color="#fff" />
              </View>
            </Pressable>
            <AddTransactionModal
              visible={addTransactionModalVisible}
              onClose={() => setAddTransactionModalVisible(false)}
            />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <MonthSelector />

              {/* Transaction Limit Warning */}
              {(isDemoMode || isGuestMode) && !transactionCheck.allowed && (
                <View
                  style={[
                    styles.warningBanner,
                    { backgroundColor: colors.warning + "20" },
                  ]}
                >
                  <Text style={[styles.warningText, { color: colors.warning }]}>
                    {transactionCheck.reason}
                  </Text>
                  <Text
                    style={[
                      styles.warningSubtext,
                      { color: colors.text + "80" },
                    ]}
                  >
                    {transactionCheck.upgradePrompt}
                  </Text>
                </View>
              )}

              {/* Near Limit Warning */}
              {(isDemoMode || isGuestMode) &&
                transactionCheck.allowed &&
                filteredTransactions.length >= transactionLimit - 2 && (
                  <View
                    style={[
                      styles.warningBanner,
                      { backgroundColor: colors.primary + "10" },
                    ]}
                  >
                    <Text
                      style={[styles.warningText, { color: colors.primary }]}
                    >
                      {filteredTransactions.length}/{transactionLimit}{" "}
                      transactions used
                    </Text>
                    <Text
                      style={[
                        styles.warningSubtext,
                        { color: colors.text + "80" },
                      ]}
                    >
                      Upgrade to save unlimited transactions
                    </Text>
                  </View>
                )}

              {/* Summary Statistics */}
              <Animated.View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.card,
                    opacity: chartAnimation,
                    transform: [
                      {
                        translateY: chartAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    {t("monthlySummary")}
                  </Text>

                  {/* Trend indicator */}
                  {displayedTransactions.length > 0 && (
                    <View style={styles.trendContainer}>
                      {summary.trend > 0 ? (
                        <>
                          <TrendingUp size={16} color={colors.danger} />
                          <Text
                            style={[styles.trendText, { color: colors.danger }]}
                          >
                            {t("increasing")}
                          </Text>
                        </>
                      ) : summary.trend < 0 ? (
                        <>
                          <TrendingDown size={16} color={colors.success} />
                          <Text
                            style={[
                              styles.trendText,
                              { color: colors.success },
                            ]}
                          >
                            {t("decreasing")}
                          </Text>
                        </>
                      ) : (
                        <>
                          <MinusIcon size={16} color={colors.subtext} />
                          <Text
                            style={[
                              styles.trendText,
                              { color: colors.subtext },
                            ]}
                          >
                            {t("stable")}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.summaryItems}>
                  <View style={styles.summaryItem}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.subtext }]}
                    >
                      {t("totalSpent")}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      <Text style={styles.currencySymbolStyle}>
                        {currencySymbol}
                      </Text>{" "}
                      {summary.total.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.subtext }]}
                    >
                      {t("transactions")}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {summary.count}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text
                      style={[styles.summaryLabel, { color: colors.subtext }]}
                    >
                      {t("average")}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      <Text style={styles.currencySymbolStyle}>
                        {currencySymbol}
                      </Text>{" "}
                      {summary.average.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
              {/* Pie Chart - Spending by Category */}
              <Animated.View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: colors.card,
                    opacity: chartAnimation,
                    transform: [
                      {
                        translateY: chartAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {t("spendingByCategory")}
                </Text>
                <View style={styles.pieChartContainer}>
                  {/* Pie Chart using react-native-chart-kit */}
                  <PieChart
                    data={pieData.map((item) => ({
                      name: item.label,
                      population: item.amount,
                      color: item.svg.fill,
                      legendFontColor: colors.text,
                      legendFontSize: 12,
                    }))}
                    width={Dimensions.get("window").width - 32}
                    height={180}
                    chartConfig={{
                      color: () => colors.primary,
                      labelColor: () => colors.text,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                  />
                  <View style={styles.pieLegend}>
                    {pieData.map((item) => {
                      const total = summary.total > 0 ? summary.total : 1;
                      const percentage = Math.round((item.value / total) * 100);
                      if (item.amount === 0) return null;
                      return (
                        <View key={item.key} style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              { backgroundColor: item.svg.fill },
                            ]}
                          />
                          <Text
                            style={[styles.legendText, { color: colors.text }]}
                          >
                            {" "}
                            {item.label} - ({percentage}%){" "}
                          </Text>
                          <Text
                            style={[
                              styles.legendText,
                              { color: colors.text, textAlign: "right" },
                            ]}
                          >
                            {" "}
                            <Text style={styles.legendCurrencySymbol}>
                              {currencySymbol}
                            </Text>{" "}
                            {item.amount.toFixed(2)}{" "}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
              {/* Transaction Sections */}
              <Text
                style={[styles.transactionSectionTitle, { color: colors.text }]}
              >
                {t("recentTransactions")}
              </Text>
              {sections.map(renderTransactionSection)}
            </ScrollView>
            <Pressable
              style={{
                position: "absolute",
                right: 24,
                bottom: 32,
                backgroundColor: colors.primary,
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.primary,
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => setAddTransactionModalVisible(true)}
              accessibilityLabel={t("addTransaction")}
            >
              <Plus size={32} color="#fff" />
            </Pressable>
            <AddTransactionModal
              visible={addTransactionModalVisible}
              onClose={() => setAddTransactionModalVisible(false)}
            />
            <UpgradePromptModal
              visible={upgradePromptVisible}
              onClose={() => setUpgradePromptVisible(false)}
              trigger="transaction_limit"
              urgencyLevel="high"
            />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  // Summary Card Styles
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  summaryItems: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  currencySymbolStyle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  // Chart Card Styles
  chartCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  // Pie Chart Styles
  pieChartContainer: {
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "column",
  },
  pieChartWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: "100%",
    paddingRight: 10, // Add padding to prevent text overflow
  },
  pieChart: {
    height: 220,
    width: "95%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  totalSpentLabel: {
    position: "absolute",
    bottom: 10,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  pieLegend: {
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 5,
    overflow: "hidden", // Prevent text overflow
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    overflow: "hidden", // Prevent text overflow
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  legendCurrencySymbol: {
    fontSize: 12,
    fontWeight: "400",
    opacity: 0.8,
  },
  // Bar Chart Styles
  barChartContainer: {
    marginTop: 10,
    height: 220,
  },
  chartWithAxis: {
    flexDirection: "row",
    height: 180,
  },
  barChart: {
    flex: 1,
    marginLeft: 8,
    height: 180,
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingLeft: 58, // Align with the chart
    paddingRight: 10,
  },
  barLabel: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
    flex: 1,
  },
  // Transaction Section Styles
  transactionSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fabContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  warningBanner: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    fontWeight: "400",
  },
});
