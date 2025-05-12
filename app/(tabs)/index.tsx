import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import BudgetSummary from "@/components/BudgetSummary";
import CategoryCard from "@/components/CategoryCard";
import AddTransactionModal from "@/components/AddTransactionModal";
import SetIncomeModal from "@/components/SetIncomeModal";
import EmptyState from "@/components/EmptyState";
import MonthSelector from "@/components/MonthSelector";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { useRouter } from "expo-router";
import useAuthStore from "@/store/auth-store"; // Added import

export default function DashboardScreen() {
  const router = useRouter();
  const {
    income,
    categories,
    transactions,
    selectedMonth,
    fetchCategoriesFromBackend,
    fetchTransactionsFromBackend,
    fetchBudgetFromBackend, // <-- add this
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isAuthenticated, hasHydrated } = useAuthStore(); // Get auth state

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddTransaction = (categoryId?: string) => {
    setSelectedCategoryId(categoryId);
    setTransactionModalVisible(true);
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // Calculate spent for the selected month for each category
  const categoriesWithMonthlySpent = useMemo(() => {
    return categories.map((category) => {
      const monthlySpent = filteredTransactions
        .filter((t) => t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...category, spent: monthlySpent };
    });
  }, [categories, filteredTransactions]);

  // Show top 3 categories by budget
  const topCategories = [...categoriesWithMonthlySpent]
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 3);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [year, month] = selectedMonth.split("-").map(Number);
        if (fetchBudgetFromBackend) await fetchBudgetFromBackend(year, month); // <-- fetch budget for month
        // Ensure these functions exist before calling
        if (fetchCategoriesFromBackend) await fetchCategoriesFromBackend();
        if (fetchTransactionsFromBackend)
          await fetchTransactionsFromBackend(year, month);
      } catch (e: any) {
        // Added type annotation for e
        console.error("Error fetching dashboard data:", e);
        if (
          e &&
          e.message &&
          typeof e.message === "string" &&
          e.message.includes("UNAUTHORIZED")
        ) {
          setError(t("sessionExpiredPleaseLogin"));
        } else {
          setError(t("errorOccurred"));
        }
      } finally {
        setLoading(false);
      }
    };

    if (hasHydrated) {
      if (isAuthenticated) {
        fetchData();
      }
    }
    // Add isAuthenticated, hasHydrated to dependency array
  }, [
    selectedMonth,
    fetchCategoriesFromBackend,
    fetchTransactionsFromBackend,
    isAuthenticated,
    hasHydrated,
    t,
    router,
  ]);

  // DEBUG: Wrap dashboard in try/catch to log rendering errors
  let dashboardContent;
  try {
    dashboardContent = (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MonthSelector />
        {/* Debug components TrpcTestComponent and AutoLoginHelper removed */}
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ textAlign: "center", marginTop: 8 }}>
              {t("sending")}
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              backgroundColor: colors.danger + "33", // Use danger color with 33 alpha for transparency
              borderRadius: 8,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              marginTop: 32,
              marginHorizontal: 16,
            }}
          >
            <AntDesign
              name="warning"
              size={24}
              color={colors.danger}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: colors.danger,
                fontSize: 16,
                flexShrink: 1, // Allow text to wrap
              }}
            >
              {error}
            </Text>
          </View>
        ) : income === 0 ? (
          <EmptyState
            title={t("welcomeToBudget")}
            description={t("startBySettingIncome")}
            buttonText={t("setIncome")}
            onPress={() => setIncomeModalVisible(true)}
          />
        ) : (
          <>
            <View style={styles.header}>
              <BudgetSummary />
              <Pressable
                style={[styles.incomeButton, isRTL && styles.rtlFlexRow]}
                onPress={() => setIncomeModalVisible(true)}
              >
                <AntDesign name="wallet" size={20} color="white" />
                <Text style={[styles.incomeButtonText, { color: "white" }]}>
                  {t("setIncome")}
                </Text>
              </Pressable>
            </View>
            <View style={styles.section}>
              <View
                style={[
                  styles.sectionHeader,
                  isRTL && styles.rtlFlexRowReverse,
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("topCategories")}
                </Text>
                <Pressable onPress={() => router.push("/categories")}>
                  <Text
                    style={[styles.seeAllButton, { color: colors.primary }]}
                  >
                    {t("seeAll")}
                  </Text>
                </Pressable>
              </View>
              {categories.length === 0 ? (
                <View
                  style={[
                    styles.emptyCategories,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyCategoriesText,
                      { color: colors.subtext },
                    ]}
                  >
                    {t("youHaventCreatedCategories")}
                  </Text>
                  <Pressable
                    style={[
                      styles.createCategoryButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => router.push("/categories")}
                  >
                    <Text style={styles.createCategoryButtonText}>
                      {t("createCategories")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {topCategories.map((category, idx) => {
                    // DEBUG: Log each category and its type
                    if (
                      typeof category !== "object" ||
                      category === null ||
                      !category.id
                    ) {
                      console.error(
                        "Invalid category in topCategories:",
                        category,
                        idx
                      );
                    }
                    return (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onPress={() => handleCategoryPress(category.id)}
                      />
                    );
                  })}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    );
  } catch (err) {
    console.error("DASHBOARD RENDER ERROR:", err);
    dashboardContent = (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", fontSize: 16, margin: 20 }}>
          Dashboard render error: {String(err)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {dashboardContent}
      {income > 0 && categories.length > 0 && (
        <View style={styles.fabContainer}>
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => handleAddTransaction()}
          >
            <AntDesign name="plus" size={24} color="white" />
          </Pressable>
        </View>
      )}
      <AddTransactionModal
        visible={transactionModalVisible}
        onClose={async () => {
          setTransactionModalVisible(false);
          setSelectedCategoryId(undefined);
          const [year, month] = selectedMonth.split("-").map(Number);
          fetchTransactionsFromBackend &&
            fetchTransactionsFromBackend(year, month);
          fetchCategoriesFromBackend && fetchCategoriesFromBackend();
          fetchBudgetFromBackend && fetchBudgetFromBackend(year, month); // <-- re-fetch budget after modal
        }}
        categoryId={selectedCategoryId}
      />
      <SetIncomeModal
        visible={incomeModalVisible}
        onClose={() => setIncomeModalVisible(false)}
      />
    </View>
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
  header: {
    marginBottom: 24,
  },
  incomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  rtlFlexRow: {
    flexDirection: "row-reverse",
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  incomeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
    marginRight: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCategories: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyCategoriesText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  createCategoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createCategoryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
});
