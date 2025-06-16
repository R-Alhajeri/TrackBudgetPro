import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import useBudgetStore from "../store/budget-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { useMonthContext } from "../store/month-context";
import {
  BorderRadius,
  Shadows,
  Typography,
  PressableStates,
} from "../constants/styleGuide";

const MonthSelector: React.FC = () => {
  const { getFirstIncomeMonth } = useBudgetStore();
  const { activeMonth, setActiveMonth } = useMonthContext();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [lastGeneratedMonth, setLastGeneratedMonth] = useState(activeMonth); // Generate last 12 months for selection, but restrict by first income month if set
  // Use useMemo to prevent regenerating the list on every render
  // Update the lastGeneratedMonth outside of useMemo to avoid calling hooks inside hooks
  useEffect(() => {
    setLastGeneratedMonth(activeMonth);
  }, [activeMonth]);

  // Now generate the list of months without setting state inside it
  const months = useMemo(() => {
    // Define a stable function to generate months
    const generateMonths = () => {
      const currentDate = new Date(); // Use actual current date
      // Format with padStart to ensure correct format
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const today = `${currentDate.getFullYear()}-${month}`;

      // Always use a valid anchor month
      const anchorMonth = activeMonth || today;
      const anchorDate = new Date(anchorMonth + "-01");

      // Get the earliest month with income - this is our strict lower boundary
      const minMonth = getFirstIncomeMonth();

      // Always start with a basic list
      const monthsList = [];

      // Generate months from current month backwards
      // Use a fixed number of iterations
      for (let i = 0; i < 24; i++) {
        // Up to 2 years of history max
        const date = new Date(
          anchorDate.getFullYear(),
          anchorDate.getMonth() - i
        );
        // Use padStart to ensure correct formatting
        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
        const value = `${date.getFullYear()}-${monthStr}`;

        // Check if we should stop generating months
        if (minMonth && value < minMonth) {
          break;
        }

        monthsList.push({
          value,
          label: date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
        });
      }

      // Make sure we always have at least one month
      if (monthsList.length === 0) {
        monthsList.push({
          value: today,
          label: new Date(today + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
        });
      }

      return monthsList;
    };

    // Generate the months list and return it directly
    return generateMonths();
  }, [getFirstIncomeMonth, activeMonth]);

  // Validate active month only on mount
  // This prevents a conditional hook call that could cause the "fewer hooks than expected" error
  useEffect(() => {
    // Always run this logic, removing the conditional to avoid hooks errors
    const monthValues = months.map((m) => m.value);
    if (monthValues.length > 0) {
      // Only update if needed to prevent infinite loops
      if (!monthValues.includes(activeMonth)) {
        setActiveMonth(monthValues[0]);
      }
    }
  }, [months, activeMonth, setActiveMonth]); // Add proper dependencies to avoid React Hook errors

  // Scroll the selected month into view
  useEffect(() => {
    // Always create and clear the timer, never conditionally
    const timer = setTimeout(() => {
      if (scrollViewRef.current && months.length > 0) {
        // Find the index of the active month
        let scrollIndex = 0; // Default to first month
        const selectedIndex = months.findIndex(
          (month) => month.value === activeMonth
        );

        // Only use selectedIndex if it's valid
        if (selectedIndex >= 0) {
          scrollIndex = selectedIndex;
        }

        // Always perform the scroll with the calculated index
        scrollViewRef.current.scrollTo({
          x: scrollIndex * 120, // Adjust based on item width
          animated: true,
        });
      }
    }, 100);

    // Always return a cleanup function
    return () => clearTimeout(timer);
  }, [activeMonth, months.length]);

  // Get the first allowed month (earliest month with income)
  const firstAllowedMonth = getFirstIncomeMonth();

  // Navigate to previous month (older)
  const goToPrevMonth = () => {
    const currentIndex = months.findIndex(
      (month) => month.value === activeMonth
    );
    if (currentIndex < months.length - 1) {
      const newValue = months[currentIndex + 1].value;
      setActiveMonth(newValue);
    }
  };

  // Navigate to next month (newer)
  const goToNextMonth = () => {
    const currentIndex = months.findIndex(
      (month) => month.value === activeMonth
    );
    if (currentIndex > 0) {
      const newValue = months[currentIndex - 1].value;
      setActiveMonth(newValue);
    }
  };

  // Check if navigation buttons should be enabled
  // For 'prev' (older), check that we're not already at the oldest allowed month
  const canGoPrev =
    months.length > 0 &&
    months.findIndex((month) => month.value === activeMonth) <
      months.length - 1;

  // For 'next' (newer), check that we're not already at the newest month
  const canGoNext =
    months.length > 0 &&
    months.findIndex((month) => month.value === activeMonth) > 0;

  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: colors.card,
        marginBottom: 16,
        borderRadius: BorderRadius.large,
        ...Shadows.medium,
      }}
    >
      {/* Previous month button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          {
            backgroundColor: colors.background,
            borderRadius: BorderRadius.circle,
          },
          !canGoPrev && styles.disabledNavButton,
          pressed && canGoPrev && PressableStates.pressed,
          Shadows.small,
        ]}
        onPress={goToPrevMonth}
        disabled={!canGoPrev}
      >
        <ChevronLeft
          size={22}
          color={canGoPrev ? colors.primary : colors.subtext}
          strokeWidth={2.5}
        />
      </Pressable>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.monthsContainer,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        {months.map((month, index) => {
          const isEarliestMonth = index === months.length - 1;
          const isSelected = month.value === activeMonth;
          return (
            <Pressable
              key={month.value}
              style={({ pressed }) => [
                styles.monthItem,
                {
                  backgroundColor: isSelected
                    ? colors.primary + "15"
                    : colors.background,
                },
                isSelected && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "15",
                },
                isEarliestMonth && {
                  borderStyle: "dashed",
                  borderWidth: 1,
                  borderColor: colors.primary + "80",
                },
                pressed && PressableStates.pressed,
                Shadows.subtle,
              ]}
              onPress={() => setActiveMonth(month.value)}
            >
              <Text
                style={[
                  styles.monthText,
                  isSelected
                    ? { color: colors.primary, fontWeight: "700" }
                    : { color: colors.text },
                  isEarliestMonth && {
                    fontWeight: isSelected ? "700" : "500",
                    fontStyle: "italic",
                  },
                  {
                    fontSize: (Typography.subtitle as any).fontSize,
                    fontWeight: (Typography.subtitle as any).fontWeight,
                    lineHeight: (Typography.subtitle as any).lineHeight,
                  },
                ]}
              >
                {month.label}
              </Text>
              {isEarliestMonth && (
                <View style={styles.tooltipContainer}>
                  <Text style={[styles.tooltip, { color: colors.subtext }]}>
                    {t("firstAvailableMonth") || "First available month"}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Next month button */}
      <Pressable
        style={({ pressed }) => [
          styles.navButton,
          {
            backgroundColor: colors.background,
            borderRadius: BorderRadius.circle,
          },
          !canGoNext && styles.disabledNavButton,
          pressed && canGoNext && PressableStates.pressed,
          Shadows.small,
        ]}
        onPress={goToNextMonth}
        disabled={!canGoNext}
      >
        <ChevronRight
          size={22}
          color={canGoNext ? colors.primary : colors.subtext}
          strokeWidth={2.5}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  disabledNavButton: {
    opacity: 0.4,
  },
  monthsContainer: {
    flexGrow: 1,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  monthItem: {
    borderRadius: BorderRadius.medium,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
    minWidth: 120,
    alignItems: "center",
  },
  selectedMonth: {
    borderWidth: 1,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  tooltipContainer: {
    position: "absolute",
    bottom: -22,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    fontSize: 10,
    fontStyle: "italic",
  },
});

export default MonthSelector;
