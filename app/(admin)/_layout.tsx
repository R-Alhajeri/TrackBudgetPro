import { Slot } from "expo-router";
import { View } from "react-native";
import useAppTheme from "../../hooks/useAppTheme";

export default function AdminLayout() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Slot />
    </View>
  );
}
