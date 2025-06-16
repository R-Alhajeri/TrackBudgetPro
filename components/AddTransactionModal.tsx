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
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Camera, TrendingUp, TrendingDown } from "lucide-react-native";
import useBudgetStore from "../store/budget-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { useMonthContext } from "../store/month-context";
import ReceiptScanner from "./ReceiptScanner";
import { debounce } from "lodash";
import { TransactionType, Transaction, Currency } from "../types/budget";
import {
  BorderRadius,
  Typography,
  Shadows,
  Spacing,
  PressableStates,
  InputStyles,
  CardStyles,
} from "../constants/styleGuide";
import useAuthStore from "../store/auth-store";
import useSubscriptionStore from "../store/subscription-store";
import { UpgradePromptModal } from "./UpgradePromptModal";
import { trackEvent } from "../utils/analytics";
import { useProgressiveRestrictions } from "../hooks/useProgressiveRestrictions";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId?: string;
  userId?: string; // <-- add this
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

const validateDescription = (description: string): boolean => {
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(description)) {
      return false;
    }
  }
  return true;
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  categoryId,
  userId, // <-- add this
}) => {
  const { categories, addTransaction, baseCurrency, currencies, transactions } =
    useBudgetStore();
  const { activeMonth } = useMonthContext();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { user } = useAuthStore();
  const { isSubscribed, isDemoMode, isGuestMode } = useSubscriptionStore();
  const { checkRestriction, trackRestrictionHit } =
    useProgressiveRestrictions();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId || ""
  );
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [receiptScannerVisible, setReceiptScannerVisible] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Form validation errors
  const [amountError, setAmountError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Fix currencies typing
  const selectedCurrencySymbol =
    (currencies.find((c: Currency) => c.code === baseCurrency)
      ?.symbol as string) || baseCurrency;

  // Format the selected month for display
  const selectedMonthDate = new Date(activeMonth + "-01");
  const formattedMonth = selectedMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Direct validation function (no debounce) for form submission
  const validateAmountDirectly = (value: string) => {
    if (!value.trim()) {
      setAmountError("Amount is required");
      return false;
    }

    if (!AMOUNT_REGEX.test(value)) {
      setAmountError("Please enter a valid amount");
      return false;
    }

    const amountValue = parseFloat(value);
    if (isNaN(amountValue) || amountValue <= 0) {
      setAmountError("Please enter a valid amount");
      return false;
    }

    setAmountError("");
    return true;
  };

  // Debounced version for input changes
  const validateAmount = useCallback(
    debounce((value: string) => {
      validateAmountDirectly(value);
    }, 300),
    []
  );

  // Direct validation function for form submission
  const validateDescriptionDirectly = (value: string) => {
    if (!value.trim()) {
      setDescriptionError("Description is required");
      return false;
    }

    if (value.length > 100) {
      setDescriptionError("Description must be less than 100 characters");
      return false;
    }

    // Check for potentially harmful content
    for (const pattern of HARMFUL_PATTERNS) {
      if (pattern.test(value)) {
        setDescriptionError("Description contains invalid characters");
        return false;
      }
    }

    setDescriptionError("");
    return true;
  };

  // Debounced version for input changes
  const validateDescription = useCallback(
    debounce((value: string) => {
      validateDescriptionDirectly(value);
    }, 300),
    []
  );

  const validateCategory = useCallback(() => {
    if (!selectedCategoryId && !categoryId) {
      setCategoryError("Please select a category");
      return false;
    }

    setCategoryError("");
    return true;
  }, [selectedCategoryId, categoryId]);

  const validateInputs = () => {
    // Cancel any pending debounced validations
    validateAmount.cancel();
    validateDescription.cancel();

    // Run validations directly instead of using debounced versions
    const isAmountValid = validateAmountDirectly(amount);
    const isDescriptionValid = validateDescriptionDirectly(description);
    const isCategoryValid = validateCategory();

    return isAmountValid && isDescriptionValid && isCategoryValid;
  };

  const handleSubmit = () => {
    // Disable submit button while processing
    setIsSubmitting(true);

    // Check transaction limit for demo/guest mode users
    const transactionLimitCheck = checkRestriction(
      "transactionLimit",
      transactions.length
    );

    if (
      (isDemoMode || isGuestMode) &&
      !isSubscribed &&
      !transactionLimitCheck.allowed
    ) {
      setIsSubmitting(false);

      // Track transaction limit hit for analytics
      trackRestrictionHit("transactionLimit", transactions.length);

      trackEvent("transaction_limit_hit", {
        currentTransactionCount: transactions.length,
        userType: isDemoMode ? "demo" : "guest",
        attemptedAction: "add_transaction",
      });

      setShowUpgradeModal(true);
      return;
    }

    // Validate all inputs
    if (!validateInputs()) {
      setIsSubmitting(false); // Re-enable the button
      Alert.alert(t("error"), t("pleaseFixErrors"), [{ text: "OK" }]);
      return;
    }

    try {
      // Double check values one more time
      if (
        !amount.trim() ||
        !description.trim() ||
        (!selectedCategoryId && !categoryId)
      ) {
        throw new Error("Missing required fields");
      }

      // Sanitize inputs
      const sanitizedDescription = description.trim();
      const sanitizedAmount = parseFloat(amount);
      if (isNaN(sanitizedAmount) || sanitizedAmount <= 0) {
        throw new Error("Invalid amount");
      }

      if (!userId && (!user || !user.id) && !isGuestMode && !isDemoMode) {
        throw new Error("No user is currently logged in");
      }

      // Add required 'date' property for Transaction type
      const transactionData = {
        id: Date.now().toString(), // Generate a unique ID
        userId: userId || user?.id || "guest", // Use guest ID for guest/demo mode
        categoryId: selectedCategoryId || categoryId || "",
        amount: sanitizedAmount,
        description: sanitizedDescription,
        type: transactionType, // Include transaction type
        currency: baseCurrency,
        receiptImage: receiptImage || undefined,
        receiptData: receiptData || undefined,
        date: new Date().toISOString(), // Add required date property
      };

      const transactionId = addTransaction(transactionData);

      // Reset form
      setAmount("");
      setDescription("");
      setSelectedCategoryId(categoryId || "");
      setReceiptImage(null);
      setReceiptData(null);
      setAmountError("");
      setDescriptionError("");
      setCategoryError("");

      // Show success message
      Alert.alert(t("success"), t("addTransaction"), [{ text: "OK" }]);

      onClose();
    } catch (error) {
      console.error("Error adding transaction:", error);

      // Show appropriate error message
      const errorMessage =
        error instanceof Error ? error.message : t("somethingWentWrong");

      Alert.alert(
        t("error"),
        errorMessage === "Missing required fields"
          ? t("pleaseCompleteAllFields")
          : errorMessage === "Invalid amount"
          ? t("pleaseEnterValidAmount")
          : t("somethingWentWrong"),
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptCaptured = (imageUri: string, extractedData?: any) => {
    setReceiptImage(imageUri);
    if (extractedData) {
      setReceiptData(extractedData);
      // Optionally auto-fill transaction details from receipt
      if (extractedData.total) {
        const totalAmount = extractedData.total.toString();
        setAmount(totalAmount);
        validateAmount(totalAmount);
      }
      if (extractedData.merchant) {
        const merchantName = extractedData.merchant;
        setDescription(merchantName);
        validateDescription(merchantName);
      }
    }
    setReceiptScannerVisible(false);
  };

  const handleClose = () => {
    // Reset form
    setAmount("");
    setDescription("");
    setSelectedCategoryId(categoryId || "");
    setReceiptImage(null);
    setReceiptData(null);
    setAmountError("");
    setDescriptionError("");
    setCategoryError("");
    onClose();
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    if (text === "" || AMOUNT_REGEX.test(text)) {
      // Prevent multiple decimal points
      if (text.split(".").length <= 2) {
        // Always set the text first to prevent input issues
        setAmount(text);

        // Clear any existing error when user starts typing
        if (amountError && text.trim().length > 0) {
          setAmountError("");
        }

        // Then validate after a delay
        validateAmount(text);
      }
    }
  };

  const handleDescriptionChange = (text: string): void => {
    // Set the text first to prevent the first character from disappearing
    setDescription(text);

    // Then validate it (this avoids UI issues with validation)
    if (text.trim() === "") {
      setDescriptionError("Description is required");
    } else {
      // Check for potentially harmful content
      let isHarmful = false;
      for (const pattern of HARMFUL_PATTERNS) {
        if (pattern.test(text)) {
          setDescriptionError("Description contains invalid characters");
          isHarmful = true;
          break;
        }
      }

      if (!isHarmful) {
        setDescriptionError("");
      }
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    // Clear the category error immediately when a category is selected
    setCategoryError("");
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
          { backgroundColor: colors.modalOverlay },
        ]}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
              isRTL && styles.rtlFlexRowReverse,
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("addTransaction")}
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) =>
                pressed ? PressableStates.pressed : undefined
              }
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.form}>
            <Text style={[styles.monthIndicator, { color: colors.subtext }]}>
              {t("addTransaction")} {formattedMonth}
            </Text>

            {/* Transaction Type Selector */}
            <View style={styles.transactionTypeContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t(transactionType === "expense" ? "expenses" : "income")}
              </Text>
              <View
                style={[
                  styles.transactionTypeSelector,
                  isRTL && styles.rtlFlexRowReverse,
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.transactionTypeButton,
                    transactionType === "expense" && [
                      styles.transactionTypeButtonActive,
                      {
                        backgroundColor: colors.danger + "20",
                        borderColor: colors.danger,
                      },
                    ],
                    { borderColor: colors.border },
                    pressed && PressableStates.pressed,
                  ]}
                  onPress={() => setTransactionType("expense")}
                >
                  <View
                    style={[
                      styles.transactionTypeButtonContent,
                      isRTL && styles.rtlFlexRowReverse,
                    ]}
                  >
                    <TrendingDown
                      size={20}
                      color={
                        transactionType === "expense"
                          ? colors.danger
                          : colors.subtext
                      }
                    />
                    <Text
                      style={[
                        styles.transactionTypeText,
                        {
                          color:
                            transactionType === "expense"
                              ? colors.danger
                              : colors.text,
                        },
                      ]}
                    >
                      {t("expenses")}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.transactionTypeButton,
                    transactionType === "income" && [
                      styles.transactionTypeButtonActive,
                      {
                        backgroundColor: colors.success + "20",
                        borderColor: colors.success,
                      },
                    ],
                    { borderColor: colors.border },
                    pressed && PressableStates.pressed,
                  ]}
                  onPress={() => setTransactionType("income")}
                >
                  <View
                    style={[
                      styles.transactionTypeButtonContent,
                      isRTL && styles.rtlFlexRowReverse,
                    ]}
                  >
                    <TrendingUp
                      size={20}
                      color={
                        transactionType === "income"
                          ? colors.success
                          : colors.subtext
                      }
                    />
                    <Text
                      style={[
                        styles.transactionTypeText,
                        {
                          color:
                            transactionType === "income"
                              ? colors.success
                              : colors.text,
                        },
                      ]}
                    >
                      {t("income")}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={[styles.amountRow, isRTL && styles.rtlFlexRowReverse]}>
              <View
                style={[
                  styles.amountInputContainer,
                  {
                    borderColor: amountError ? colors.danger : colors.border,
                    flex: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: amountError ? colors.danger : colors.text },
                  ]}
                >
                  {selectedCurrencySymbol}
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      color: amountError ? colors.danger : colors.text,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.subtext}
                  maxLength={10} // Reasonable limit for currency amounts
                  testID="amount-input"
                  accessibilityLabel="Amount input"
                  accessibilityHint="Enter the transaction amount"
                />
              </View>
            </View>
            {amountError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {amountError}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.text }]}>
              {t("description")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: descriptionError ? colors.danger : colors.border,
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder={t("description")}
              placeholderTextColor={colors.subtext}
              maxLength={100} // Limit description length
              testID="description-input"
              accessibilityLabel="Description input"
              accessibilityHint="Enter what this expense was for"
            />
            {descriptionError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {descriptionError}
              </Text>
            ) : null}
            <Text style={[styles.charCount, { color: colors.subtext }]}>
              {description.length}/100
            </Text>

            {!categoryId && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("category")}
                </Text>
                {categoryError ? (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {categoryError}
                  </Text>
                ) : null}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesContainer}
                  accessibilityLabel="Categories"
                >
                  {categories.map((category: any) => (
                    <Pressable
                      key={category.id}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                        selectedCategoryId === category.id && {
                          backgroundColor: `${category.color}20`,
                          borderColor: category.color,
                        },
                        pressed && PressableStates.pressed,
                      ]}
                      onPress={() => handleCategorySelect(category.id)}
                      testID={`category-${category.id}`}
                      accessibilityLabel={`Category ${category.name}`}
                      accessibilityState={{
                        selected: selectedCategoryId === category.id,
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: colors.text },
                          selectedCategoryId === category.id && {
                            color: category.color,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.receiptSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("receipt")}
              </Text>

              {receiptImage ? (
                <View
                  style={[
                    styles.receiptPreview,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.receiptPreviewText, { color: colors.text }]}
                  >
                    {t("receipt")}
                  </Text>
                  <Pressable
                    style={[
                      styles.receiptChangeButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setReceiptScannerVisible(true)}
                    testID="change-receipt-button"
                    accessibilityLabel="Change receipt"
                  >
                    <Text style={styles.receiptChangeButtonText}>
                      {t("scanReceipt")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View
                  style={[
                    styles.scanButtonContainer,
                    isRTL && styles.rtlFlexRowReverse,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.scanButton,
                      {
                        borderColor: colors.primary,
                        backgroundColor: `${colors.primary}10`,
                        borderWidth: 1,
                        borderStyle: "dashed",
                      },
                      pressed && {
                        backgroundColor: `${colors.primary}20`,
                        transform: [{ scale: 0.98 }],
                      },
                    ]}
                    onPress={() => setReceiptScannerVisible(true)}
                    testID="scan-receipt-button"
                    accessibilityLabel="Scan receipt"
                  >
                    <Camera size={22} color={colors.primary} />
                    <Text
                      style={[
                        styles.scanButtonText,
                        {
                          color: colors.primary,
                          fontWeight: "500",
                          marginLeft: 8,
                        },
                      ]}
                    >
                      {t("scanReceipt")}
                    </Text>
                  </Pressable>
                  <Text
                    style={[
                      styles.comingFeatureText,
                      { color: colors.subtext },
                    ]}
                  >
                    {t("aiPoweredScan")}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.submitButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: colors.primary },
                (isSubmitting ||
                  !amount.trim() ||
                  !description.trim() ||
                  (!selectedCategoryId && !categoryId)) && { opacity: 0.6 },
                pressed &&
                  !isSubmitting &&
                  amount.trim() &&
                  description.trim() &&
                  (selectedCategoryId || categoryId) &&
                  PressableStates.pressed,
              ]}
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                !amount.trim() ||
                !description.trim() ||
                (!selectedCategoryId && !categoryId)
              }
              testID="add-transaction-button"
              accessibilityLabel="Add transaction"
              accessibilityHint="Submit the transaction details"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("addTransaction")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Render ReceiptScanner when requested */}
      {receiptScannerVisible && (
        <Modal
          visible={receiptScannerVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setReceiptScannerVisible(false)}
        >
          <View style={{ flex: 1 }}>
            <ReceiptScanner onClose={() => setReceiptScannerVisible(false)} />
          </View>
        </Modal>
      )}

      {/* Upgrade Prompt Modal for transaction limits */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="transaction_limit"
        urgencyLevel="high"
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
    paddingHorizontal: Spacing.l,
    paddingBottom: Platform.OS === "ios" ? Spacing.xxl : Spacing.l,
    maxHeight: "80%",
    ...(Shadows.large as object),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    ...(Typography.title as object),
  },
  monthIndicator: {
    ...(Typography.caption as object),
    fontStyle: "italic",
    marginBottom: Spacing.m,
    textAlign: "center",
  },
  form: {
    marginTop: Spacing.m,
    flexGrow: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  label: {
    ...(Typography.subtitle as object),
    marginBottom: Spacing.s,
    marginTop: Spacing.m,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.m,
    height: 50,
    ...(Shadows.small as object),
  },
  currencySymbol: {
    fontSize: 18,
    marginRight: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    height: 50,
  },
  errorText: {
    ...(Typography.small as object),
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    marginBottom: Spacing.s,
  },
  charCount: {
    ...(Typography.small as object),
    alignSelf: "flex-end",
    marginTop: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc", // fallback, can be replaced with colors.border if available
    backgroundColor: "#fff", // fallback, can be replaced with colors.inputBackground if available
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    marginTop: Spacing.s,
    marginBottom: Spacing.xl,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginRight: Spacing.s,
    ...(Shadows.small as object),
  },
  categoryChipText: {
    ...(Typography.caption as object),
  },
  receiptSection: {
    marginTop: Spacing.s,
    marginBottom: Spacing.m,
  },
  scanButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.s,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: BorderRadius.large,
    borderStyle: "dashed",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    marginRight: Spacing.m,
    ...(Shadows.medium as object),
  },
  scanButtonText: {
    ...(Typography.body as object),
    marginLeft: Spacing.s,
    fontWeight: "500",
  },
  comingFeatureText: {
    ...(Typography.small as object),
    fontStyle: "italic",
  },
  receiptPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    marginTop: Spacing.s,
    ...(Shadows.small as object),
  },
  receiptPreviewText: {
    ...(Typography.caption as object),
  },
  receiptChangeButton: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
    ...(Shadows.small as object),
  },
  receiptChangeButtonText: {
    color: "white",
    ...(Typography.small as object),
    fontWeight: "500",
  },
  submitButtonContainer: {
    paddingTop: Spacing.m,
  },
  submitButton: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    alignItems: "center",
    ...(Shadows.medium as object),
  },
  submitButtonText: {
    color: "white",
    ...(Typography.subtitle as object),
  },
  transactionTypeContainer: {
    marginTop: Spacing.m,
    marginBottom: Spacing.m,
  },
  transactionTypeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.s,
  },
  transactionTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    marginHorizontal: Spacing.xs,
    ...(Shadows.small as object),
  },
  transactionTypeButtonActive: {
    borderWidth: 2,
  },
  transactionTypeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionTypeText: {
    ...(Typography.subtitle as object),
    marginLeft: Spacing.s,
  },
});

export default AddTransactionModal;
