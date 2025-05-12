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
  Alert,
  ActivityIndicator,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { debounce } from "lodash";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

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

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<
    "feature" | "bug" | "general"
  >("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Debounced validation function
  const validateFeedback = useCallback(
    debounce((value: string) => {
      if (!value.trim()) {
        setFeedbackError(t("pleaseEnterYourFeedback"));
        return false;
      }

      // Check for potentially harmful content
      for (const pattern of HARMFUL_PATTERNS) {
        if (pattern.test(value)) {
          setFeedbackError(t("feedbackContainsInvalidContent"));
          return false;
        }
      }

      setFeedbackError("");
      return true;
    }, 300),
    [t]
  );

  const handleFeedbackChange = (text: string) => {
    setFeedback(text);
    validateFeedback(text);
  };

  const handleSubmit = () => {
    // Cancel any pending debounced validations
    validateFeedback.cancel();

    // Run validation immediately
    if (!validateFeedback.flush()) {
      return;
    }

    setIsSubmitting(true);

    // In a real app, you would send this to your backend
    // For now, we'll just simulate a submission
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(t("thankYou"), t("feedbackSubmitted"), [
        {
          text: "OK",
          onPress: () => {
            setFeedback("");
            setFeedbackType("general");
            setFeedbackError("");
            onClose();
          },
        },
      ]);
    }, 1000);
  };

  const handleClose = () => {
    setFeedback("");
    setFeedbackType("general");
    setFeedbackError("");
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
              isRTL && styles.modalHeaderRTL,
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("sendFeedback")}
            </Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <AntDesign name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("feedbackType")}
            </Text>
            <View
              style={[styles.typeContainer, isRTL && styles.typeContainerRTL]}
            >
              <Pressable
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  feedbackType === "feature" && {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setFeedbackType("feature")}
                testID="feature-button"
                accessibilityLabel="Feature request"
                accessibilityState={{ selected: feedbackType === "feature" }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.text },
                    feedbackType === "feature" && { color: colors.primary },
                  ]}
                >
                  {t("featureRequest")}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  feedbackType === "bug" && {
                    backgroundColor: `${colors.danger}20`,
                    borderColor: colors.danger,
                  },
                ]}
                onPress={() => setFeedbackType("bug")}
                testID="bug-button"
                accessibilityLabel="Report bug"
                accessibilityState={{ selected: feedbackType === "bug" }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.text },
                    feedbackType === "bug" && { color: colors.danger },
                  ]}
                >
                  {t("reportBug")}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  feedbackType === "general" && {
                    backgroundColor: `${colors.info}20`,
                    borderColor: colors.info,
                  },
                ]}
                onPress={() => setFeedbackType("general")}
                testID="general-button"
                accessibilityLabel="General feedback"
                accessibilityState={{ selected: feedbackType === "general" }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.text },
                    feedbackType === "general" && { color: colors.info },
                  ]}
                >
                  {t("general")}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>
              {t("yourFeedback")}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  borderColor: feedbackError ? colors.danger : colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              value={feedback}
              onChangeText={handleFeedbackChange}
              placeholder={
                feedbackType === "feature"
                  ? t("describeFeature")
                  : feedbackType === "bug"
                  ? t("describeIssue")
                  : t("shareThoughts")
              }
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000} // Limit feedback length
              testID="feedback-input"
              accessibilityLabel="Feedback input"
              accessibilityHint="Enter your feedback here"
            />
            {feedbackError ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {feedbackError}
              </Text>
            ) : null}

            <Text style={[styles.charCount, { color: colors.subtext }]}>
              {feedback.length}/1000
            </Text>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (isSubmitting || !feedback.trim()) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              testID="submit-feedback-button"
              accessibilityLabel="Submit feedback"
              accessibilityHint="Send your feedback"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather
                    name="send"
                    size={18}
                    color="white"
                    style={styles.submitIcon}
                  />
                  <Text style={styles.submitButtonText}>
                    {t("sendFeedback")}
                  </Text>
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
  modalHeaderRTL: {
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
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeContainerRTL: {
    flexDirection: "row-reverse",
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    marginTop: 8,
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
  submitButton: {
    flexDirection: "row",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FeedbackModal;
