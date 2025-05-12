import React, { useEffect } from "react";
import { Tabs, useRouter, usePathname } from "expo-router"; // Combined expo-router imports
import { Feather } from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import useAuthStore from "@/store/auth-store";

// Define protected paths outside of the component or useEffect if they are static
const protectedTabsPaths = [
  "/(tabs)", // Default route for the tabs group
  "/(tabs)/index",
  "/(tabs)/categories",
  "/(tabs)/transactions",
  "/(tabs)/settings",
  "/(tabs)/signin", // Profile page, requires auth
  // Admin path is handled separately based on userRole
];

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { isAuthenticated, userRole, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  console.log(
    "[TabLayout] Path:",
    pathname, // Log current path
    "userRole:",
    userRole,
    "isAuthenticated:",
    isAuthenticated,
    "hasHydrated:",
    hasHydrated
  );

  useEffect(() => {
    if (!hasHydrated) {
      // Wait for the auth store to rehydrate
      return;
    }

    // Redirect non-authenticated users from protected tabs
    if (!isAuthenticated && protectedTabsPaths.includes(pathname)) {
      console.log(
        "[TabLayout] Not authenticated on a protected path, redirecting to /login from:",
        pathname
      );
      router.replace("/login");
      return;
    }

    // Redirect non-admins from admin tab
    if (
      isAuthenticated &&
      userRole !== "admin" &&
      pathname === "/(tabs)/admin"
    ) {
      console.log(
        "[TabLayout] Non-admin trying to access /admin, redirecting to /(tabs)"
      );
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, userRole, pathname, router, hasHydrated]);

  if (!hasHydrated) {
    // Show loader or null while waiting for auth state to be ready
    return null;
  }

  // Do not render tabs until pathname is available
  if (!pathname) {
    console.log(
      "[TabLayout] Pathname is null or undefined, waiting for path to be ready"
    );
    return null;
  }

  // If still not authenticated after hydration and on a protected path,
  // the useEffect should have redirected. Rendering null prevents flash of content.
  if (!isAuthenticated && protectedTabsPaths.includes(pathname)) {
    console.log(
      "[TabLayout] Post-hydration: Not authenticated on protected path, rendering null while redirect occurs from:",
      pathname
    );
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShadowVisible: false,
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("dashboard"),
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
          headerTitle: t("budgetDashboard"),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("categories"),
          tabBarIcon: ({ color }) => (
            <Feather name="pie-chart" size={24} color={color} />
          ),
          headerTitle: t("categories"),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("transactions"),
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={24} color={color} />
          ),
          headerTitle: t("transactions"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={24} color={color} />
          ),
          headerTitle: t("settings"),
        }}
      />
      {/* Sign In tab: directs to /login if not auth, else to profile at /(tabs)/signin */}
      <Tabs.Screen
        name="signin"
        options={{
          title: isAuthenticated ? t("profile") : t("signIn"),
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
          headerTitle: isAuthenticated ? t("profile") : t("signIn"),
          href: isAuthenticated ? "/(tabs)/signin" : "/login",
        }}
      />
      {/* Admin tab: only available if userRole is 'admin' */}
      <Tabs.Screen
        name="admin"
        options={{
          title: t("adminPanel"),
          tabBarIcon: ({ color }) => (
            <Feather name="shield" size={24} color={color} />
          ),
          headerTitle: t("adminPanel"),
          href: userRole === "admin" ? "/(tabs)/admin" : null,
        }}
      />
    </Tabs>
  );
}
