import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import useLanguageStore from "@/store/language-store";
import useAppTheme from "@/hooks/useAppTheme";

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { language, setLanguage, t, isRTL } = useLanguageStore();
  const { colors } = useAppTheme();

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
  ];

  const handleSelectLanguage = (code: "en" | "ar") => {
    try {
      setLanguage(code);
      Alert.alert(
        t("language"),
        t("thankYou"), // Using thankYou as a placeholder for a message like "Language changed, please restart the app for full effect"
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      console.error("Error changing language:", error);
      Alert.alert(t("error"), t("errorOccurred"), [{ text: "OK" }]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
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
              {t("language")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close"
            >
              <AntDesign name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.languageList}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageItem,
                  { borderBottomColor: colors.border },
                  language === lang.code && {
                    backgroundColor: `${colors.primary}10`,
                  },
                  isRTL && styles.rtlFlexRowReverse,
                ]}
                onPress={() => handleSelectLanguage(lang.code as "en" | "ar")}
                accessibilityLabel={`Select ${lang.name}`}
                accessibilityState={{ selected: language === lang.code }}
                accessibilityHint={`Change language to ${lang.name}`}
              >
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {lang.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageNativeName,
                      { color: colors.subtext },
                    ]}
                  >
                    {lang.nativeName}
                  </Text>
                </View>
                {language === lang.code && (
                  <AntDesign name="check" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
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
    paddingBottom: 20,
    maxHeight: "30%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  languageList: {
    paddingTop: 8,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
  },
});

export default LanguageSelector;
