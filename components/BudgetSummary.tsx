import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import useBudgetStore from "../store/budget-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { useMonthContext } from "../store/month-context";

const BudgetSummary = () => {
  // Use the shared month context to ensure sync with MonthSelector
  const { activeMonth } = useMonthContext();
  const {
    income,
    categories,
    transactions,
    baseCurrency,
    currencies,
    getIncomeForMonth,
  } = useBudgetStore();

  // Use the activeMonth from context instead of selectedMonth from the store
  const selectedMonth = activeMonth;
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();

  // Get income for the selected month
  const monthlyIncome = useMemo(() => {
    return getIncomeForMonth(selectedMonth);
  }, [getIncomeForMonth, selectedMonth]);

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Extract YYYY-MM from the transaction date
      const transactionMonth = transaction.date.substring(0, 7);
      return transactionMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Calculate income and expenses separately
  const { totalExpenses, totalIncome } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.totalIncome += transaction.amount;
        } else {
          // Default to expense if type is not specified (for backwards compatibility)
          acc.totalExpenses += transaction.amount;
        }
        return acc;
      },
      { totalExpenses: 0, totalIncome: 0 }
    );
  }, [filteredTransactions]);

  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
  }, [filteredTransactions]);

  // Calculate total budget as sum of all category budgets for this month
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, category) => {
      // Get the budget for this specific month if it exists
      const monthlyBudget = category.monthlyBudgets?.[selectedMonth];
      return (
        sum + (monthlyBudget !== undefined ? monthlyBudget : category.budget)
      );
    }, 0);
  }, [categories, selectedMonth]);

  const remaining = monthlyIncome - totalSpent;
  const budgetRemaining = totalBudget - totalSpent;
  const spentPercentage =
    monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0;
  const budgetPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Format the selected month for display
  // Force selectedMonth to be a valid YYYY-MM string to avoid date parsing errors
  const cleanMonth =
    selectedMonth && selectedMonth.length >= 7
      ? selectedMonth.substring(0, 7)
      : new Date().toISOString().slice(0, 7);
  const selectedMonthDate = new Date(cleanMonth + "-01");
  const formattedMonth = selectedMonthDate.toLocaleString("default", {
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
                shadowColor: remaining < 0 ? colors.danger : colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 3,
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
          <View
            style={[
              styles.statValueContainer,
              isRTL && styles.rtlFlexRowReverse,
            ]}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}
              {monthlyIncome.toFixed(2)}
            </Text>
            {totalIncome > 0 && (
              <Text
                style={[styles.additionalIncome, { color: colors.success }]}
              >
                +{currencySymbol}
                {totalIncome.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            {t("expenses")}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}
            {totalExpenses.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            {t("totalBudget")}
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
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  period: {
    fontSize: 16,
    fontWeight: "500",
  },
  amountContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  additionalIncome: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default BudgetSummary;
