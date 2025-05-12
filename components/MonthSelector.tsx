import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { debounce, throttle } from "lodash";

const MonthSelector: React.FC = () => {
  const { selectedMonth, setSelectedMonth, fetchBudgetFromBackend } =
    useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL, language } = useLanguageStore();

  // Throttle backend fetch to avoid rate limit spikes
  const throttledFetchBudget = React.useMemo(
    () => throttle((year, month) => fetchBudgetFromBackend?.(year, month), 500),
    [fetchBudgetFromBackend]
  );

  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-").map(Number);
      throttledFetchBudget(year, month);
    }
    return () => {
      throttledFetchBudget.cancel();
    };
  }, [selectedMonth, throttledFetchBudget]);

  // Generate last 12 months for selection
  const getMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i
      );
      const value = date.toISOString().slice(0, 7); // Format: YYYY-MM
      // Format label using the same locale as BudgetSummary
      const label = new Date(
        Number(value.split("-")[0]),
        Number(value.split("-")[1]) - 1,
        1
      ).toLocaleString(language === "ar" ? "ar" : "en", {
        month: "long",
        year: "numeric",
      });
      months.push({ value, label });
    }
    return months;
  };

  const months = getMonths();
  const selectedMonthIndex = months.findIndex((m) => m.value === selectedMonth);
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);

  const handlePrevious = () => {
    const newIndex = Math.min(selectedMonthIndex + 1, months.length - 1);
    setSelectedMonth(months[newIndex].value);
    scrollViewRef?.scrollTo({ x: newIndex * 100, animated: true });
  };

  const handleNext = () => {
    const newIndex = Math.max(selectedMonthIndex - 1, 0);
    setSelectedMonth(months[newIndex].value);
    scrollViewRef?.scrollTo({ x: newIndex * 100, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Pressable
        style={[styles.navButton, { backgroundColor: colors.border }]}
        onPress={handlePrevious}
        disabled={selectedMonthIndex === months.length - 1}
      >
        {isRTL ? (
          <AntDesign
            name="right"
            size={20}
            color={
              selectedMonthIndex === months.length - 1
                ? colors.subtext
                : colors.text
            }
          />
        ) : (
          <AntDesign
            name="left"
            size={20}
            color={
              selectedMonthIndex === months.length - 1
                ? colors.subtext
                : colors.text
            }
          />
        )}
      </Pressable>

      <ScrollView
        ref={(ref) => setScrollViewRef(ref)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthsContainer}
        style={styles.scrollView}
        snapToInterval={100}
        decelerationRate="fast"
      >
        {months.map((month, index) => (
          <Pressable
            key={month.value}
            style={[
              styles.monthItem,
              selectedMonthIndex === index && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setSelectedMonth(month.value)}
          >
            <Text
              style={[
                styles.monthText,
                selectedMonthIndex === index
                  ? { color: "white" }
                  : { color: colors.text },
              ]}
            >
              {month.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.navButton, { backgroundColor: colors.border }]}
        onPress={handleNext}
        disabled={selectedMonthIndex === 0}
      >
        {isRTL ? (
          <AntDesign
            name="left"
            size={20}
            color={selectedMonthIndex === 0 ? colors.subtext : colors.text}
          />
        ) : (
          <AntDesign
            name="right"
            size={20}
            color={selectedMonthIndex === 0 ? colors.subtext : colors.text}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 8,
  },
  monthsContainer: {
    paddingRight: 50, // Extra padding to ensure last item is visible
  },
  monthItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 100,
    alignItems: "center",
  },
  monthText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default MonthSelector;
