import React, { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import CategoryCard from "@/components/CategoryCard";
import AddCategoryModal from "@/components/AddCategoryModal";
import EmptyState from "@/components/EmptyState";
import MonthSelector from "@/components/MonthSelector";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { useRouter } from "expo-router";

export default function CategoriesScreen() {
  const router = useRouter();
  const {
    categories,
    income,
    defaultIncome,
    defaultCategoryBudgets,
    transactions,
    selectedMonth,
    fetchCategoriesFromBackend,
    fetchBudgetFromBackend,
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

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  // Calculate spent for the selected month for each category
  const categoriesWithMonthlySpent = useMemo(() => {
    return categories.map((category) => {
      const monthlySpent = transactions
        .filter(
          (t) =>
            t.categoryId === category.id && t.date.startsWith(selectedMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...category, spent: monthlySpent };
    });
  }, [categories, transactions, selectedMonth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MonthSelector />
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
        ) : income === 0 && defaultIncome > 0 ? (
          <View
            style={[styles.incomeWarning, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.incomeWarningTitle, { color: colors.text }]}>
              {t("usingDefaultIncome")}
            </Text>
            <Text style={[styles.incomeWarningText, { color: colors.subtext }]}>
              {t("overrideForThisMonth")}
            </Text>
          </View>
        ) : categories.length === 0 &&
          Object.keys(defaultCategoryBudgets).length > 0 ? (
          <View
            style={[styles.incomeWarning, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.incomeWarningTitle, { color: colors.text }]}>
              {t("usingDefaultCategoryBudgets")}
            </Text>
            <Text style={[styles.incomeWarningText, { color: colors.subtext }]}>
              {t("overrideForThisMonth")}
            </Text>
          </View>
        ) : income === 0 ? (
          <View
            style={[styles.incomeWarning, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.incomeWarningTitle, { color: colors.text }]}>
              {t("setYourIncomeFirst")}
            </Text>
            <Text style={[styles.incomeWarningText, { color: colors.subtext }]}>
              {t("pleaseSetIncome")}
            </Text>
            <Pressable
              style={[
                styles.incomeWarningButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push("/")}
            >
              <Text style={styles.incomeWarningButtonText}>
                {t("goToDashboard")}
              </Text>
            </Pressable>
          </View>
        ) : categories.length === 0 ? (
          <EmptyState
            title={t("noCategoriesYet")}
            description={t("createBudgetCategories")}
            buttonText={t("addCategory")}
            onPress={() => setModalVisible(true)}
          />
        ) : (
          <>
            {categoriesWithMonthlySpent.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                spent={category.spent}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {income > 0 && (
        <View
          style={[styles.fabContainer, isRTL ? { left: 16 } : { right: 16 }]}
        >
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="white" />
          </Pressable>
        </View>
      )}

      <AddCategoryModal
        visible={modalVisible}
        onClose={async () => {
          setModalVisible(false);
          if (fetchCategoriesFromBackend) await fetchCategoriesFromBackend();
          if (fetchBudgetFromBackend) {
            const [year, month] = selectedMonth.split("-").map(Number);
            await fetchBudgetFromBackend(year, month);
          }
        }}
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
  incomeWarning: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  incomeWarningTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  incomeWarningText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  incomeWarningButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  incomeWarningButtonText: {
    color: "white",
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
