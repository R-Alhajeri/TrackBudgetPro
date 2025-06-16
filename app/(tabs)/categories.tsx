import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import CategoryCard from "../../components/CategoryCard";
import AddCategoryModal from "../../components/AddCategoryModal";
import EmptyState from "../../components/EmptyState";
import MonthSelector from "../../components/MonthSelector";
import useBudgetStore from "../../store/budget-store";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import { useRouter } from "expo-router";
import { SubscriptionPaywall } from "../../components/SubscriptionPaywall";
import useSubscriptionStore from "../../store/subscription-store";
import { useProgressiveRestrictions } from "../../hooks/useProgressiveRestrictions";
import {
  BorderRadius,
  Typography,
  Shadows,
  Spacing,
  PressableStates,
} from "../../constants/styleGuide";
import { Plus } from "lucide-react-native";
import { Stack } from "expo-router";

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, income } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isSubscribed, isDemoMode, isGuestMode } = useSubscriptionStore();
  const { getCurrentRestrictions, checkRestriction, trackRestrictionHit } =
    useProgressiveRestrictions();
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);

  // Memoize these calls properly based on the actual dependencies
  const restrictions = useMemo(
    () => getCurrentRestrictions(),
    [isSubscribed, isDemoMode, isGuestMode, categories.length]
  );
  const categoryLimit = restrictions.categoryLimit;
  const categoryCheck = useMemo(
    () => checkRestriction("categoryLimit", categories.length),
    [isSubscribed, isDemoMode, isGuestMode, categories.length]
  );

  // Navigate to category detail screen
  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}` as any);
  };

  // Check if user needs to set income first
  if (!income) {
    return (
      <>
        <Stack.Screen options={{ title: t("categories") }} />
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.centeredContent}>
            <Text style={[styles.message, { color: colors.text }]}>
              {t("setIncomeFirst")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Please set your monthly income to start organizing your budget
              with categories.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.setIncomeButton,
                { backgroundColor: colors.primary },
                pressed && PressableStates.pressed,
              ]}
              onPress={() => {
                router.push("/(tabs)" as any);
              }}
            >
              <Text style={styles.setIncomeText}>{t("setIncome")}</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  if (!isSubscribed && !isDemoMode && !isGuestMode) {
    return <SubscriptionPaywall />;
  }

  // Limit categories in demo mode or guest mode
  const displayedCategories =
    isDemoMode || isGuestMode ? categories.slice(0, 2) : categories;

  return (
    <>
      <Stack.Screen options={{ title: t("categories") }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MonthSelector />

          {displayedCategories.length === 0 ? (
            <EmptyState
              title={t("noCategoriesYet")}
              description={t("createCategories")}
              buttonText={t("addCategory")}
              onPress={() => setAddCategoryModalVisible(true)}
            />
          ) : (
            <View style={styles.categoriesGrid}>
              {displayedCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() => handleCategoryPress(category.id)}
                />
              ))}
              {(isDemoMode || isGuestMode) && (
                <View
                  style={[
                    styles.demoNoticeContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text style={[styles.demoNotice, { color: colors.subtext }]}>
                    📝 {isGuestMode ? "Guest Mode" : "Demo Mode"}: Limited to{" "}
                    {restrictions.categoryLimit}
                    categories.{" "}
                    {isGuestMode
                      ? "Create free account for more categories"
                      : "Upgrade for unlimited categories"}
                    .
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setAddCategoryModalVisible(true)}
          accessibilityLabel={t("addCategory")}
        >
          <Plus size={24} color="#fff" />
        </Pressable>

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
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
  },
  message: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight as any,
    letterSpacing: Typography.title.letterSpacing,
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight as any,
    letterSpacing: Typography.body.letterSpacing,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  setIncomeButton: {
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
    ...Shadows.medium,
  },
  setIncomeText: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight as any,
    letterSpacing: Typography.subtitle.letterSpacing,
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  categoriesGrid: {
    flex: 1,
    gap: Spacing.s,
  },
  demoNoticeContainer: {
    marginTop: Spacing.l,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  demoNotice: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as any,
    letterSpacing: Typography.caption.letterSpacing,
    textAlign: "center",
    lineHeight: 18,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.large,
    elevation: 8,
  },
});
