import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import TransactionItem from "../../components/TransactionItem";
import AddTransactionModal from "../../components/AddTransactionModal";
import useBudgetStore from "../../store/budget-store";
import useAppTheme from "../../hooks/useAppTheme";

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
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Find category but don't conditionally return if not found
  const category = categories.find((c: any) => c.id === id);
  const categoryFound = !!category;

  // Get transactions for this category - safely handle missing category
  const categoryTransactions = categoryFound
    ? transactions
        .filter((t) => t.categoryId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleDeleteCategory = () => {
    if (!categoryFound) return;

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${
        category!.name
      }"? This will also delete all transactions in this category.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCategory(id);
            router.back();
          },
        },
      ]
    );
  };

  // Safely access category properties
  const percentage =
    categoryFound &&
    category &&
    category.budget > 0 &&
    category.spent !== undefined
      ? (category.spent / category.budget) * 100
      : 0;
  const remaining =
    categoryFound && category && category.spent !== undefined
      ? category.budget - category.spent
      : 0;
  const isOverBudget = remaining < 0;
  const currencySymbol =
    currencies.find((c: { code: string }) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  return (
    <>
      <Stack.Screen
        options={{
          title: categoryFound ? category!.name : "Category",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={handleDeleteCategory}
              style={[
                styles.headerButton,
                { opacity: categoryFound ? 1 : 0.5 },
              ]}
              disabled={!categoryFound}
            >
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {!categoryFound ? (
          <View
            style={[styles.notFound, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.notFoundText, { color: colors.text }]}>
              Category not found
            </Text>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetTitle, { color: colors.subtext }]}>
                  Budget
                </Text>
                <Text style={[styles.budgetAmount, { color: colors.text }]}>
                  {currencySymbol}
                  {category!.budget.toFixed(2)}
                </Text>
              </View>

              <View style={styles.spentContainer}>
                <Text style={[styles.spentLabel, { color: colors.subtext }]}>
                  Spent
                </Text>
                <Text style={[styles.spentAmount, { color: colors.text }]}>
                  {currencySymbol}
                  {category?.spent?.toFixed(2) || "0.00"}
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
                          : category!.color,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.remainingContainer}>
                <Text
                  style={[styles.remainingLabel, { color: colors.subtext }]}
                >
                  {isOverBudget ? "Over Budget" : "Remaining"}
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
                  {category &&
                  category.spent !== undefined &&
                  category.budget !== undefined
                    ? Math.abs(category.spent - category.budget).toFixed(2)
                    : "0.00"}
                </Text>
              </View>
            </View>

            <View style={styles.transactionsHeader}>
              <Text style={[styles.transactionsTitle, { color: colors.text }]}>
                Transactions
              </Text>
              <Text
                style={[styles.transactionsCount, { color: colors.subtext }]}
              >
                {categoryTransactions.length} total
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
                  No transactions in this category yet.
                </Text>
                <Pressable
                  style={[
                    styles.addTransactionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.addTransactionButtonText}>
                    Add Transaction
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
        )}

        <View
          style={[
            styles.fabContainer,
            { display: categoryFound ? "flex" : "none" },
          ]}
        >
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        <AddTransactionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
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
