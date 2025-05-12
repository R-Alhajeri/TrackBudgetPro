import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import useAuthStore from "@/store/auth-store";
import useBudgetStore from "@/store/budget-store";

export default function AdminScreen() {
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();
  const { user, users } = useAuthStore();
  const { income, categories, transactions } = useBudgetStore();

  // Only allow access if user is admin
  if (!user || user.role !== "admin") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
          {t("adminAccessDenied")}
        </Text>
        <Text style={{ color: colors.subtext, marginTop: 8 }}>
          {t("adminAccessDeniedDesc")}
        </Text>
      </View>
    );
  }

  // Analytics calculations
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;
  const totalTransactions = transactions.length;
  const totalCategories = categories.length;
  const totalIncome = income;
  const totalMoneyManaged = transactions.reduce((sum, t) => sum + t.amount, 0);

  // User Management Table
  const renderUserTable = () => (
    <View style={{ marginTop: 12 }}>
      <View style={styles.userTableHeader}>
        <Text style={[styles.userTableHeaderCell, { color: colors.text }]}>
          {t("user")}
        </Text>
        <Text style={[styles.userTableHeaderCell, { color: colors.text }]}>
          {t("email")}
        </Text>
        <Text style={[styles.userTableHeaderCell, { color: colors.text }]}>
          {t("status")}
        </Text>
        <Text style={[styles.userTableHeaderCell, { color: colors.text }]}>
          {t("lastLogin")}
        </Text>
      </View>
      {users.map((u) => (
        <View key={u.id} style={styles.userTableRow}>
          <Text style={[styles.userTableCell, { color: colors.text }]}>
            {u.name}
          </Text>
          <Text style={[styles.userTableCell, { color: colors.subtext }]}>
            {u.email}
          </Text>
          <Text
            style={[
              styles.userTableCell,
              { color: u.role === "admin" ? colors.primary : colors.text },
            ]}
          >
            {u.role === "admin" ? t("administrator") : t("standardUser")}
          </Text>
          <Text
            style={[
              styles.userTableCell,
              { color: colors.subtext, fontSize: 12 },
            ]}
          >
            {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}
          </Text>
        </View>
      ))}
      {users.length === 0 && (
        <Text style={{ color: colors.subtext, marginTop: 8 }}>
          {t("noUsersAvailable")}
        </Text>
      )}
    </View>
  );

  // Analytics Section
  const renderAnalytics = () => (
    <View style={styles.analyticsGrid}>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("totalUsers")}</Text>
        <Text style={styles.analyticsValue}>{totalUsers}</Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("totalTransactions")}</Text>
        <Text style={styles.analyticsValue}>{totalTransactions}</Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("categories")}</Text>
        <Text style={styles.analyticsValue}>{totalCategories}</Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("income")}</Text>
        <Text style={styles.analyticsValue}>{totalIncome}</Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("totalMoneyManaged")}</Text>
        <Text style={styles.analyticsValue}>
          {totalMoneyManaged.toFixed(2)}
        </Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("administrator")}</Text>
        <Text style={styles.analyticsValue}>{adminCount}</Text>
      </View>
      <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
        <Text style={styles.analyticsLabel}>{t("standardUser")}</Text>
        <Text style={styles.analyticsValue}>{userCount}</Text>
      </View>
    </View>
  );

  // App Settings (mock)
  const renderAppSettings = () => (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.sectionText, { color: colors.subtext }]}>
        {t("appSettingsAdminDescription")}
      </Text>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <View
          style={[styles.mockToggle, { backgroundColor: colors.primary }]}
        />
        <Text style={{ color: colors.text, marginLeft: 8 }}>
          {t("sendGlobalNotification")}
        </Text>
      </View>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <View
          style={[styles.mockToggle, { backgroundColor: colors.primary }]}
        />
        <Text style={{ color: colors.text, marginLeft: 8 }}>
          {t("updateCurrencyRates")}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.iconContainer}>
        <AntDesign name="Safety" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.primary }]}>
        {t("adminDashboardTitle")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        {t("adminDashboardWelcome")}
      </Text>
      {/* User Management */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("adminUserManagement")}
        </Text>
        {renderUserTable()}
      </View>
      {/* Analytics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("adminAnalytics")}
        </Text>
        {renderAnalytics()}
      </View>
      {/* App Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("adminSettings")}
        </Text>
        {renderAppSettings()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F6FA",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
    marginBottom: 4,
  },
  userTableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 14,
  },
  userTableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userTableCell: {
    flex: 1,
    fontSize: 13,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  analyticsCard: {
    width: "47%",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  analyticsLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  mockToggle: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ccc",
  },
});
