import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Plus, DollarSign } from "lucide-react-native";
import BudgetSummary from "../../components/BudgetSummary";
import CategoryCard from "../../components/CategoryCard";
import AddTransactionModal from "../../components/AddTransactionModal";
import SetIncomeModal from "../../components/SetIncomeModal";
import EmptyState from "../../components/EmptyState";
import MonthSelector from "../../components/MonthSelector";
import { BannerManager } from "../../components/BannerManager";
import useBudgetStore from "../../store/budget-store";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import { useRouter } from "expo-router";
import { SubscriptionPaywall } from "../../components/SubscriptionPaywall";
import useSubscriptionStore from "../../store/subscription-store";
import { useMonthContext } from "../../store/month-context";
import AddCategoryModal from "../../components/AddCategoryModal";
import {
  Shadows,
  Spacing,
  Typography,
  BorderRadius,
  PressableStates,
} from "../../constants/styleGuide";

export default function DashboardScreen() {
  const router = useRouter();
  const { income, categories, transactions, setSelectedMonth } =
    useBudgetStore();
  const { activeMonth } = useMonthContext();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isSubscribed, isDemoMode, isGuestMode } = useSubscriptionStore();
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);

  const [seeAllScale] = useState(new Animated.Value(1));
  const [plusScale] = useState(new Animated.Value(1));

  const animateScale = (animatedValue: Animated.Value, toValue: number) => {
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handleAddTransaction = (categoryId?: string) => {
    if (!isSubscribed && !isDemoMode) {
      router.push("/subscription" as any);
      return;
    }
    setSelectedCategoryId(categoryId);
    setTransactionModalVisible(true);
  };

  const handleCategoryPress = (categoryId: string) => {
    if (!isSubscribed && !isDemoMode) {
      router.push("/subscription" as any);
      return;
    }
    router.push(`/category/${categoryId}` as any);
  };

  // On first load, default to current month if selectedMonth is not set or is invalid
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!activeMonth || activeMonth.length !== 7) {
      setSelectedMonth(currentMonth);
    }
  }, []);

  // Filter transactions for the selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date.startsWith(activeMonth)
    );
  }, [transactions, activeMonth]);

  // Calculate spent for the selected month for each category
  const categoriesWithMonthlySpent = useMemo(() => {
    return categories.map((category) => {
      const monthlySpent = filteredTransactions
        .filter((t) => t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...category, spent: monthlySpent };
    });
  }, [categories, filteredTransactions]);

  // Show top 3 categories by budget (or 2 in demo mode)
  const topCategories = [...categoriesWithMonthlySpent]
    .sort((a, b) => b.budget - a.budget)
    .slice(0, isDemoMode ? 2 : 3);

  if (!isSubscribed && !isDemoMode) {
    return <SubscriptionPaywall />;
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {income === 0 ? (
            <EmptyState
              title={t("welcomeToBudget")}
              description={t("startBySettingIncome")}
              buttonText={t("setIncome")}
              onPress={() => setIncomeModalVisible(true)}
            />
          ) : (
            <>
              <MonthSelector />

              {/* Consolidated Banner Management */}
              <BannerManager />

              <View style={styles.header}>
                <BudgetSummary />
                <Pressable
                  style={({ pressed }) => [
                    styles.incomeButton,
                    isRTL && styles.rtlFlexRow,
                    { backgroundColor: `${colors.primary}15` },
                    { borderRadius: BorderRadius.medium },
                    pressed && PressableStates.pressed,
                  ]}
                  onPress={() => setIncomeModalVisible(true)}
                >
                  <DollarSign
                    size={18}
                    color={colors.primary}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.incomeButtonText,
                      {
                        color: colors.primary,
                        fontSize: (Typography.subtitle as any).fontSize,
                        fontWeight: (Typography.subtitle as any).fontWeight,
                        letterSpacing: (Typography.subtitle as any)
                          .letterSpacing,
                      },
                    ]}
                  >
                    {t("updateIncome")}
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
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: colors.text,
                        fontSize: (Typography.title as any).fontSize,
                        fontWeight: (Typography.title as any).fontWeight,
                        letterSpacing: (Typography.title as any).letterSpacing,
                      },
                    ]}
                  >
                    {t("topCategories")}
                  </Text>
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: colors.cardElevated,
                      borderRadius: 24,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      shadowColor: colors.primary,
                      shadowOpacity: 0.07,
                      shadowRadius: 6,
                      elevation: 2,
                      alignSelf: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <Animated.View
                      style={{ transform: [{ scale: seeAllScale }] }}
                    >
                      <Pressable
                        onPress={() => router.push("/(tabs)/categories" as any)}
                        onPressIn={() => animateScale(seeAllScale, 0.96)}
                        onPressOut={() => animateScale(seeAllScale, 1)}
                        style={({ pressed }) => [
                          {
                            paddingVertical: 8,
                            paddingHorizontal: 18,
                            borderRadius: 16,
                            backgroundColor: pressed
                              ? String(colors.primary + "10")
                              : "transparent",
                            borderWidth: 1,
                            borderColor: String(colors.primary + "30"),
                            marginRight: isRTL ? 0 : 6,
                            marginLeft: isRTL ? 6 : 0,
                            minWidth: 64,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t("seeAll")}
                      >
                        <Text
                          style={[
                            styles.seeAllButton,
                            {
                              color: colors.primary,
                              fontWeight: "700" as any,
                              fontSize: (Typography.caption as any).fontSize,
                              letterSpacing: (Typography.caption as any)
                                .letterSpacing,
                            },
                          ]}
                        >
                          {t("seeAll")}
                        </Text>
                      </Pressable>
                    </Animated.View>
                    {categories.length > 0 && (
                      <Animated.View
                        style={{ transform: [{ scale: plusScale }] }}
                      >
                        <Pressable
                          onPress={() => setAddCategoryModalVisible(true)}
                          onPressIn={() => animateScale(plusScale, 0.92)}
                          onPressOut={() => animateScale(plusScale, 1)}
                          style={({ pressed }) => [
                            {
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: pressed
                                ? String(colors.cardElevated || "#222")
                                : String(colors.card),
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: isRTL ? 0 : 6,
                              marginRight: isRTL ? 6 : 0,
                              borderWidth: 2,
                              borderColor: String(colors.primary),
                              shadowColor: String(colors.primary),
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                              elevation: 2,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={t("addCategory")}
                          accessibilityHint={t("createCategories")}
                        >
                          <Plus
                            size={20}
                            color={colors.primary}
                            strokeWidth={2.5}
                          />
                        </Pressable>
                      </Animated.View>
                    )}
                  </View>
                </View>
                {categories.length === 0 ? (
                  <View
                    style={[
                      styles.emptyCategories,
                      { backgroundColor: colors.cardElevated },
                      Shadows.small,
                      { borderRadius: BorderRadius.large },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyCategoriesText,
                        {
                          color: colors.subtext,
                          fontSize: (Typography.body as any).fontSize,
                          fontWeight: (Typography.body as any).fontWeight,
                          letterSpacing: (Typography.body as any).letterSpacing,
                        },
                      ]}
                    >
                      {t("youHaventCreatedCategories")}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.createCategoryButton,
                        { backgroundColor: colors.primary },
                        Shadows.medium,
                        { borderRadius: BorderRadius.medium },
                        pressed && PressableStates.pressed,
                      ]}
                      onPress={() => setAddCategoryModalVisible(true)}
                    >
                      <Plus size={18} color="white" />
                      <Text
                        style={[
                          styles.createCategoryButtonText,
                          {
                            fontSize: (Typography.subtitle as any).fontSize,
                            fontWeight: (Typography.subtitle as any).fontWeight,
                            lineHeight: (Typography.subtitle as any).lineHeight,
                          },
                        ]}
                      >
                        {t("createCategories")}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {topCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onPress={() => handleCategoryPress(category.id)}
                      />
                    ))}
                    {isDemoMode && (
                      <Text
                        style={[
                          styles.demoNotice,
                          { color: colors.subtext },
                          {
                            fontSize: (Typography.caption as any).fontSize,
                            fontWeight: (Typography.caption as any).fontWeight,
                            lineHeight: (Typography.caption as any).lineHeight,
                          },
                        ]}
                      >
                        {t("notification")}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </>
          )}
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
          onPress={() => {
            if (!income) {
              setIncomeModalVisible(true);
            } else if (categories.length === 0) {
              setAddCategoryModalVisible(true);
            } else {
              setTransactionModalVisible(true);
            }
          }}
          accessibilityLabel={
            !income
              ? t("setIncome")
              : categories.length === 0
              ? t("addCategory")
              : t("addTransaction")
          }
        >
          <Plus size={32} color="#fff" />
        </Pressable>
        <SetIncomeModal
          visible={incomeModalVisible}
          onClose={() => setIncomeModalVisible(false)}
        />
        <AddTransactionModal
          visible={transactionModalVisible}
          categoryId={selectedCategoryId}
          onClose={() => setTransactionModalVisible(false)}
        />
        <AddCategoryModal
          visible={addCategoryModalVisible}
          onClose={() => setAddCategoryModalVisible(false)}
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
    padding: Spacing.m,
    paddingBottom: Spacing.xxl * 2.5,
  },
  header: {
    marginBottom: Spacing.l,
  },
  incomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.m,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rtlFlexRow: {
    flexDirection: "row-reverse",
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  incomeButtonText: {
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
    // Typography.subtitle is applied in the component
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    // Typography.title is applied in the component
  },
  seeAllButton: {
    textDecorationLine: "underline",
    // Typography.caption is applied in the component
  },
  emptyCategories: {
    padding: Spacing.m,
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  emptyCategoriesText: {
    textAlign: "center",
    marginBottom: Spacing.m,
    // Typography.body is applied in the component
  },
  createCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  createCategoryButtonText: {
    color: "white",
    marginLeft: Spacing.s,
    // Typography.subtitle is applied in the component
  },
  fabContainer: {
    position: "absolute",
    bottom: Spacing.m,
    right: Spacing.m,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.circle / 2,
    justifyContent: "center",
    alignItems: "center",
    ...(Shadows.medium as object),
  },
  demoNotice: {
    textAlign: "center",
    marginTop: Spacing.m,
    fontStyle: "italic",
    // Typography.caption is applied in the component
  },
});
