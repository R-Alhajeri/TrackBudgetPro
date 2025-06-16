import React, { useState, useCallback, useEffect } from "react";
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
  Animated,
} from "react-native";
import { X, Check } from "lucide-react-native";
import useBudgetStore from "../store/budget-store";
import { Currency } from "../types/budget";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "../constants/icons";
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
import useSubscriptionStore from "../store/subscription-store";
import { debounce } from "lodash";
import {
  Typography,
  BorderRadius,
  Shadows,
  Spacing,
  PressableStates,
  InputStyles,
} from "../constants/styleGuide";
import { useMonthContext } from "../store/month-context";
import { useRouter } from "expo-router";
import { UpgradePromptModal } from "./UpgradePromptModal";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoryAdded?: (categoryId: string) => void;
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
  onCategoryAdded,
}) => {
  const {
    addCategory,
    setCategoryMonthlyBudget,
    baseCurrency,
    currencies,
    categories,
  } = useBudgetStore();
  const { activeMonth } = useMonthContext();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isSubscribed, isDemoMode, isGuestMode } = useSubscriptionStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [nameError, setNameError] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDemoLimitMessage, setShowDemoLimitMessage] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { getCurrentRestrictions, checkRestriction, trackRestrictionHit } =
    useProgressiveRestrictions();

  const currencySymbol =
    currencies.find((c: Currency) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  // Debounced validation functions
  const validateName = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setNameError("Category name is required");
        return false;
      }

      if (value.length > 30) {
        setNameError("Category name must be less than 30 characters");
        return false;
      }

      // Check for potentially harmful content
      for (const pattern of HARMFUL_PATTERNS) {
        if (pattern.test(value)) {
          setNameError("Category name contains invalid characters");
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
        setBudgetError("Budget is required");
        return false;
      }

      if (!AMOUNT_REGEX.test(value)) {
        setBudgetError("Please enter a valid amount");
        return false;
      }

      const budgetValue = parseFloat(value);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        setBudgetError("Please enter a valid amount");
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

  const handleSubmit = () => {
    if (!validateInputs()) {
      return;
    }

    // Check if user has reached category limit using progressive restrictions
    const categoryCheck = checkRestriction("categoryLimit", categories.length);
    if (!categoryCheck.allowed) {
      trackRestrictionHit("categoryLimit", categories.length);
      setShowUpgradeModal(true);
      return;
    }

    const budgetValue = parseFloat(budget);
    const categoryId = Date.now().toString();

    // Add the category with default budget
    addCategory({
      name: name.trim(),
      budget: isDefault ? budgetValue : 0, // Set default budget only if isDefault is true
      icon: selectedIcon,
      color: selectedColor,
    });

    // If not default, set the budget for the specific month
    if (!isDefault) {
      setCategoryMonthlyBudget(categoryId, activeMonth, budgetValue);
    }

    // Show success message
    setShowSuccessMessage(true);

    // Animate success message
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Hide success message after delay and close modal
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowSuccessMessage(false);

        // Reset form
        setName("");
        setBudget("");
        setSelectedIcon(CATEGORY_ICONS[0]);
        setSelectedColor(CATEGORY_COLORS[0]);
        setNameError("");
        setBudgetError("");
        setIsDefault(true);

        // Call callback if provided
        if (onCategoryAdded) {
          onCategoryAdded(categoryId);
        }

        onClose();
      });
    }, 1500);
  };

  const getIcon = (iconName: string, color: string) => {
    const iconProps = {
      size: 24,
      color: color,
      strokeWidth: 2,
    };

    switch (iconName) {
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

  const handleClose = () => {
    // Reset form
    setName("");
    setBudget("");
    setSelectedIcon(CATEGORY_ICONS[0]);
    setSelectedColor(CATEGORY_COLORS[0]);
    setNameError("");
    setBudgetError("");
    setIsDefault(true);
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
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {showDemoLimitMessage ? (
            <View style={styles.demoLimitContainer}>
              <Text style={[styles.demoLimitTitle, { color: colors.text }]}>
                {isGuestMode
                  ? "Guest Mode Limit Reached"
                  : "Demo Mode Limit Reached"}
              </Text>
              <Text style={[styles.demoLimitText, { color: colors.subtext }]}>
                You&apos;ve reached the maximum number of categories for your
                current plan.
                {isGuestMode
                  ? " Create a free account to get up to 3 categories, or upgrade to premium"
                  : " Upgrade to premium"}{" "}
                for unlimited categories and all features.
              </Text>
              <View style={styles.demoLimitButtonsContainer}>
                <Pressable
                  style={[
                    styles.demoLimitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    handleClose();
                    if (isGuestMode) {
                      router.push("/signup" as any);
                    } else {
                      router.push("/subscription" as any);
                    }
                  }}
                >
                  <Text style={styles.demoLimitButtonText}>
                    {isGuestMode ? "Sign Up Now" : "Upgrade Now"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.demoLimitSecondaryButton]}
                  onPress={handleClose}
                >
                  <Text
                    style={[
                      styles.demoLimitSecondaryButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Maybe Later
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : showSuccessMessage ? (
            <Animated.View
              style={[
                styles.successContainer,
                { opacity: fadeAnim },
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <View style={styles.successIconContainer}>
                <Check size={24} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.successText,
                  {
                    color: colors.text,
                    fontSize: (Typography.subtitle as any).fontSize,
                    fontWeight: (Typography.subtitle as any).fontWeight,
                    letterSpacing: (Typography.subtitle as any).letterSpacing,
                  },
                ]}
              >
                Category Added Successfully
              </Text>
            </Animated.View>
          ) : (
            <>
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                  isRTL && styles.rtlFlexRowReverse,
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: colors.text,
                      fontSize: (Typography.title as any).fontSize,
                      fontWeight: (Typography.title as any).fontWeight,
                      letterSpacing: (Typography.title as any).letterSpacing,
                    },
                  ]}
                >
                  {t("addCategory")}
                </Text>
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  style={({ pressed }) => pressed && PressableStates.pressed}
                >
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.form}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                      marginTop: 8,
                      fontSize: (Typography.caption as any).fontSize,
                      fontWeight: (Typography.caption as any).fontWeight,
                      letterSpacing: (Typography.caption as any).letterSpacing,
                    },
                  ]}
                >
                  {t("categoryName")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    InputStyles.regular(
                      nameError ? colors.danger : colors.border,
                      colors.inputBackground || colors.card
                    ),
                    {
                      color: colors.text,
                      textAlign: isRTL ? "right" : "left",
                      fontSize: (Typography.body as any).fontSize,
                      fontWeight: (Typography.body as any).fontWeight,
                      letterSpacing: (Typography.body as any).letterSpacing,
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
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.danger,
                        fontSize: (Typography.small as any).fontSize,
                        fontWeight: (Typography.small as any).fontWeight,
                        letterSpacing: (Typography.small as any).letterSpacing,
                      },
                    ]}
                  >
                    {nameError}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.charCount,
                    {
                      color: colors.subtext,
                      fontSize: (Typography.small as any).fontSize,
                      fontWeight: (Typography.small as any).fontWeight,
                      letterSpacing: (Typography.small as any).letterSpacing,
                    },
                  ]}
                >
                  {name.length}/30
                </Text>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                      fontSize: (Typography.caption as any).fontSize,
                      fontWeight: (Typography.caption as any).fontWeight,
                      letterSpacing: (Typography.caption as any).letterSpacing,
                    },
                  ]}
                >
                  {t("monthlyBudget")}
                </Text>
                <View
                  style={[
                    styles.amountInputContainer,
                    InputStyles.regular(
                      budgetError ? colors.danger : colors.border,
                      colors.inputBackground || colors.card
                    ),
                  ]}
                >
                  <Text
                    style={[
                      styles.currencySymbol,
                      {
                        color: budgetError ? colors.danger : colors.text,
                        fontSize: (Typography.subtitle as any).fontSize,
                        fontWeight: (Typography.subtitle as any).fontWeight,
                        letterSpacing: (Typography.subtitle as any)
                          .letterSpacing,
                      },
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
                        fontSize: (Typography.subtitle as any).fontSize,
                        fontWeight: (Typography.subtitle as any).fontWeight,
                        letterSpacing: (Typography.subtitle as any)
                          .letterSpacing,
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
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.danger,
                        fontSize: (Typography.small as any).fontSize,
                        fontWeight: (Typography.small as any).fontWeight,
                        letterSpacing: (Typography.small as any).letterSpacing,
                      },
                    ]}
                  >
                    {budgetError}
                  </Text>
                ) : null}
                <View style={styles.switchContainer}>
                  <Text
                    style={[
                      styles.switchLabel,
                      {
                        color: colors.text,
                        fontSize: (Typography.body as any).fontSize,
                        fontWeight: (Typography.body as any).fontWeight,
                        letterSpacing: (Typography.body as any).letterSpacing,
                      },
                    ]}
                  >
                    {isDefault
                      ? t("setAsDefaultBudget")
                      : t("setForCurrentMonthOnly")}
                  </Text>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{
                      false: colors.border,
                      true: `${colors.primary}80`,
                    }}
                    thumbColor={isDefault ? colors.primary : colors.subtext}
                    ios_backgroundColor={colors.border}
                  />
                </View>
                <Text
                  style={[
                    styles.description,
                    {
                      color: colors.subtext,
                      fontSize: (Typography.caption as any).fontSize,
                      fontWeight: (Typography.caption as any).fontWeight,
                      letterSpacing: (Typography.caption as any).letterSpacing,
                    },
                  ]}
                >
                  {isDefault
                    ? t("defaultBudgetDescription")
                    : t("monthlyBudgetDescription")}
                </Text>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                      fontSize: (Typography.caption as any).fontSize,
                      fontWeight: (Typography.caption as any).fontWeight,
                      letterSpacing: (Typography.caption as any).letterSpacing,
                    },
                  ]}
                >
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
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.text,
                      fontSize: (Typography.caption as any).fontSize,
                      fontWeight: (Typography.caption as any).fontWeight,
                      letterSpacing: (Typography.caption as any).letterSpacing,
                    },
                  ]}
                >
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

                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    Shadows.medium,
                    !name || !budget || nameError || budgetError
                      ? { opacity: 0.6 }
                      : pressed
                      ? PressableStates.pressed
                      : undefined,
                  ]}
                  onPress={handleSubmit}
                  disabled={!name || !budget || !!nameError || !!budgetError}
                  accessibilityLabel="Add category"
                  accessibilityHint="Submit the category details"
                >
                  <Text
                    style={[
                      styles.submitButtonText,
                      {
                        fontSize: (Typography.subtitle as any).fontSize,
                        fontWeight: (Typography.subtitle as any).fontWeight,
                        letterSpacing: (Typography.subtitle as any)
                          .letterSpacing,
                      },
                    ]}
                  >
                    {t("addCategory")}
                  </Text>
                </Pressable>
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="category_limit"
        urgencyLevel="medium"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xLarge,
    borderTopRightRadius: BorderRadius.xLarge,
    paddingHorizontal: Spacing.m,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.m,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.l,
    borderRadius: BorderRadius.large,
    marginVertical: Spacing.xl,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  successText: {
    textAlign: "center",
    fontSize: 16,
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    letterSpacing: 0.1,
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
    borderRadius: 12,
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
    letterSpacing: 0.2,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
    letterSpacing: 0.1,
    opacity: 0.8,
  },
  iconsContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.s,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedColorButton: {
    borderWidth: 2,
  },
  submitButton: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    alignItems: "center",
    marginTop: 0,
    marginBottom: Spacing.xl,
    // Shadow applied directly in component
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  demoLimitContainer: {
    padding: 24,
    alignItems: "center",
  },
  demoLimitTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  demoLimitText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  demoLimitButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  demoLimitButton: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    alignItems: "center",
    marginBottom: 8,
  },
  demoLimitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  demoLimitSecondaryButton: {
    paddingVertical: Spacing.s,
    alignItems: "center",
  },
  demoLimitSecondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AddCategoryModal;
