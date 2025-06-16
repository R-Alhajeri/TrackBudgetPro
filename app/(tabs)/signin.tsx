import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import useAuthStore from "../../store/auth-store";
import { LogOut, User } from "lucide-react-native";
import LoginScreen from "../login";

export default function SignInScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { isAuthenticated, logout, user } = useAuthStore();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!isAuthenticated) {
        e.preventDefault();
        router.replace("../.."); // Go to Home tab (index)
      }
    });
    return unsubscribe;
  }, [isAuthenticated, navigation, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("../login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    Alert.alert(t("logout"), t("areYouSureToLogout"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        onPress: () => {
          logout();
          router.replace("../login");
        },
        style: "destructive",
      },
    ]);
  };

  if (!isAuthenticated) {
    // Show the login form directly in the tab
    return <LoginScreen />;
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[styles.profileContainer, { backgroundColor: colors.card }]}
        >
          <View
            style={[
              styles.profileIcon,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <User size={40} color={colors.primary} />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.email || t("user")}
          </Text>
          <Text style={[styles.profileRole, { color: colors.subtext }]}>
            {t("standardUser")}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Pressable
            style={[styles.optionButton, { backgroundColor: colors.danger }]}
            onPress={handleLogout}
          >
            <LogOut size={16} color="white" style={styles.optionIcon} />
            <Text style={styles.optionButtonText}>{t("logout")}</Text>
          </Pressable>
        </View>

        <Text style={[styles.appVersion, { color: colors.subtext }]}>
          {t("appVersion")} 1.0.0
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
  },
  profileContainer: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  optionsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  appVersion: {
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
  },
});
