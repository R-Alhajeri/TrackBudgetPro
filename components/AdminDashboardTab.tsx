import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAppTheme from "../hooks/useAppTheme";

interface AdminDashboardTabProps {
  styles: any;
  colors: any;
}

export default function AdminDashboardTab({
  styles,
  colors,
}: AdminDashboardTabProps) {
  const router = useRouter();

  return (
    <ScrollView style={styles.tabContent}>
      <Text style={[styles.tabTitle, { color: colors.text }]}>
        Admin Dashboard
      </Text>

      {/* System Health Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          System Health
        </Text>
        <Text style={[styles.healthStatus, { color: "#2ecc71" }]}>
          All systems operational
        </Text>
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              99.9%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              Uptime
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              120ms
            </Text>
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              Avg Response
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>0</Text>
            <Text style={[styles.metricLabel, { color: colors.subtext }]}>
              Active Issues
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
          <Ionicons name="person-add" size={20} color="#3498db" />
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>
              5 new users registered
            </Text>
            <Text style={[styles.activityTime, { color: colors.subtext }]}>
              2 hours ago
            </Text>
          </View>
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
          <Ionicons name="card" size={20} color="#2ecc71" />
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>
              3 new subscriptions
            </Text>
            <Text style={[styles.activityTime, { color: colors.subtext }]}>
              5 hours ago
            </Text>
          </View>
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
          <Ionicons name="alert-circle" size={20} color="#e74c3c" />
          <View style={styles.activityContent}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>
              Resolved API latency issue
            </Text>
            <Text style={[styles.activityTime, { color: colors.subtext }]}>
              Yesterday
            </Text>
          </View>
        </View>
      </View>

      {/* Admin Tools Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Admin Tools
        </Text>
        <View style={styles.toolCardsContainer}>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "system-health" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolCardIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="pulse" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              System Health
            </Text>
            <Text
              style={[styles.toolCardDescription, { color: colors.subtext }]}
            >
              Monitor system performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "notifications" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolCardIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <Text
              style={[styles.toolCardDescription, { color: colors.subtext }]}
            >
              Send alerts to users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "data-export" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolCardIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="download" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              Data Export
            </Text>
            <Text
              style={[styles.toolCardDescription, { color: colors.subtext }]}
            >
              Export system data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* The rest of your component remains unchanged */}

      {/* Quick Access Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Access
        </Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "system-health" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolIconContainer,
                { backgroundColor: "#3498db20" },
              ]}
            >
              <Ionicons name="pulse" size={28} color="#3498db" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>
              System Health
            </Text>
            <Text style={[styles.toolDescription, { color: colors.subtext }]}>
              Monitor app performance and metrics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "notifications" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolIconContainer,
                { backgroundColor: "#9b59b620" },
              ]}
            >
              <Ionicons name="notifications" size={28} color="#9b59b6" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>
              Notifications
            </Text>
            <Text style={[styles.toolDescription, { color: colors.subtext }]}>
              Send alerts and messages to users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() =>
              router.push({
                pathname: "/(admin)/tools",
                params: { tool: "export" },
              } as any)
            }
          >
            <View
              style={[
                styles.toolIconContainer,
                { backgroundColor: "#2ecc7120" },
              ]}
            >
              <Ionicons name="download" size={28} color="#2ecc71" />
            </View>
            <Text style={[styles.toolTitle, { color: colors.text }]}>
              Export Data
            </Text>
            <Text style={[styles.toolDescription, { color: colors.subtext }]}>
              Export user and transaction data
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
