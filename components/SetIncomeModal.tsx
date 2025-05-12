import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { debounce } from "lodash";

interface SetIncomeModalProps {
  visible: boolean;
  onClose: () => void;
}

// Regex for validating numeric input with decimal
const AMOUNT_REGEX = /^\d*\.?\d*$/;

const SetIncomeModal: React.FC<SetIncomeModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    income,
    setIncome,
    setDefaultIncome,
    baseCurrency,
    currencies,
    fetchBudgetFromBackend,
    selectedMonth,
    setBudgetToBackend,
  } = useBudgetStore();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [amount, setAmount] = useState(income.toString());
  const [amountError, setAmountError] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  // Debounced validation function
  const validateAmount = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setAmountError("Income amount is required");
        return false;
      }

      if (!AMOUNT_REGEX.test(value)) {
        setAmountError("Please enter a valid amount");
        return false;
      }

      const amountValue = parseFloat(value);
      if (isNaN(amountValue) || amountValue < 0) {
        setAmountError("Please enter a valid amount");
        return false;
      }

      setAmountError("");
      return true;
    }, 300),
    []
  );

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

  const handleSubmit = async () => {
    // Cancel any pending debounced validations
    validateAmount.cancel();

    // Run validation immediately
    if (!validateAmount.flush()) {
      return;
    }

    const newIncome = parseFloat(amount);

    // Update local state
    setIncome(newIncome);

    // Save to backend
    if (setAsDefault && setDefaultIncome) {
      setDefaultIncome(newIncome);
    }

    if (setBudgetToBackend) {
      const [year, month] = selectedMonth.split("-").map(Number);

      // Get current categories with their budget amounts
      const { categories } = useBudgetStore.getState();
      const categoryBudgets: Record<string, number> = {};

      // Create a record of category IDs to budget amounts
      categories.forEach((category) => {
        categoryBudgets[category.id] = category.budget;
      });

      // Save income and categories to backend
      await setBudgetToBackend(year, month, newIncome, categoryBudgets);

      // Re-fetch budget data to ensure UI is updated
      await fetchBudgetFromBackend?.(year, month);
    }

    onClose();
  };

  const handleClose = () => {
    // Reset to current income
    setAmount(income.toString());
    setAmountError("");

    // Re-fetch budget data to ensure UI is updated
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
              {t("setIncome")}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <AntDesign name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("income")}
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                { borderColor: amountError ? colors.danger : colors.border },
              ]}
            >
              <Text
                style={[
                  styles.currencySymbol,
                  { color: amountError ? colors.danger : colors.text },
                ]}
              >
                {currencySymbol}
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
                autoFocus
                maxLength={10}
                accessibilityLabel="Income amount"
              />
            </View>
            {amountError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {amountError}
              </Text>
            ) : null}

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
                accessibilityLabel="Set as default income"
              />
              <Text style={{ marginLeft: 8, color: colors.text }}>
                {t("setAsDefaultIncome")}
              </Text>
            </View>

            <Text style={[styles.description, { color: colors.subtext }]}>
              {t("startBySettingIncome")}
            </Text>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (!amount || !!amountError) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={!amount || !!amountError}
              accessibilityLabel="Save income"
              accessibilityHint="Set your monthly income"
            >
              <Text style={styles.submitButtonText}>{t("save")}</Text>
            </Pressable>
          </View>
        </View>
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SetIncomeModal;
