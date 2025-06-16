import { Stack } from "expo-router";
import { MonthProvider } from "../store/month-context";
import { useEffect } from "react";
import { initializeFirebase } from "../lib/firebase";

export default function RootLayout() {
  // Initialize Firebase when the app starts (non-blocking)
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Firebase config is now in the firebase.ts file for better organization
        await initializeFirebase();
        console.log("🔥 Firebase initialized successfully");
      } catch (error) {
        console.warn(
          "⚠️ Firebase initialization failed, using fallback:",
          error
        );
        // App continues to work with mock implementation
      }
    };

    // Non-blocking initialization
    initFirebase();
  }, []);

  // DEBUG: Log current route (if possible)
  // Note: expo-router does not expose route info here, but log render
  // Centralized header styling for consistency
  const defaultHeaderOptions = {
    headerStyle: { backgroundColor: "#111827" },
    headerTitleStyle: { color: "#F9FAFB" },
    headerTintColor: "#F9FAFB",
    headerBackTitle: "Back",
  };

  return (
    <MonthProvider>
      <Stack>
        {/* Main screens with hidden headers */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="signup"
          options={{ headerShown: false, gestureEnabled: true }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />

        {/* Screens with styled headers */}
        <Stack.Screen
          name="login"
          options={{ ...defaultHeaderOptions, headerTitle: "Login" }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{
            ...defaultHeaderOptions,
            headerTitle: "Category Details",
            headerBackTitle: "Categories",
          }}
        />
        <Stack.Screen
          name="receipt/[id]"
          options={{ ...defaultHeaderOptions, headerTitle: "Receipt Details" }}
        />
        <Stack.Screen
          name="subscription"
          options={{ ...defaultHeaderOptions, headerTitle: "Subscription" }}
        />
      </Stack>
    </MonthProvider>
  );
}
