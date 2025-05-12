import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";

const BudgetSummary = () => {
  const {
    income,
    defaultIncome,
    categories,
    defaultCategoryBudgets,
    transactions,
    baseCurrency,
    currencies,
    selectedMonth,
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL, language } = useLanguageStore();

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
  }, [filteredTransactions]);

  // Calculate total budget as sum of all category budgets
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, category) => sum + category.budget, 0);
  }, [categories]);

  const remaining = income - totalSpent;
  const budgetRemaining = totalBudget - totalSpent;
  const spentPercentage = income > 0 ? (totalSpent / income) * 100 : 0;
  const budgetPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Show info if using default income or default category budgets
  const isUsingDefaultIncome = income === defaultIncome && income > 0;
  const isUsingDefaultCategoryBudgets =
    categories.length > 0 &&
    categories.every(
      (cat) =>
        defaultCategoryBudgets[cat.id] !== undefined &&
        cat.budget === defaultCategoryBudgets[cat.id]
    );

  // Format the selected month for display using string, not Date object
  const [year, month] = selectedMonth.split("-");
  const formattedMonth = new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleString(language === "ar" ? "ar" : "en", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.header, isRTL && styles.rtlFlexRowReverse]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("budgetOverview")}
        </Text>
        <Text style={[styles.period, { color: colors.subtext }]}>
          {formattedMonth}
        </Text>
      </View>

      {isUsingDefaultIncome && (
        <Text style={{ color: colors.info, marginBottom: 4 }}>
          {t("usingDefaultIncome")}
        </Text>
      )}
      {isUsingDefaultCategoryBudgets && (
        <Text style={{ color: colors.info, marginBottom: 4 }}>
          {t("usingDefaultCategoryBudgets")}
        </Text>
      )}

      <View style={styles.amountContainer}>
        <Text style={[styles.amountLabel, { color: colors.subtext }]}>
          {t("remaining")}
        </Text>
        <Text
          style={[
            styles.amount,
            { color: colors.text },
            remaining < 0 ? { color: colors.danger } : null,
          ]}
        >
          {currencySymbol}
          {remaining.toFixed(2)}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(spentPercentage, 100)}%`,
                backgroundColor: remaining < 0 ? colors.danger : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            {t("income")}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}
            {income.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            {t("spent")}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}
            {totalSpent.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Total Budget
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}
            {totalBudget.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  period: {
    fontSize: 14,
    fontWeight: "500",
  },
  amountContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
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
});

export default BudgetSummary;
