import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionModal from "@/components/AddTransactionModal";
import EmptyState from "@/components/EmptyState";
import MonthSelector from "@/components/MonthSelector";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { PieChart, BarChart } from "react-native-chart-kit";

export default function TransactionsScreen() {
  const {
    transactions,
    deleteTransaction,
    categories,
    income,
    defaultIncome,
    defaultCategoryBudgets,
    baseCurrency,
    currencies,
    selectedMonth,
    fetchTransactionsFromBackend,
    fetchCategoriesFromBackend,
    fetchBudgetFromBackend, // <-- add this
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // No fetchBudgetFromBackend here; MonthSelector handles it
    setLoading(false);
  }, []);

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // Sort transactions by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
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

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalSpent = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const count = filteredTransactions.length;
    const average = count > 0 ? totalSpent / count : 0;
    return {
      total: totalSpent,
      count,
      average,
    };
  }, [filteredTransactions]);

  // Prepare data for pie chart (spending by category)
  const pieData = useMemo(() => {
    const categorySpend = categories
      .map((cat) => {
        const total = filteredTransactions
          .filter((t) => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          value: total,
          svg: { fill: total > 0 ? cat.color : colors.border },
          key: cat.id,
          label: cat.name,
          amount: total,
        };
      })
      .filter((item) => item.value > 0);

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
  }, [categories, filteredTransactions, colors.border, t]);

  // Prepare data for bar chart (spending over last 7 days of the selected month)
  const barData = useMemo(() => {
    const monthStart = new Date(selectedMonth + "-01");
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    ); // Last day of the month
    const daysInMonth = monthEnd.getDate();
    const last7Days = Array.from(
      { length: Math.min(7, daysInMonth) },
      (_, i) => {
        const date = new Date(monthEnd);
        date.setDate(monthEnd.getDate() - i);
        return date.toISOString().split("T")[0]; // YYYY-MM-DD
      }
    ).reverse();

    const spendingByDay = last7Days.map((day) => {
      const dayTransactions = filteredTransactions.filter((t) =>
        t.date.startsWith(day)
      );
      const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        value: total,
        label: new Date(day).getDate().toString(), // Just the day number
      };
    });

    return spendingByDay;
  }, [filteredTransactions, selectedMonth]);

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

  const pieChartData = categories.map((category) => ({
    name: category.name,
    population: category.total,
    color: category.color,
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get("window").width;

  const barChartData = {
    labels: categories.map((category) => category.name),
    datasets: [
      {
        data: categories.map((category) => category.total ?? 0), // Default to 0 if total is undefined
      },
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <Text style={{ textAlign: "center", marginTop: 32 }}>
          {t("sending")}
        </Text>
      ) : error ? (
        <Text
          style={{ color: colors.danger, textAlign: "center", marginTop: 32 }}
        >
          {error}
        </Text>
      ) : income === 0 ? (
        <View style={styles.contentContainer}>
          <EmptyState
            title={t("setYourIncomeFirst")}
            description={t("pleaseSetIncome")}
            buttonText={t("goToDashboard")}
            onPress={() => {}}
          />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.contentContainer}>
          <EmptyState
            title={t("createCategoriesFirst")}
            description={t("needToCreateCategories")}
            buttonText={t("goToDashboard")}
            onPress={() => {}}
          />
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.contentContainer}>
          <EmptyState
            title={t("noTransactionsYet")}
            description={t("startTrackingExpenses")}
            buttonText={t("addTransaction")}
            onPress={() => setModalVisible(true)}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MonthSelector />

          {/* Summary Statistics */}
          <View
            style={[styles.summaryContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {t("spendingSummary")}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>
                  {t("totalSpent")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currencySymbol}
                  {summary.total.toFixed(2)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>
                  {t("transactions")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {summary.count}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>
                  {t("average")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currencySymbol}
                  {summary.average.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Pie Chart - Spending by Category */}
          <View
            style={[styles.chartContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {t("spendingByCategory")}
            </Text>
            {pieData && pieData.length > 0 && pieData[0].key !== "no-data" ? (
              <PieChart
                data={pieData.map((item) => ({
                  name: item.label,
                  population: item.value,
                  color: item.svg.fill,
                  legendFontColor: colors.text,
                  legendFontSize: 12,
                }))}
                width={screenWidth - 32}
                height={200}
                chartConfig={{
                  color: () => colors.primary,
                  labelColor: () => colors.text,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.pieChart}
              />
            ) : (
              <Text style={styles.noChartData}>{t("noTransactionsYet")}</Text>
            )}
          </View>

          {/* Bar Chart - Spending Over Last 7 Days */}
          <View
            style={[styles.chartContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {t("last7Days")}
            </Text>
            {barData && barData.length > 0 ? (
              <BarChart
                data={{
                  labels: barData.map((d) => d.label),
                  datasets: [{ data: barData.map((d) => d.value) }],
                }}
                width={screenWidth - 32}
                height={200}
                yAxisLabel={currencySymbol}
                yAxisSuffix=""
                chartConfig={{
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 2,
                  color: () => colors.primary,
                  labelColor: () => colors.text,
                  propsForBackgroundLines: { stroke: colors.border },
                }}
                style={styles.barChart}
                fromZero
                showValuesOnTopOfBars
              />
            ) : (
              <Text style={styles.noChartData}>{t("noTransactionsYet")}</Text>
            )}
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsContainer}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>
              {t("recentTransactions")}
            </Text>
            {sections
              .slice(0, 3)
              .map((section) => renderTransactionSection(section))}
            {sections.length > 3 && (
              <Pressable style={styles.viewMoreButton}>
                <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                  {t("seeAll")}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}

      {income > 0 && categories.length > 0 && (
        <View
          style={[styles.fabContainer, isRTL ? { left: 16 } : { right: 16 }]}
        >
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <AntDesign name="pluscircle" size={24} color="white" />
          </Pressable>
        </View>
      )}

      <AddTransactionModal
        visible={modalVisible}
        onClose={async () => {
          setModalVisible(false);
          const [year, month] = selectedMonth.split("-").map(Number);
          if (fetchTransactionsFromBackend)
            await fetchTransactionsFromBackend(year, month);
          if (fetchCategoriesFromBackend) await fetchCategoriesFromBackend();
          if (fetchBudgetFromBackend) await fetchBudgetFromBackend(year, month); // <-- re-fetch budget after modal
        }}
      />
    </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  summaryContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  pieChart: {
    height: 200,
    marginBottom: 16,
  },
  legendContainer: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  legendValue: {
    fontSize: 14,
  },
  noChartData: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  barChart: {
    height: 200,
    marginBottom: 16,
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  viewMoreButton: {
    alignItems: "center",
    padding: 10,
    marginTop: 10,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fabContainer: {
    position: "absolute",
    bottom: 16,
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
});
