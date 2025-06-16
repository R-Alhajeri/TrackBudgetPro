import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  HelpCircle,
  Info,
  Moon,
  Sun,
  Bell,
  Trash2,
  MessageSquare,
  DollarSign,
  Globe,
  Download,
  Upload,
  Shield,
  LogOut,
  User,
} from "lucide-react-native";
import useBudgetStore from "../../store/budget-store";
import useThemeStore from "../../store/theme-store";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import useAuthStore from "../../store/auth-store";
import FeedbackModal from "../../components/FeedbackModal";
import CurrencySelector from "../../components/CurrencySelector";
import LanguageSelector from "../../components/LanguageSelector";
import SettingItem from "../../components/SettingItem";
import useSubscriptionStore from "../../store/subscription-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { Share } from "react-native";
import * as XLSX from "xlsx";
import NotificationSettings from "../../components/NotificationSettings";

// Import the SettingItem component
import {
  Typography,
  Shadows,
  BorderRadius,
  Spacing,
  PressableStates,
} from "../../constants/styleGuide";

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
  const { isAuthenticated, userRole, logout, user, resetAuth } = useAuthStore();
  const { isSubscribed, subscriptionExpiry } = useSubscriptionStore();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [currencySelectorVisible, setCurrencySelectorVisible] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSettingsVisible, setNotificationSettingsVisible] =
    useState(false);

  const resetAllData = () => {
    Alert.alert(t("confirmDelete"), t("errorOccurred"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            resetBudgetData();
            resetTheme();

            if (resetLanguage) resetLanguage();

            if (isAuthenticated) {
              Alert.alert(t("logout"), t("areYouSureToLogout"), [
                {
                  text: t("cancel"),
                  style: "cancel",
                },
                {
                  text: t("logout"),
                  style: "destructive",
                  onPress: () => {
                    resetAuth();
                    router.replace("../..");
                  },
                },
              ]);
            }

            const keys = await AsyncStorage.getAllKeys();
            const keysToRemove = keys.filter(
              (key) =>
                key !== "auth-storage" &&
                key !== "language-storage" &&
                key !== "theme-storage"
            );

            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }

            Alert.alert(t("success"), t("success"), [{ text: "OK" }]);
          } catch (error) {
            console.error("Error resetting data:", error);
            Alert.alert(t("error"), t("errorOccurred"), [{ text: "OK" }]);
          }
        },
      },
    ]);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrencySelectorVisible(false);

    if (currencyCode === baseCurrency) {
      return;
    }

    if (income > 0 || categories.length > 0 || transactions.length > 0) {
      Alert.alert(t("currency"), t("errorOccurred"), [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            setBaseCurrency(currencyCode);
            setIncome(0);

            const categoriesToDelete = [...categories];
            categoriesToDelete.forEach((category) => {
              deleteCategory(category.id);
            });

            Alert.alert(t("success"), t("success"), [{ text: "OK" }]);
          },
        },
      ]);
    } else {
      setBaseCurrency(currencyCode);

      Alert.alert(t("success"), t("success"), [{ text: "OK" }]);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("logout"), t("areYouSureToLogout"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("../login");
        },
      },
    ]);
  };

  const handleLogin = () => {
    router.push("../login");
  };

  const handleSubscription = () => {
    router.push("../subscription");
  };

  const handleToggleNotifications = () => {
    setNotificationSettingsVisible(true);
  };

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      // Create worksheets for different data types
      const summaryData = [
        ["TrackBudgetPro Export"],
        ["Date", new Date().toLocaleString()],
        ["App Version", "1.0.0"],
        ["Base Currency", baseCurrency],
        ["Total Income", income],
        ["Categories Count", categories.length],
        ["Transactions Count", transactions.length],
      ];

      const categoriesData = [
        ["ID", "Name", "Budget", "Color", "Icon"],
        ...categories.map((category: (typeof categories)[0]) => [
          category.id,
          category.name,
          category.budget,
          category.color,
          category.icon,
        ]),
      ];

      const transactionsData = [
        ["ID", "Category", "Amount", "Description", "Date", "Currency", "Type"],
        ...transactions.map((transaction: (typeof transactions)[0]) => {
          const category = categories.find(
            (c: (typeof categories)[0]) => c.id === transaction.categoryId
          );
          return [
            transaction.id,
            category ? category.name : "Unknown",
            transaction.amount,
            transaction.description,
            new Date(transaction.date).toLocaleString(),
            transaction.currency || baseCurrency,
            transaction.type || "expense",
          ];
        }),
      ];

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();

      // Add worksheets
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
      XLSX.utils.book_append_sheet(wb, categoriesSheet, "Categories");

      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(wb, transactionsSheet, "Transactions");

      // Get the current date for the filename
      const currentDate = new Date().toISOString().slice(0, 10);

      if (Platform.OS === "web") {
        // For web, create a downloadable blob using XLSX writeFile
        XLSX.writeFile(wb, `trackbudgetpro_export_${currentDate}.xlsx`);

        setIsExporting(false);
        Alert.alert("Export Success", "Data exported successfully to Excel", [
          { text: "OK" },
        ]);
      } else {
        // For mobile, save to file then share
        const excelBuffer = XLSX.write(wb, {
          bookType: "xlsx",
          type: "base64",
        });

        const fileUri = `${FileSystem.documentDirectory}trackbudgetpro_export_${currentDate}.xlsx`;

        await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the file
        const shareResult = await Share.share({
          url: fileUri,
          title: "TrackBudgetPro Excel Export",
        });

        setIsExporting(false);

        if (shareResult.action !== Share.dismissedAction) {
          Alert.alert("Export Success", "Data exported successfully to Excel", [
            { text: "OK" },
          ]);
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t("error"), t("errorOccurred"), [{ text: "OK" }]);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    setIsImporting(true);

    try {
      // We currently only support JSON imports for backward compatibility
      // Excel files will be export-only for now
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
      Alert.alert(
        "Import Data",
        "This will replace your current data. Are you sure?",
        [
          {
            text: t("cancel"),
            style: "cancel",
            onPress: () => setIsImporting(false),
          },
          {
            text: "Import",
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
                  userId: user?.id || "anonymous",
                  categoryId: transaction.categoryId,
                  amount: transaction.amount,
                  description: transaction.description,
                  date: transaction.date,
                  currency: transaction.currency,
                  type: transaction.type || "expense", // Handle legacy data without type
                });
              });

              setIsImporting(false);

              Alert.alert("Import Success", "Data imported successfully", [
                { text: "OK" },
              ]);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(t("error"), "Invalid import file", [{ text: "OK" }]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetry = () => {
    if (!isSubscribed) {
      // Navigate to subscription page
      router.push("../subscription");
    } else {
      Alert.alert(
        t("alreadySubscribed") || "Already Subscribed",
        "You already have an active subscription.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          { paddingVertical: 16 },
          isRTL ? { alignItems: "flex-end" } : undefined,
        ]}
      >
        {/* Account Section */}
        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {t("user").toUpperCase()}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            {isAuthenticated ? (
              <>
                <SettingItem
                  icon={<User size={20} color={colors.primary} />}
                  title={user?.name || t("user")}
                  subtitle={user?.email || ""}
                  testID="user-profile"
                  rightElement={
                    userRole === "admin" ? (
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Shield
                          size={12}
                          color="#fff"
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: 10,
                            textTransform: "uppercase",
                          }}
                        >
                          Admin
                        </Text>
                      </View>
                    ) : null
                  }
                />
                <SettingItem
                  icon={<LogOut size={20} color={colors.danger} />}
                  title={t("logout")}
                  subtitle={t("logout")}
                  onPress={handleLogout}
                  testID="logout-button"
                />
              </>
            ) : (
              <SettingItem
                icon={<User size={20} color={colors.primary} />}
                title={t("login")}
                subtitle={t("email")}
                onPress={handleLogin}
                testID="login-button"
              />
            )}
          </View>
        </View>
        {/* Admin Panel Access */}
        {userRole === "admin" && (
          <View style={[styles.section, isRTL && styles.sectionRTL]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.subtext },
                Typography.caption,
              ]}
            >
              ADMIN
            </Text>
            <View
              style={[
                styles.sectionContent,
                { backgroundColor: colors.card },
                Shadows.medium as any,
              ]}
            >
              <SettingItem
                icon={<Shield size={20} color={colors.primary} />}
                title="Admin Panel"
                subtitle="Access admin features"
                onPress={() => router.push("/(admin)")}
                testID="admin-panel-button"
              />
            </View>
          </View>
        )}

        {/* Subscription Section */}
        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {"SUBSCRIPTION"}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<DollarSign size={20} color={colors.primary} />}
              title={t("subscriptionStatus") || "Subscription Status"}
              subtitle={
                isSubscribed
                  ? subscriptionExpiry
                    ? `${t("activeUntil") || "Active until"} ${new Date(
                        subscriptionExpiry as string
                      ).toLocaleDateString()}`
                    : t("subscribed") || "Subscribed"
                  : t("notSubscribed") || "Not Subscribed"
              }
              onPress={handleSubscription}
              testID="subscription-status"
            />
          </View>
        </View>

        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {t("settings").toUpperCase()}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<Bell size={20} color={colors.primary} />}
              title={t("notifications")}
              subtitle={t("notification")}
              onPress={handleToggleNotifications}
              testID="notifications-setting"
            />
            <SettingItem
              icon={
                theme === "dark" ? (
                  <Moon size={20} color={colors.primary} />
                ) : theme === "light" ? (
                  <Sun size={20} color={colors.primary} />
                ) : (
                  <Sun size={20} color={colors.primary} />
                )
              }
              title={t("theme")}
              subtitle={
                theme === "dark"
                  ? t("darkTheme")
                  : theme === "light"
                  ? t("lightTheme")
                  : t("systemTheme")
              }
              onPress={toggleTheme}
              testID="theme-setting"
            />
            <SettingItem
              icon={<Globe size={20} color={colors.primary} />}
              title={t("language")}
              subtitle={language === "en" ? "English" : "العربية"}
              onPress={() => setLanguageSelectorVisible(true)}
              testID="language-setting"
            />
            <SettingItem
              icon={<DollarSign size={20} color={colors.primary} />}
              title={t("currency")}
              subtitle={baseCurrency}
              onPress={() => setCurrencySelectorVisible(true)}
              testID="currency-setting"
            />
          </View>
        </View>

        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {"BUDGET DATA"}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<Info size={20} color={colors.primary} />}
              title={"Budget Summary"}
              subtitle={`${t("income")}: ${baseCurrency} ${income.toFixed(
                2
              )} • ${t("categories")}: ${categories.length}`}
              testID="budget-summary"
            />
            <SettingItem
              icon={<Trash2 size={20} color={colors.danger} />}
              title={"Reset All Data"}
              subtitle={"Delete all budget information"}
              onPress={resetAllData}
              testID="reset-data-button"
            />
          </View>
        </View>

        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {"DATA MANAGEMENT"}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<Download size={20} color={colors.primary} />}
              title={t("exportData") || "Export Data"}
              subtitle={"Export to Excel spreadsheet"}
              onPress={handleExportData}
              rightElement={
                isExporting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : undefined
              }
              testID="export-data-button"
            />
            <SettingItem
              icon={<Upload size={20} color={colors.primary} />}
              title={t("importData") || "Import Data"}
              subtitle={"Restore your budget data"}
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

        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {t("feedback")?.toUpperCase() || "FEEDBACK"}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<MessageSquare size={20} color={colors.primary} />}
              title={t("sendFeedback") || "Send Feedback"}
              subtitle={t("feedbackMessage") || "Help us improve the app"}
              onPress={() => setFeedbackModalVisible(true)}
              testID="feedback-button"
            />
          </View>
        </View>

        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {t("about").toUpperCase() || "ABOUT"}
          </Text>
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: colors.card },
              Shadows.medium as any,
            ]}
          >
            <SettingItem
              icon={<Info size={20} color={colors.primary} />}
              title={"About TrackBudgetPro"}
              subtitle={`${t("version") || "Version"} 1.0.0 • AlhajeriTech`}
              testID="about-button"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.subtext },
              Typography.caption,
            ]}
          >
            {t("appName")} • {t("appVersion")} • © AlhajeriTech
          </Text>
        </View>

        {/* Modals */}
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

        <NotificationSettings
          visible={notificationSettingsVisible}
          onClose={() => setNotificationSettingsVisible(false)}
        />
      </ScrollView>
    </>
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
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 16,
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
    width: 40,
    height: 40,
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
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    padding: 24,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.8,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
