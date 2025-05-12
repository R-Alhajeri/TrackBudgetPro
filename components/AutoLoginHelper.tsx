// DEV ONLY COMPONENT - For debugging authentication
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import useAuthStore from "@/store/auth-store";
import { loginWithBackend } from "@/lib/auth-api";

export default function AutoLoginHelper() {
  const { isAuthenticated, user, token } = useAuthStore();

  const handleAutoLogin = async () => {
    try {
      // Use a test account - replace with your actual test credentials
      const email = "user@example.com";
      const password = "user123";

      console.log("Auto login: Attempting login with", email);
      const success = await loginWithBackend(email, password);

      if (success) {
        console.log("Auto login successful");
        Alert.alert("Auto Login", "Successfully logged in");
      } else {
        console.log("Auto login failed");
        Alert.alert("Auto Login Failed", "Check console for details");
      }
    } catch (error) {
      console.error("Auto login error:", error);
      Alert.alert("Auto Login Error", String(error));
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    console.log("Logged out");
    Alert.alert("Logged Out", "Successfully logged out");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔑 Auth Debug</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>
          {isAuthenticated ? "✅ Authenticated" : "❌ Not authenticated"}
        </Text>
      </View>

      {user && (
        <>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>User:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user.role || "none"}</Text>
          </View>
        </>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Token:</Text>
        <Text style={styles.value}>{token ? "✅ Present" : "❌ Missing"}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isAuthenticated ? "Force Logout" : "Auto Login"}
          onPress={isAuthenticated ? handleLogout : handleAutoLogin}
          color={isAuthenticated ? "#FF6B6B" : "#4CAF50"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    margin: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#34495E",
    textAlign: "center",
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
    width: 60,
    color: "#34495E",
  },
  value: {
    flex: 1,
    color: "#34495E",
  },
  buttonContainer: {
    marginTop: 12,
  },
});
