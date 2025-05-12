"use client";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  I18nManager,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from "react-native";
import {
  AntDesign,
  Feather,
  MaterialIcons,
  FontAwesome,
  Ionicons,
  Entypo,
} from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useThemeStore from "@/store/theme-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import useAuthStore from "@/store/auth-store";
import FeedbackModal from "@/components/FeedbackModal";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSelector from "@/components/LanguageSelector";
import * as Localization from "expo-localization";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import * as WebBrowser from "expo-web-browser";
import InAppSubscriptionSection from "@/components/InAppSubscriptionSection";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    income,
    categories,
    transactions,
    baseCurrency,
    setBaseCurrency,
    setIncome,
    deleteCategory,
    resetBudgetData,
  } = useBudgetStore();

  const { theme, toggleTheme, resetTheme } = useThemeStore();
  const { colors, isDark } = useAppTheme();
  const { t, isRTL, language, resetLanguage } = useLanguageStore();
  const { isAuthenticated, userRole, clearAuth, user, resetAuth } =
    useAuthStore(); // Changed logout to clearAuth
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [currencySelectorVisible, setCurrencySelectorVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Set default currency based on user's region
    const setDefaultCurrency = async () => {
      try {
        const { region } = await Localization.getLocalizationAsync();
        let defaultCurrency = "USD"; // Fallback to USD

        // Map region to currency (this is a simplified mapping)
        const regionCurrencyMap: Record<string, string> = {
          US: "USD",
          EU: "EUR",
          GB: "GBP",
          JP: "JPY",
          CA: "CAD",
          AU: "AUD",
          AE: "AED",
          SA: "SAR",
          EG: "EGP",
          IN: "INR",
        };

        if (region && regionCurrencyMap[region]) {
          defaultCurrency = regionCurrencyMap[region];
        } else if (region) {
          // Extract the first two letters for a rough country code match
          const countryCode = region
            .split("-")[1]
            ?.substring(0, 2)
            .toUpperCase();
          if (countryCode && regionCurrencyMap[countryCode]) {
            defaultCurrency = regionCurrencyMap[countryCode];
          }
        }

        // Only set the default currency if no budget data exists to avoid overwriting user data
        if (
          income === 0 &&
          categories.length === 0 &&
          transactions.length === 0
        ) {
          setBaseCurrency(defaultCurrency);
        }
      } catch (error) {
        console.error(
          "Error setting default currency based on location:",
          error
        );
        // Fallback to USD if there's an error
        if (
          income === 0 &&
          categories.length === 0 &&
          transactions.length === 0
        ) {
          setBaseCurrency("USD");
        }
      }
    };

    setDefaultCurrency();
  }, []); // Empty dependency array to run only once on mount

  const resetAllData = () => {
    Alert.alert(t("resetAllDataTitle"), t("resetAllDataMessage"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("reset"),
        style: "destructive",
        onPress: async () => {
          try {
            // Show loading indicator or disable UI during reset

            // Reset all stores
            resetBudgetData();
            resetTheme();
            resetLanguage();

            // Only reset auth if user is logged in and confirms
            if (isAuthenticated) {
              Alert.alert(t("logoutConfirmation"), t("logoutWithReset"), [
                {
                  text: t("cancel"),
                  style: "cancel",
                },
                {
                  text: t("logout"),
                  style: "destructive",
                  onPress: () => {
                    resetAuth();
                    router.replace("/");
                  },
                },
              ]);
            }

            // Clear any other app data from AsyncStorage
            const keys = await AsyncStorage.getAllKeys();
            const keysToRemove = keys.filter(
              (key) =>
                key !== "auth-storage" && // Keep auth if user didn't logout
                key !== "language-storage" && // Language is reset separately
                key !== "theme-storage" // Theme is reset separately
            );

            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }

            Alert.alert(t("dataResetComplete"), t("allDataHasBeenReset"), [
              { text: "OK" },
            ]);
          } catch (error) {
            console.error("Error resetting data:", error);
            Alert.alert(t("error"), t("errorOccurred"), [{ text: "OK" }]);
          }
        },
      },
    ]);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    // Close the currency selector
    setCurrencySelectorVisible(false);

    // If the selected currency is the same as current, do nothing
    if (currencyCode === baseCurrency) {
      return;
    }

    // If user has budget data, show warning and force reset
    if (income > 0 || categories.length > 0 || transactions.length > 0) {
      Alert.alert(t("changeCurrencyTitle"), t("changeCurrencyWarning"), [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("resetAndChange"),
          style: "destructive",
          onPress: () => {
            // Reset all data and change currency
            setBaseCurrency(currencyCode);
            setIncome(0);

            // Delete all categories (which will also delete all transactions)
            const categoriesToDelete = [...categories];
            categoriesToDelete.forEach((category) => {
              deleteCategory(category.id);
            });

            Alert.alert(
              t("currencyChanged"),
              t("currencyChangedAndDataReset").replace(
                "{currency}",
                currencyCode
              ),
              [{ text: "OK" }]
            );
          },
        },
      ]);
    } else {
      // If no budget data, just change the currency
      setBaseCurrency(currencyCode);

      Alert.alert(
        t("currencyChanged"),
        t("currencyChangeApplied").replace("{currency}", currencyCode),
        [{ text: "OK" }]
      );
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      // Prepare data for export
      const exportData = {
        income,
        categories,
        transactions,
        baseCurrency,
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0",
      };

      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        // For web, create a downloadable blob
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `budget_tracker_export_${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        Alert.alert(
          t("exportSuccess"),
          t("dataExportedSuccessfully").replace("{type}", "Budget"),
          [{ text: "OK" }]
        );
      } else {
        // For mobile, save to file then share
        const fileUri = `${
          FileSystem.documentDirectory
        }budget_tracker_export_${new Date().toISOString().slice(0, 10)}.json`;

        await FileSystem.writeAsStringAsync(fileUri, jsonData, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Share the file
        const shareResult = await Share.share({
          url: fileUri,
          title: "Budget Tracker Data Export",
        });

        setIsExporting(false);

        if (shareResult.action !== Share.dismissedAction) {
          Alert.alert(
            t("exportSuccess"),
            t("dataExportedSuccessfully").replace("{type}", "Budget"),
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      Alert.alert(t("error"), t("errorOccurred"), [{ text: "OK" }]);
    }
  };

  const handleImportData = async () => {
    setIsImporting(true);

    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      // Read the file
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Parse the JSON
      const importedData = JSON.parse(fileContent);

      // Validate the data structure
      if (
        !importedData.income ||
        !Array.isArray(importedData.categories) ||
        !Array.isArray(importedData.transactions)
      ) {
        throw new Error("Invalid data format");
      }

      // Confirm import
      Alert.alert(t("importData"), t("importDataConfirmation"), [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => setIsImporting(false),
        },
        {
          text: t("import"),
          onPress: () => {
            // Reset current data
            resetBudgetData();

            // Import new data
            setIncome(importedData.income);
            setBaseCurrency(importedData.baseCurrency || "USD");

            // Import categories
            importedData.categories.forEach((category: any) => {
              useBudgetStore.getState().addCategory({
                name: category.name,
                budget: category.budget,
                color: category.color,
                icon: category.icon,
              });
            });

            // Import transactions
            importedData.transactions.forEach((transaction: any) => {
              useBudgetStore.getState().addTransaction({
                categoryId: transaction.categoryId,
                amount: transaction.amount,
                description: transaction.description,
                currency: transaction.currency,
              });
            });

            setIsImporting(false);

            Alert.alert(t("importSuccess"), t("dataImportedSuccessfully"), [
              { text: "OK" },
            ]);
          },
        },
      ]);
    } catch (error) {
      console.error("Import error:", error);
      setIsImporting(false);
      Alert.alert(t("error"), t("invalidImportFile"), [{ text: "OK" }]);
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);

    // In a real app, you would register/unregister for push notifications here
    Alert.alert(
      notificationsEnabled
        ? t("notificationsDisabled")
        : t("notificationsEnabled"),
      notificationsEnabled
        ? t("notificationsDisabledMessage")
        : t("notificationsEnabledMessage"),
      [{ text: "OK" }]
    );
  };

  const handleHelpAndSupport = () => {
    // In a real app, this would open a help center or support chat
    Alert.alert(t("helpAndSupport"), t("helpAndSupportMessage"), [
      { text: t("cancel") },
      {
        text: t("contactSupport"),
        onPress: () => {
          // Open email app with your support email
          Linking.openURL(
            "mailto:Alhajeri-trackbudget@pm.me?subject=Help%20Request"
          );
        },
      },
      {
        text: t("visitFAQ"),
        onPress: () => {
          // Open FAQ website
          Linking.openURL("https://example.com/faq");
        },
      },
    ]);
  };

  const handleAbout = () => {
    Alert.alert(t("aboutBudgetTracker"), t("aboutAppDescription"), [
      { text: "OK" },
      {
        text: t("privacyPolicy"),
        onPress: () => {
          Linking.openURL("https://example.com/privacy");
        },
      },
      {
        text: t("termsOfService"),
        onPress: () => {
          Linking.openURL("https://example.com/terms");
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t("logout"), t("areYouSureToLogout"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: () => {
          clearAuth(); // Changed logout() to clearAuth()
          router.replace("/login");
        },
      },
    ]);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    testID,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    testID?: string;
  }) => (
    <Pressable
      style={[
        styles.settingItem,
        { borderBottomColor: colors.border },
        isRTL && styles.settingItemRTL,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: `${colors.primary}20` }]}
      >
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.subtext }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ||
        (onPress && (
          <AntDesign name="right" size={20} color={colors.subtext} />
        ))}
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={isRTL ? { alignItems: "flex-end" } : undefined}
    >
      {/* Account Section */}
      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("account")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          {isAuthenticated ? (
            <>
              <SettingItem
                icon={
                  <AntDesign name="user" size={20} color={colors.primary} />
                }
                title={user?.name || t("user")}
                subtitle={user?.email || ""}
                testID="user-profile"
              />
              {userRole === "admin" && (
                <SettingItem
                  icon={
                    <Feather name="shield" size={20} color={colors.primary} />
                  }
                  title={t("adminPanel")}
                  subtitle={t("accessAdminControls")}
                  onPress={() => router.push("/(tabs)/admin")}
                  testID="admin-panel"
                />
              )}
              <SettingItem
                icon={
                  <MaterialIcons
                    name="logout"
                    size={20}
                    color={colors.danger}
                  />
                }
                title={t("logout")}
                subtitle={t("signOutOfYourAccount")}
                onPress={handleLogout}
                testID="logout-button"
              />
            </>
          ) : (
            <SettingItem
              icon={<AntDesign name="user" size={20} color={colors.primary} />}
              title={t("loginSignUp")}
              subtitle={t("accessYourAccount")}
              onPress={handleLogin}
              testID="login-button"
            />
          )}
        </View>
      </View>

      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("appSettings")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={<Feather name="bell" size={20} color={colors.primary} />}
            title={t("notifications")}
            subtitle={t("manageBudgetAlerts")}
            rightElement={
              <Switch
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}80`,
                }}
                thumbColor={notificationsEnabled ? colors.primary : "#f4f3f4"}
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                testID="notifications-toggle"
              />
            }
            testID="notifications-setting"
          />
          <SettingItem
            icon={<Feather name="moon" size={20} color={colors.primary} />}
            title={t("darkMode")}
            rightElement={
              <Switch
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}80`,
                }}
                thumbColor={isDark ? colors.primary : "#f4f3f4"}
                value={isDark}
                onValueChange={toggleTheme}
                testID="theme-toggle"
              />
            }
            testID="dark-mode-setting"
          />
          <SettingItem
            icon={<Feather name="globe" size={20} color={colors.primary} />}
            title={t("language")}
            subtitle={language === "en" ? "English" : "العربية"}
            onPress={() => setLanguageSelectorVisible(true)}
            testID="language-setting"
          />
          <SettingItem
            icon={
              <FontAwesome name="dollar" size={20} color={colors.primary} />
            }
            title={t("baseCurrency")}
            subtitle={`${t("current")}: ${baseCurrency}`}
            onPress={() => setCurrencySelectorVisible(true)}
            testID="currency-setting"
          />
        </View>
      </View>

      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("budgetData")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={
              <AntDesign name="infocirlceo" size={20} color={colors.primary} />
            }
            title={t("budgetSummary")}
            subtitle={`${t("income")}: ${baseCurrency} ${income.toFixed(
              2
            )} • ${t("categories")}: ${categories.length}`}
            testID="budget-summary"
          />
          <SettingItem
            icon={<Feather name="trash-2" size={20} color={colors.danger} />}
            title={t("resetAllData")}
            subtitle={t("deleteAllBudgetInfo")}
            onPress={resetAllData}
            testID="reset-data-button"
          />
        </View>
      </View>

      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("dataManagement")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={<Feather name="download" size={20} color={colors.primary} />}
            title={t("exportData")}
            subtitle={t("saveYourBudgetData")}
            onPress={handleExportData}
            rightElement={
              isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
            testID="export-data-button"
          />
          <SettingItem
            icon={<Feather name="upload" size={20} color={colors.primary} />}
            title={t("importData")}
            subtitle={t("restoreYourBudgetData")}
            onPress={handleImportData}
            rightElement={
              isImporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : undefined
            }
            testID="import-data-button"
          />
        </View>
      </View>

      {/* Subscription Section (In-App Purchase) */}
      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          Subscription (In-App)
        </Text>
        <InAppSubscriptionSection />
      </View>

      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("feedback")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={
              <Feather name="message-square" size={20} color={colors.primary} />
            }
            title={t("sendFeedback")}
            subtitle={t("requestFeaturesReportIssues")}
            onPress={() => setFeedbackModalVisible(true)}
            testID="feedback-button"
          />
        </View>
      </View>

      <View style={[styles.section, isRTL && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t("about")}
        </Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={
              <AntDesign
                name="questioncircleo"
                size={20}
                color={colors.primary}
              />
            }
            title={t("helpAndSupport")}
            onPress={handleHelpAndSupport}
            testID="help-button"
          />
          <SettingItem
            icon={
              <AntDesign name="infocirlceo" size={20} color={colors.primary} />
            }
            title={t("aboutBudgetTracker")}
            subtitle={`${t("version")} 1.0.0`}
            onPress={handleAbout}
            testID="about-button"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.subtext }]}>
          {t("appName")} • {t("madeWithLove")}
        </Text>
      </View>

      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />

      <CurrencySelector
        visible={currencySelectorVisible}
        onClose={() => setCurrencySelectorVisible(false)}
        onSelect={handleCurrencyChange}
        selectedCurrency={baseCurrency}
      />

      <LanguageSelector
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    width: "100%",
  },
  sectionRTL: {
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemRTL: {
    flexDirection: "row-reverse",
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  footerText: {
    fontSize: 14,
  },
});
