/**
 * App.tsx - Root Application Component
 *
 * This file is used by Expo Go for development.
 * In production builds, the app/_layout.tsx file takes over as the root.
 */

import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text>TrackBudgetPro Development Mode</Text>
      <Text style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        This screen appears in Expo Go. Production builds use app/_layout.tsx as
        the root.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
