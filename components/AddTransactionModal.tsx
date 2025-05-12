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
import { AntDesign, Feather } from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import ReceiptScanner from "./ReceiptScanner";
import { debounce } from "lodash";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId?: string;
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

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  categoryId,
}) => {
  const {
    categories,
    createTransactionInBackend,
    baseCurrency,
    currencies,
    selectedMonth,
    fetchBudgetFromBackend, // Add this to re-fetch budget after creating transaction
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryId || ""
  );
  const [receiptScannerVisible, setReceiptScannerVisible] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form validation errors
  const [amountError, setAmountError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const selectedCurrencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Format the selected month for display
  const selectedMonthDate = new Date(selectedMonth + "-01");
  const formattedMonth = selectedMonthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Debounced validation functions to avoid excessive validation during typing
  const validateAmount = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setAmountError(t("amountRequired"));
        return false;
      }

      if (!AMOUNT_REGEX.test(value)) {
        setAmountError(t("budgetInvalid"));
        return false;
      }

      const amountValue = parseFloat(value);
      if (isNaN(amountValue) || amountValue <= 0) {
        setAmountError(t("budgetInvalid"));
        return false;
      }

      setAmountError("");
      return true;
    }, 300),
    [t]
  );

  const validateDescription = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setDescriptionError(t("descriptionRequired"));
        return false;
      }

      if (value.length > 100) {
        setDescriptionError(t("descriptionTooLong"));
        return false;
      }

      // Check for potentially harmful content
      for (const pattern of HARMFUL_PATTERNS) {
        if (pattern.test(value)) {
          setDescriptionError(t("descriptionInvalid"));
          return false;
        }
      }

      setDescriptionError("");
      return true;
    }, 300),
    [t]
  );

  const validateCategory = useCallback(() => {
    if (!selectedCategoryId && !categoryId) {
      setCategoryError(t("categoryRequired"));
      return false;
    }

    setCategoryError("");
    return true;
  }, [selectedCategoryId, categoryId, t]);

  const validateInputs = () => {
    // Cancel any pending debounced validations
    validateAmount.cancel();
    validateDescription.cancel();

    // Run validations immediately
    const isAmountValid = validateAmount.flush();
    const isDescriptionValid = validateDescription.flush();
    const isCategoryValid = validateCategory();

    return isAmountValid && isDescriptionValid && isCategoryValid;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (!createTransactionInBackend) throw new Error("Not implemented");
      const sanitizedDescription = description.trim();
      const sanitizedAmount = parseFloat(amount);
      const year = Number(selectedMonth.split("-")[0]);
      const month = Number(selectedMonth.split("-")[1]);
      await createTransactionInBackend(
        {
          categoryId: selectedCategoryId || categoryId || "",
          amount: sanitizedAmount,
          description: sanitizedDescription,
          currency: baseCurrency,
          receiptImage: receiptImage || undefined,
          receiptData: receiptData || undefined,
          date: new Date().toISOString(),
        },
        year,
        month
      );
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
      setSubmitError(errorMsg);
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

    // Re-fetch budget data when closing the modal to ensure UI is updated
    const [year, month] = selectedMonth.split("-").map(Number);
    fetchBudgetFromBackend?.(year, month);

    onClose();
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    if (text === "" || AMOUNT_REGEX.test(text)) {
      // Prevent multiple decimal points
      if (text.split(".").length <= 2) {
        setAmount(text);
        validateAmount(text);
      }
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    validateDescription(text);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    validateCategory();
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
            <Pressable onPress={handleClose} hitSlop={10}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.form}>
            <Text style={[styles.monthIndicator, { color: colors.subtext }]}>
              {t("addingToMonth").replace("{month}", formattedMonth)}
            </Text>
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
                  placeholder={t("amountPlaceholder")}
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
              placeholder={t("whatWasThisExpenseFor")}
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
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        { borderColor: colors.border },
                        selectedCategoryId === category.id && {
                          backgroundColor: `${category.color}20`,
                        },
                        selectedCategoryId === category.id && {
                          borderColor: category.color,
                        },
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
                    {t("receiptCaptured")}
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
                      {t("changeReceipt")}
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
                    style={[styles.scanButton, { borderColor: colors.border }]}
                    onPress={() => setReceiptScannerVisible(true)}
                    testID="scan-receipt-button"
                    accessibilityLabel="Scan receipt"
                  >
                    <Feather name="camera" size={20} color={colors.primary} />
                    <Text
                      style={[styles.scanButtonText, { color: colors.text }]}
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
                    Coming Feature!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.submitButtonContainer}>
            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                !amount ||
                !description ||
                amountError ||
                descriptionError ||
                categoryError ||
                isSubmitting
                  ? { opacity: 0.6 }
                  : undefined,
              ]}
              onPress={handleSubmit}
              disabled={
                !amount ||
                !description ||
                !!amountError ||
                !!descriptionError ||
                !!categoryError ||
                isSubmitting
              }
              accessibilityLabel="Add transaction"
              accessibilityHint="Submit the transaction details"
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>{t("sending")}</Text>
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("addTransaction")}
                </Text>
              )}
            </Pressable>
            {submitError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {submitError}
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReceiptScanner
        visible={receiptScannerVisible}
        onClose={() => setReceiptScannerVisible(false)}
        onCapture={handleReceiptCaptured}
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
  monthIndicator: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  form: {
    marginTop: 16,
    flexGrow: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
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
    marginLeft: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    height: 50,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 24,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
  },
  receiptSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  scanButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 16,
    marginRight: 12,
  },
  scanButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  comingFeatureText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  receiptPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  receiptPreviewText: {
    fontSize: 14,
  },
  receiptChangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  receiptChangeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  submitButtonContainer: {
    paddingTop: 16,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddTransactionModal;
