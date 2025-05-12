import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import useLanguageStore from "@/store/language-store";
import useAppTheme from "@/hooks/useAppTheme";
import { Translation } from "@/types/language";

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  titleKey: keyof Translation;
  descKey: keyof Translation;
}

const steps: OnboardingStep[] = [
  {
    icon: <Feather name="smile" size={40} color="#4F8EF7" />,
    titleKey: "onboardingWelcomeTitle",
    descKey: "onboardingWelcomeDesc",
  },
  {
    icon: <Feather name="plus-circle" size={40} color="#4F8EF7" />,
    titleKey: "onboardingAddTransactionTitle",
    descKey: "onboardingAddTransactionDesc",
  },
  {
    icon: <Feather name="pie-chart" size={40} color="#4F8EF7" />,
    titleKey: "onboardingCategoriesTitle",
    descKey: "onboardingCategoriesDesc",
  },
  {
    icon: <Feather name="lock" size={40} color="#4F8EF7" />,
    titleKey: "onboardingPrivacyTitle",
    descKey: "onboardingPrivacyDesc",
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, isRTL } = useLanguageStore();
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.step, { color: colors.subtext }]}>
              {t("step")} {step + 1} / {steps.length}
            </Text>
            <Pressable onPress={handleSkip} hitSlop={10}>
              <AntDesign name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.icon}>{steps[step].icon}</View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                  marginBottom: 16,
                },
              ]}
            >
              {t(steps[step].titleKey)}
            </Text>
            <Text
              style={[
                styles.desc,
                {
                  color: colors.subtext,
                  textAlign: isRTL ? "right" : "left",
                  marginBottom: 32,
                },
              ]}
            >
              {t(steps[step].descKey)}
            </Text>
          </ScrollView>
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                marginTop: 8,
                marginBottom: 4,
              },
            ]}
            onPress={handleNext}
            accessibilityLabel={
              step === steps.length - 1 ? t("finish") : t("next")
            }
          >
            <Text style={styles.buttonText}>
              {step === steps.length - 1 ? t("finish") : t("next")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    borderRadius: 24,
    padding: 24,
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  step: {
    fontSize: 14,
    fontWeight: "500",
  },
  icon: {
    alignItems: "center",
    marginBottom: 16,
  },
  content: {
    alignItems: "center",
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OnboardingModal;
