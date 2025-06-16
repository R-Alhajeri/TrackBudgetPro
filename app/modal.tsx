import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View } from "react-native";
import useAppTheme from "../hooks/useAppTheme";

export default function ModalScreen() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Modal</Text>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <Text style={{ color: colors.text }}>
        This is an example modal. You can edit it in app/modal.tsx.
      </Text>

      {/* Use a style based on theme instead of hardcoding */}
      <StatusBar style={isDark ? "light" : "dark"} />
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
