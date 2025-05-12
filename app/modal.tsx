import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View } from "react-native";
import useLanguageStore from "@/store/language-store";

export default function ModalScreen() {
  const { t } = useLanguageStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("modalTitle")}</Text>
      <View style={styles.separator} />
      <Text>{t("modalDescription")}</Text>
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
