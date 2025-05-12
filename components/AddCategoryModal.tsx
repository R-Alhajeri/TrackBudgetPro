// IMPORTANT: Ensure your tsconfig.json includes the following for React Native JSX support:
//   "jsx": "react-native"
// in the "compilerOptions" section.

// tsconfig.json must include: "jsx": "react-native" in compilerOptions
// Example:
// {
//   "compilerOptions": {
//     "jsx": "react-native",
//     ...
//   }
// }

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import useBudgetStore from "@/store/budget-store";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/constants/icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { debounce } from "lodash";
import * as budgetApi from "@/lib/budget-api";
import {
  AntDesign,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
  Feather,
  Entypo,
  Ionicons,
  MaterialIcons,
  Foundation,
  SimpleLineIcons,
} from "@expo/vector-icons";

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
}

// Regex for validating numeric input with decimal
const AMOUNT_REGEX = /^\d*\.?\d*$/;

// Regex for detecting potentially harmful content
const HARMFUL_PATTERNS = [
  /<script/i, // Script tags
  /javascript:/i, // JavaScript protocol
  /data:/i, // Data URI scheme
  /onerror=/i, // Event handlers
  /onclick=/i,
  /onload=/i,
  /SELECT.*FROM/i, // SQL injection attempts
  /DROP TABLE/i,
  /DELETE FROM/i,
  /INSERT INTO/i,
  /--/i, // SQL comments
  /[<>]/i, // HTML tags
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    createCategoryInBackend,
    setDefaultCategoryBudgets,
    defaultCategoryBudgets,
    baseCurrency,
    currencies,
    fetchCategoriesFromBackend,
    fetchBudgetFromBackend,
    selectedMonth,
    setBudgetToBackend, // Add this to set the budget
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [nameError, setNameError] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);

  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Debounced validation functions
  const validateName = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setNameError(t("categoryNameRequired"));
        return false;
      }

      if (value.length > 30) {
        setNameError(t("categoryNameTooLong"));
        return false;
      }

      // Check for potentially harmful content
      for (const pattern of HARMFUL_PATTERNS) {
        if (pattern.test(value)) {
          setNameError(t("categoryNameInvalid"));
          return false;
        }
      }

      setNameError("");
      return true;
    }, 300),
    []
  );

  const validateBudget = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setBudgetError(t("budgetRequired"));
        return false;
      }

      if (!AMOUNT_REGEX.test(value)) {
        setBudgetError(t("budgetInvalid"));
        return false;
      }

      const budgetValue = parseFloat(value);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        setBudgetError(t("budgetInvalid"));
        return false;
      }

      setBudgetError("");
      return true;
    }, 300),
    []
  );

  const handleNameChange = (text: string) => {
    setName(text);
    validateName(text);
  };

  const handleBudgetChange = (text: string) => {
    // Only allow numbers and decimal point
    if (text === "" || AMOUNT_REGEX.test(text)) {
      // Prevent multiple decimal points
      if (text.split(".").length <= 2) {
        setBudget(text);
        validateBudget(text);
      }
    }
  };

  const validateInputs = () => {
    // Cancel any pending debounced validations
    validateName.cancel();
    validateBudget.cancel();

    // Run validations immediately
    const isNameValid = validateName.flush();
    const isBudgetValid = validateBudget.flush();

    return isNameValid && isBudgetValid;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      // The budget amount from the input
      const budgetAmount = budget.trim() ? parseFloat(budget) : 0;

      if (!createCategoryInBackend || !setBudgetToBackend) {
        throw new Error("Not implemented");
      }

      // Create the category
      await createCategoryInBackend(name.trim(), selectedColor, selectedIcon);

      // If we have a budget amount, set it for the new category
      if (budgetAmount > 0) {
        // Get current budget data
        const [year, month] = selectedMonth.split("-").map(Number);
        const { income, categories } = useBudgetStore.getState();

        // Get the existing budget for this month
        const existingBudget = await budgetApi.fetchBudget(year, month);
        // Create a variable to store the category budgets
        const categoryBudgets = existingBudget?.categories || {};

        // Find the new category by name (since we just created it)
        const newCat = categories.find((c) => c.name === name.trim());
        if (newCat) {
          // Add the new category budget
          categoryBudgets[newCat.id] = budgetAmount;
          // If set as default, update defaultCategoryBudgets in store
          if (setAsDefault && setDefaultCategoryBudgets) {
            setDefaultCategoryBudgets({
              ...defaultCategoryBudgets,
              [newCat.id]: budgetAmount,
            });
          }
        }

        // Save all budgets including the new one
        await setBudgetToBackend(year, month, income, categoryBudgets);
      }

      // Re-fetch budget data to ensure UI is updated
      const [year, month] = selectedMonth.split("-").map(Number);
      await fetchBudgetFromBackend?.(year, month);

      // Reset form
      setName("");
      setBudget("");
      setSelectedIcon(CATEGORY_ICONS[0]);
      setSelectedColor(CATEGORY_COLORS[0]);
      setNameError("");
      setBudgetError("");
      onClose();
    } catch (e: any) {
      // Handle guest/demo usage limit error
      let errorMsg = t("errorOccurred");
      if (typeof e?.message === "string") {
        try {
          const parsed = JSON.parse(e.message);
          if (parsed.code === "GUEST_LIMIT_REACHED") {
            errorMsg = t("guestLimitReached");
          }
        } catch {}
      }
      setError(errorMsg);
      console.error("Error creating category:", e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string, color: string) => {
    const iconProps = { size: 24, color };
    switch (iconName) {
      case "shopping-bag":
        return <Feather name="shopping-bag" {...iconProps} />;
      case "home":
        return <AntDesign name="home" {...iconProps} />;
      case "car":
        return <FontAwesome name="car" {...iconProps} />;
      case "utensils":
        return <FontAwesome5 name="utensils" {...iconProps} />;
      case "plane":
        return <Feather name="send" {...iconProps} />;
      case "coffee":
        return <Feather name="coffee" {...iconProps} />;
      case "gift":
        return <Feather name="gift" {...iconProps} />;
      case "heart":
        return <AntDesign name="heart" {...iconProps} />;
      case "dollar-sign":
        return <Feather name="dollar-sign" {...iconProps} />;
      case "credit-card":
        return <Feather name="credit-card" {...iconProps} />;
      case "film":
        return <Feather name="film" {...iconProps} />;
      case "book":
        return <Feather name="book" {...iconProps} />;
      case "wifi":
        return <Feather name="wifi" {...iconProps} />;
      case "phone":
        return <Feather name="phone" {...iconProps} />;
      case "briefcase":
        return <Feather name="briefcase" {...iconProps} />;
      case "shopping-cart":
        return <Feather name="shopping-cart" {...iconProps} />;
      case "bus":
        return <FontAwesome name="bus" {...iconProps} />;
      case "train":
        return <FontAwesome name="train" {...iconProps} />;
      case "pill":
        return <MaterialCommunityIcons name="pill" {...iconProps} />;
      case "gamepad":
        return <MaterialCommunityIcons name="gamepad-variant" {...iconProps} />;
      case "star":
        return <Feather name="star" {...iconProps} />;
      case "music":
        return <Feather name="music" {...iconProps} />;
      case "camera":
        return <Feather name="camera" {...iconProps} />;
      case "bicycle":
        return <Feather name="activity" {...iconProps} />;
      case "paw":
        return <Feather name="aperture" {...iconProps} />;
      case "tree":
        return <Feather name="feather" {...iconProps} />;
      case "sun":
        return <Feather name="sun" {...iconProps} />;
      case "moon":
        return <Feather name="moon" {...iconProps} />;
      case "cloud":
        return <Feather name="cloud" {...iconProps} />;
      case "umbrella":
        return <Feather name="umbrella" {...iconProps} />;
      default:
        return <Feather name="shopping-bag" {...iconProps} />;
    }
  };

  const handleClose = () => {
    // Reset form
    setName("");
    setBudget("");
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
    setNameError("");
    setBudgetError("");

    // Re-fetch budget data to ensure UI is updated with correct categories for the month
    const [year, month] = selectedMonth.split("-").map(Number);
    fetchBudgetFromBackend?.(year, month);

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.modalContainer,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        ]}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
                isRTL && styles.rtlFlexRowReverse,
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("addCategory")}
              </Text>
              <Pressable onPress={handleClose} hitSlop={10}>
                <AntDesign name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.form}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("categoryName")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: nameError ? colors.danger : colors.border,
                    color: colors.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g., Groceries, Rent, Entertainment"
                placeholderTextColor={colors.subtext}
                maxLength={30}
                accessibilityLabel="Category name"
              />
              {nameError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {nameError}
                </Text>
              ) : null}
              <Text style={[styles.charCount, { color: colors.subtext }]}>
                {name.length}/30
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>
                {t("monthlyBudget")}
              </Text>
              <View
                style={[
                  styles.amountInputContainer,
                  { borderColor: budgetError ? colors.danger : colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: budgetError ? colors.danger : colors.text },
                  ]}
                >
                  {currencySymbol}
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      color: budgetError ? colors.danger : colors.text,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  value={budget}
                  onChangeText={handleBudgetChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.subtext}
                  maxLength={10}
                  accessibilityLabel="Monthly budget"
                />
              </View>
              {budgetError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {budgetError}
                </Text>
              ) : null}

              <Text style={[styles.label, { color: colors.text }]}>
                {t("icon")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconsContainer}
                accessibilityLabel="Icon selection"
              >
                {CATEGORY_ICONS.map((icon) => (
                  <Pressable
                    key={icon}
                    style={[
                      styles.iconButton,
                      { borderColor: colors.border },
                      selectedIcon === icon && {
                        backgroundColor: `${selectedColor}20`,
                      },
                      selectedIcon === icon && { borderColor: selectedColor },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    accessibilityLabel={`Icon ${icon}`}
                    accessibilityState={{ selected: selectedIcon === icon }}
                  >
                    {getIcon(
                      icon,
                      selectedIcon === icon ? selectedColor : colors.subtext
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>
                {t("color")}
              </Text>
              <View style={styles.colorsContainer}>
                {CATEGORY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.selectedColorButton,
                      selectedColor === color && { borderColor: colors.text },
                    ]}
                    onPress={() => setSelectedColor(color)}
                    accessibilityLabel={`Color ${color}`}
                    accessibilityState={{ selected: selectedColor === color }}
                  />
                ))}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <Switch
                  value={setAsDefault}
                  onValueChange={setSetAsDefault}
                  accessibilityLabel="Set as default category budget"
                />
                <Text style={{ marginLeft: 8, color: colors.text }}>
                  {t("setAsDefaultCategoryBudget")}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  !name || !budget || nameError || budgetError || loading
                    ? { opacity: 0.6 }
                    : undefined,
                ]}
                onPress={handleSubmit}
                disabled={
                  !name || !budget || !!nameError || !!budgetError || loading
                }
                accessibilityLabel="Add category"
                accessibilityHint="Submit the category details"
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>{t("sending")}</Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("addCategory")}
                  </Text>
                )}
              </Pressable>
              {error ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  form: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  currencySymbol: {
    fontSize: 18,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    height: 50,
  },
  iconsContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 24,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 12,
  },
  selectedColorButton: {
    borderWidth: 2,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddCategoryModal;
