import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Category, Currency } from "../types/budget";
import {
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Plane,
  Coffee,
  Gift,
  Heart,
  DollarSign,
  CreditCard,
  Film,
  Book,
  Wifi,
  Phone,
  Briefcase,
  ShoppingCart,
  Bus,
  Train,
  Pill,
  Gamepad,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import useBudgetStore from "../store/budget-store";
import {
  BorderRadius,
  Shadows,
  Typography,
  PressableStates,
  Spacing,
  CardStyles,
} from "../constants/styleGuide";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

// Updated styles and layout to match the legacy design while preserving technical enhancements.
const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { baseCurrency, currencies, selectedMonth } = useBudgetStore();

  // Get the budget for this specific month if it exists
  const budget =
    category.monthlyBudgets?.[selectedMonth] !== undefined
      ? category.monthlyBudgets[selectedMonth]
      : category.budget;

  const spent = category.spent || 0;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;
  const isOverBudget = remaining < 0;
  const currencySymbol =
    currencies.find((c: Currency) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  const getIcon = () => {
    const iconProps = {
      size: 24,
      color: category.color,
      strokeWidth: 2,
    };

    switch (category.icon) {
      case "shopping-bag":
        return <ShoppingBag {...iconProps} />;
      case "home":
        return <Home {...iconProps} />;
      case "car":
        return <Car {...iconProps} />;
      case "utensils":
        return <Utensils {...iconProps} />;
      case "plane":
        return <Plane {...iconProps} />;
      case "coffee":
        return <Coffee {...iconProps} />;
      case "gift":
        return <Gift {...iconProps} />;
      case "heart":
        return <Heart {...iconProps} />;
      case "dollar-sign":
        return <DollarSign {...iconProps} />;
      case "credit-card":
        return <CreditCard {...iconProps} />;
      case "film":
        return <Film {...iconProps} />;
      case "book":
        return <Book {...iconProps} />;
      case "wifi":
        return <Wifi {...iconProps} />;
      case "phone":
        return <Phone {...iconProps} />;
      case "briefcase":
        return <Briefcase {...iconProps} />;
      case "shopping-cart":
        return <ShoppingCart {...iconProps} />;
      case "bus":
        return <Bus {...iconProps} />;
      case "train":
        return <Train {...iconProps} />;
      case "pill":
        return <Pill {...iconProps} />;
      case "gamepad":
        return <Gamepad {...iconProps} />;
      default:
        return <ShoppingBag {...iconProps} />;
    }
  };

  // Get status color based on percentage spent
  const getStatusColor = () => {
    if (isOverBudget) return colors.danger;
    if (percentage >= 90) return "#FFA500"; // Orange warning color
    if (percentage >= 75) return "#FFC107"; // Amber warning color
    return colors.success;
  };

  const statusColor = getStatusColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        CardStyles.elevated(colors.card),
        {
          borderRadius: 16,
          marginBottom: 12,
        },
        Shadows.medium,
        isOverBudget && {
          borderLeftColor: colors.danger,
          borderLeftWidth: 4,
        },
        pressed && PressableStates.pressed,
      ]}
      onPress={onPress}
      accessibilityLabel={`${category.name} ${t("category")}`}
      accessibilityHint={t("pressToViewTransactions")}
    >
      <View style={[styles.header, isRTL && styles.rtlFlexRowReverse]}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${category.color}15`,
              borderColor: `${category.color}30`,
            },
          ]}
        >
          {getIcon()}
        </View>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              {
                fontSize: (Typography.subtitle as any).fontSize,
                fontWeight: (Typography.subtitle as any).fontWeight,
                lineHeight: (Typography.subtitle as any).lineHeight,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {category.name}
          </Text>
          <Text
            style={[
              styles.percentage,
              { color: statusColor },
              {
                fontSize: (Typography.small as any).fontSize,
                fontWeight: (Typography.small as any).fontWeight,
                lineHeight: (Typography.small as any).lineHeight,
              },
            ]}
          >
            {Math.round(percentage)}% {t("spent")}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            {
              backgroundColor: `${colors.border}50`,
              height: 6,
              borderRadius: 3,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: statusColor,
                height: 6,
                borderRadius: 3,
                shadowColor: statusColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.amountsRow}>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: colors.subtext }]}>
              {t("spent")}
            </Text>
            <Text
              style={[
                styles.spent,
                {
                  color: colors.text,
                  fontSize: (Typography.subtitle as any).fontSize,
                  fontWeight: (Typography.subtitle as any).fontWeight,
                  lineHeight: (Typography.subtitle as any).lineHeight,
                },
              ]}
            >
              {currencySymbol}
              {spent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: colors.subtext }]}>
              {t("budget")}
            </Text>
            <Text
              style={[
                styles.budget,
                { color: colors.text },
                Typography.subtitle,
              ]}
            >
              {currencySymbol}
              {budget.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.remaining,
            {
              color: isOverBudget ? colors.danger : colors.success,
              textAlign: "right",
              fontSize: (Typography.caption as any).fontSize,
              fontWeight: (Typography.caption as any).fontWeight,
              letterSpacing: (Typography.caption as any).letterSpacing,
            },
          ]}
        >
          {isOverBudget ? t("overBy") : t("remaining")}: {currencySymbol}
          {Math.abs(remaining).toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
    width: "100%",
    alignSelf: "center",
    borderRadius: BorderRadius.large,
    overflow: "hidden",
    // Using CardStyles.elevated for actual styling
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
    borderWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  body: {
    marginTop: Spacing.m,
  },
  title: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
    // Using Typography.subtitle for text styling
  },
  percentage: {
    // Typography.small applies here
  },
  progressContainer: {
    marginVertical: Spacing.s,
  },
  progressBackground: {
    height: 8,
    borderRadius: BorderRadius.circle,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.circle,
  },
  amountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  spent: {
    // Using Typography.subtitle for text styling
  },
  budget: {
    // Using Typography.subtitle for text styling
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    marginHorizontal: Spacing.m,
  },
  remaining: {
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
});

export default CategoryCard;
