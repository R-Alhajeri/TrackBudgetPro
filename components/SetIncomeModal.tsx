import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { Currency } from "../types/budget";
import useBudgetStore from "../store/budget-store";
import { useMonthContext } from "../store/month-context";
import {
  BorderRadius,
  Shadows,
  Spacing,
  Typography,
} from "../constants/styleGuide";

interface SetIncomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const SetIncomeModal: React.FC<SetIncomeModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { income, setIncome, setMonthlyIncome, baseCurrency, currencies } =
    useBudgetStore();
  const { activeMonth } = useMonthContext();
  const [incomeValue, setIncomeValue] = useState(income.toString());
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currencySymbol =
    currencies.find((c: Currency) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  const validateIncome = (value: string) => {
    if (!value.trim()) {
      setError(t("invalidIncome"));
      return false;
    }
    const incomeVal = parseFloat(value);
    if (isNaN(incomeVal) || incomeVal <= 0) {
      setError(t("invalidAmount"));
      return false;
    }
    setError("");
    return true;
  };

  const handleIncomeChange = (text: string) => {
    setIncomeValue(text);
    validateIncome(text);
  };

  // Determine if this is the first time setting income
  const isFirstTime = income === 0;

  const handleSave = () => {
    if (!validateIncome(incomeValue)) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (isFirstTime || isDefault) {
        setIncome(Number(incomeValue));
      } else {
        setMonthlyIncome(activeMonth, Number(incomeValue));
      }
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Error setting income:", error);
      Alert.alert(t("error"), t("somethingWentWrong"), [{ text: "OK" }]);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View style={[styles.headerRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("setIncome")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
              accessibilityLabel={t("close")}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.contentContainer}>
            <Text style={styles.inputLabel}>{t("income")}</Text>
            <View style={styles.inputRow}>
              <View style={styles.currencyBox}>
                <Text style={styles.currencyText}>{currencySymbol}</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: error ? colors.danger : colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={incomeValue}
                onChangeText={handleIncomeChange}
                placeholder={t("amount")}
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                maxLength={10}
                testID="income-input"
                accessibilityLabel="Monthly income input"
                accessibilityHint="Enter your monthly income here"
              />
            </View>
            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}
            {isFirstTime && (
              <View style={styles.helperRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.subtext}
                  style={{ marginRight: 4, marginTop: 2 }}
                />
                <Text style={styles.helperText}>
                  {t("defaultIncomeDescription")}
                </Text>
              </View>
            )}
            {!isFirstTime && (
              <View style={styles.optionsRow}>
                <Pressable
                  style={[
                    styles.optionButton,
                    isDefault && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "20",
                    },
                  ]}
                  onPress={() => setIsDefault(true)}
                  accessibilityLabel={t("default")}
                  accessibilityState={{ selected: isDefault }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isDefault ? colors.primary : colors.text },
                    ]}
                  >
                    {t("default")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.optionButton,
                    !isDefault && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "20",
                    },
                  ]}
                  onPress={() => setIsDefault(false)}
                  accessibilityLabel={t("thisMonthOnly")}
                  accessibilityState={{ selected: !isDefault }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: !isDefault ? colors.primary : colors.text },
                    ]}
                  >
                    {t("thisMonthOnly")}
                  </Text>
                </Pressable>
              </View>
            )}
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                (isSubmitting || !!error || !incomeValue.trim()) && {
                  opacity: 0.6,
                },
              ]}
              onPress={handleSave}
              disabled={isSubmitting || !!error || !incomeValue.trim()}
              testID="submit-income-button"
              accessibilityLabel={t("save")}
              accessibilityHint="Save your monthly income"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveButtonText}>{t("save")}</Text>
                </>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xLarge,
    borderTopRightRadius: BorderRadius.xLarge,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.m,
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: "#222",
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: Spacing.l,
  },
  contentContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    color: "#fff", // Make the label white in dark mode
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
    marginLeft: 2,
    letterSpacing: 0.2,
    opacity: 0.95,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(129,140,248,0.08)", // slightly lighter for more depth
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginBottom: Spacing.s,
    marginTop: 4,
    paddingHorizontal: 0,
    height: 52,
    // subtle shadow for depth
    shadowColor: "#007AFF",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden", // Prevent blue border overflow on the right
  },
  currencyBox: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderTopLeftRadius: BorderRadius.large,
    borderBottomLeftRadius: BorderRadius.large,
    backgroundColor: "rgba(129,140,248,0.08)", // subtle indigo tint
    borderRightWidth: 1,
    borderRightColor: "#007AFF",
  },
  currencyText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#007AFF",
    letterSpacing: 0.3,
  },
  input: {
    flex: 1,
    color: "#222",
    fontSize: 18,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 16,
    height: 52,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.s,
    marginBottom: Spacing.m,
  },
  helperText: {
    fontWeight: "400",
    letterSpacing: 0.1,
    color: "#888",
    flex: 1,
    fontSize: 13,
  },
  optionsRow: {
    flexDirection: "row",
    marginTop: Spacing.m,
    marginBottom: Spacing.s,
    gap: 8,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "transparent",
    borderRadius: BorderRadius.medium,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.m + 2,
    marginTop: Spacing.m,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});

export default SetIncomeModal;
