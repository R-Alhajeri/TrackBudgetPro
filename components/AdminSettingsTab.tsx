import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Settings,
} from "lucide-react-native";
import useAppTheme from "../hooks/useAppTheme";

interface SettingItemProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
  loading?: boolean;
}

export default function AdminSettingsTab() {
  const { colors } = useAppTheme();
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      "⚠️ Clear All Data",
      "This will permanently delete all user data, transactions, and settings. This action cannot be undone.\n\nAre you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setLoading("clearData", true);
            try {
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 2000));
              Alert.alert("✅ Success", "All data cleared successfully");
            } catch (error) {
              Alert.alert(
                "❌ Error",
                "Failed to clear data. Please try again."
              );
            } finally {
              setLoading("clearData", false);
            }
          },
        },
      ]
    );
  }, [setLoading]);

  const handleExportData = useCallback(async () => {
    setLoading("exportData", true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 3000));
      Alert.alert(
        "📊 Export Complete",
        "System data has been exported successfully. Check your downloads folder.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("❌ Error", "Failed to export data. Please try again.");
    } finally {
      setLoading("exportData", false);
    }
  }, [setLoading]);

  const handleRefreshCache = useCallback(async () => {
    setLoading("refreshCache", true);
    try {
      // Simulate cache refresh
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("🔄 Success", "System cache refreshed successfully");
    } catch (error) {
      Alert.alert("❌ Error", "Failed to refresh cache. Please try again.");
    } finally {
      setLoading("refreshCache", false);
    }
  }, [setLoading]);

  const handleDatabaseOptimization = useCallback(async () => {
    setLoading("optimizeDb", true);
    try {
      // Simulate database optimization
      await new Promise((resolve) => setTimeout(resolve, 4000));
      Alert.alert(
        "⚡ Optimization Complete",
        "Database has been optimized successfully. Performance improvements should be noticeable."
      );
    } catch (error) {
      Alert.alert("❌ Error", "Failed to optimize database. Please try again.");
    } finally {
      setLoading("optimizeDb", false);
    }
  }, [setLoading]);

  const SettingItem = ({
    title,
    description,
    icon: Icon,
    onPress,
    color = colors.primary,
    destructive = false,
  }: {
    title: string;
    description: string;
    icon: any;
    onPress: () => void;
    color?: string;
    destructive?: boolean;
  }) => (
    <Pressable
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Icon size={24} color={destructive ? "#EF4444" : color} />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            { color: destructive ? "#EF4444" : colors.text },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.subtext }]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        System Management
      </Text>

      <SettingItem
        title="Export System Data"
        description="Download all user data and analytics"
        icon={Download}
        onPress={handleExportData}
        color="#10B981"
      />

      <SettingItem
        title="Refresh Cache"
        description="Clear system cache and refresh data"
        icon={RefreshCw}
        onPress={handleRefreshCache}
        color="#3B82F6"
      />

      <SettingItem
        title="Optimize Database"
        description="Run database optimization and cleanup"
        icon={Database}
        onPress={handleDatabaseOptimization}
        color="#F59E0B"
      />

      <Text
        style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}
      >
        Danger Zone
      </Text>

      <SettingItem
        title="Clear All Data"
        description="Permanently delete all user data"
        icon={Trash2}
        onPress={handleClearAllData}
        destructive={true}
      />

      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          System Information
        </Text>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            Admin Panel Version:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            Firebase Status:
          </Text>
          <Text style={[styles.infoValue, { color: "#10B981" }]}>
            Connected
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.subtext }]}>
            Environment:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            Production
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
