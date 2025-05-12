import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionModal from "@/components/AddTransactionModal";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    categories,
    transactions,
    deleteCategory,
    deleteTransaction,
    baseCurrency,
    currencies,
    fetchBudgetFromBackend,
    selectedMonth,
    deleteCategoryInBackend,
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [modalVisible, setModalVisible] = useState(false);

  const category = categories.find((c) => c.id === id);

  if (!category) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          {t("category")} not found
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{t("cancel")}</Text>
        </Pressable>
      </View>
    );
  }

  // Get transactions for this category in the selected month
  const categoryTransactions = transactions
    .filter((t) => t.categoryId === id && t.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteCategory = () => {
    Alert.alert(
      t("delete"),
      `Are you sure you want to delete ${category.name}?`,
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            // Use deleteCategoryInBackend to ensure proper server sync
            await deleteCategoryInBackend?.(id);
            router.back();
          },
        },
      ]
    );
  };

  // Re-fetch data when selected month changes
  useEffect(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    fetchBudgetFromBackend?.(year, month);
  }, [selectedMonth, fetchBudgetFromBackend]);

  const percentage =
    category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  const remaining = category.budget - category.spent;
  const isOverBudget = remaining < 0;
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: category.name,
          headerRight: () => (
            <Pressable
              onPress={handleDeleteCategory}
              style={styles.headerButton}
            >
              <AntDesign name="delete" size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
            <View style={styles.budgetHeader}>
              <Text style={[styles.budgetTitle, { color: colors.subtext }]}>
                {t("monthlyBudget")}
              </Text>
              <Text style={[styles.budgetAmount, { color: colors.text }]}>
                {currencySymbol}
                {category.budget.toFixed(2)}
              </Text>
            </View>

            <View style={styles.spentContainer}>
              <Text style={[styles.spentLabel, { color: colors.subtext }]}>
                {t("spent")}
              </Text>
              <Text style={[styles.spentAmount, { color: colors.text }]}>
                {currencySymbol}
                {category.spent.toFixed(2)}
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
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOverBudget
                        ? colors.danger
                        : category.color,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.remainingContainer}>
              <Text style={[styles.remainingLabel, { color: colors.subtext }]}>
                {isOverBudget ? t("overBy") : t("remaining")}
              </Text>
              <Text
                style={[
                  styles.remainingAmount,
                  { color: colors.text },
                  isOverBudget && { color: colors.danger },
                ]}
              >
                {isOverBudget ? "-" : ""}
                {currencySymbol}
                {Math.abs(remaining).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>
              {t("transactions")}
            </Text>
            <Text style={[styles.transactionsCount, { color: colors.subtext }]}>
              {categoryTransactions.length} {t("total")}
            </Text>
          </View>

          {categoryTransactions.length === 0 ? (
            <View
              style={[
                styles.emptyTransactions,
                { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.emptyTransactionsText,
                  { color: colors.subtext },
                ]}
              >
                {t("noTransactionsYet")}
              </Text>
              <Pressable
                style={[
                  styles.addTransactionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.addTransactionButtonText}>
                  {t("addTransaction")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.transactionsList,
                { backgroundColor: colors.card },
              ]}
            >
              {categoryTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={() => deleteTransaction(transaction.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.fabContainer}>
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="white" />
          </Pressable>
        </View>

        <AddTransactionModal
          visible={modalVisible}
          onClose={async () => {
            setModalVisible(false);
            // Re-fetch budget data when the transaction modal is closed
            if (fetchBudgetFromBackend) {
              const [year, month] = selectedMonth.split("-").map(Number);
              await fetchBudgetFromBackend(year, month);
            }
          }}
          categoryId={id}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerButton: {
    padding: 8,
  },
  budgetCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  spentContainer: {
    marginBottom: 12,
  },
  spentLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  progressContainer: {
    marginBottom: 16,
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
  remainingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remainingLabel: {
    fontSize: 14,
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  transactionsCount: {
    fontSize: 14,
  },
  emptyTransactions: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyTransactionsText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  addTransactionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addTransactionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  transactionsList: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
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
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
