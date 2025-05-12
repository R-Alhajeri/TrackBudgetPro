import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Category } from "@/types/budget";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
  Feather,
  Entypo,
  AntDesign,
} from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import useBudgetStore from "@/store/budget-store";

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  spent?: number; // Optional override for spent value
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  spent,
}) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { baseCurrency, currencies } = useBudgetStore();
  const percentage =
    category.budget > 0
      ? ((spent !== undefined ? spent : category.spent) / category.budget) * 100
      : 0;
  const remaining =
    category.budget - (spent !== undefined ? spent : category.spent);
  const isOverBudget = remaining < 0;
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  const getIcon = () => {
    const iconProps = {
      size: 24,
      color: category.color,
    };

    switch (category.icon) {
      case "shopping-bag":
        return <FontAwesome5 name="shopping-bag" {...iconProps} />;
      case "home":
        return <AntDesign name="home" {...iconProps} />;
      case "car":
        return <FontAwesome name="car" {...iconProps} />;
      case "utensils":
        return <FontAwesome5 name="utensils" {...iconProps} />;
      case "plane":
        return <FontAwesome name="plane" {...iconProps} />;
      case "coffee":
        return <FontAwesome name="coffee" {...iconProps} />;
      case "gift":
        return <FontAwesome name="gift" {...iconProps} />;
      case "heart":
        return <AntDesign name="hearto" {...iconProps} />;
      case "dollar-sign":
        return <FontAwesome name="dollar" {...iconProps} />;
      case "credit-card":
        return <FontAwesome name="credit-card" {...iconProps} />;
      case "film":
        return <FontAwesome name="film" {...iconProps} />;
      case "book":
        return <FontAwesome name="book" {...iconProps} />;
      case "wifi":
        return <Feather name="wifi" {...iconProps} />;
      case "phone":
        return <Feather name="phone" {...iconProps} />;
      case "briefcase":
        return <Feather name="briefcase" {...iconProps} />;
      case "shopping-cart":
        return <Entypo name="shopping-cart" {...iconProps} />;
      case "bus":
        return <FontAwesome name="bus" {...iconProps} />;
      case "train":
        return <FontAwesome name="train" {...iconProps} />;
      case "pill":
        return <MaterialCommunityIcons name="pill" {...iconProps} />;
      case "gamepad":
        return <FontAwesome name="gamepad" {...iconProps} />;
      default:
        return <FontAwesome5 name="shopping-bag" {...iconProps} />;
    }
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.header, isRTL && styles.rtlFlexRowReverse]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${category.color}20` },
          ]}
        >
          {getIcon()}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {category.name}
          </Text>
          <Text
            style={[
              styles.remaining,
              { color: colors.subtext },
              isOverBudget ? { color: colors.danger } : null,
            ]}
          >
            {isOverBudget ? t("overBy") : t("remaining") + ": "}
            {currencySymbol}
            {Math.abs(remaining).toFixed(2)}
          </Text>
        </View>
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
                backgroundColor: isOverBudget ? colors.danger : category.color,
              },
            ]}
          />
        </View>
        <View style={[styles.budgetInfo, isRTL && styles.rtlFlexRowReverse]}>
          <Text style={[styles.spent, { color: colors.text }]}>
            {currencySymbol}
            {(spent !== undefined ? spent : category.spent).toFixed(2)}
          </Text>
          <Text style={[styles.budget, { color: colors.subtext }]}>
            {t("of")} {currencySymbol}
            {category.budget.toFixed(2)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginLeft: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  remaining: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 4,
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
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  spent: {
    fontSize: 14,
    fontWeight: "500",
  },
  budget: {
    fontSize: 14,
    marginLeft: 4,
    marginRight: 4,
  },
});

export default CategoryCard;
