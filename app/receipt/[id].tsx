import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { AntDesign, Feather } from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getReceiptFromBackend,
    deleteReceiptFromBackend,
    receipts,
    baseCurrency,
    currencies,
    transactions,
  } = useBudgetStore();
  const { colors } = useAppTheme();

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Find the transaction for display (local fallback)
  const transaction = transactions.find((t) => t.id === id);
  const currencySymbol =
    currencies.find((c) => c.code === baseCurrency)?.symbol || baseCurrency;

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getReceiptFromBackend?.(id!);
      setReceipt(data);
    } catch (e) {
      setError("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [id, getReceiptFromBackend]);

  useEffect(() => {
    if (id) fetchReceipt();
  }, [id, fetchReceipt]);

  const handleDeleteReceipt = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteReceiptFromBackend?.(id!);
      router.back();
    } catch (e) {
      setError("Failed to delete receipt");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error || !receipt) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          {error || "Receipt not found"}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Use receipt.data for extracted data, receipt.imageUrl for image
  return (
    <>
      <Stack.Screen
        options={{
          title: "Receipt Details",
          headerRight: () => (
            <Pressable
              onPress={handleDeleteReceipt}
              style={styles.headerButton}
            >
              <Feather name="trash-2" size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>
            {transaction?.description || receipt.data?.merchant || "Receipt"}
          </Text>
          <Text style={[styles.transactionAmount, { color: colors.text }]}>
            {currencySymbol}
            {transaction?.amount?.toFixed(2) ||
              receipt.data?.total?.toFixed(2) ||
              ""}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.subtext }]}>
            {transaction?.date
              ? new Date(transaction.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : receipt.data?.date
              ? new Date(receipt.data.date).toLocaleDateString()
              : ""}
          </Text>
        </View>

        <View
          style={[styles.receiptContainer, { backgroundColor: colors.card }]}
        >
          <Image
            source={{ uri: receipt.imageUrl }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>

        {receipt.data && (
          <View
            style={[styles.receiptDataCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.receiptDataTitle, { color: colors.text }]}>
              Receipt Details
            </Text>
            <View
              style={[
                styles.receiptDataItem,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.receiptDataLabel, { color: colors.subtext }]}
              >
                Merchant
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {receipt.data.merchant || "Unknown"}
              </Text>
            </View>
            <View
              style={[
                styles.receiptDataItem,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.receiptDataLabel, { color: colors.subtext }]}
              >
                Date
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {receipt.data.date
                  ? new Date(receipt.data.date).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>
            <View style={styles.receiptDataItem}>
              <Text
                style={[styles.receiptDataLabel, { color: colors.subtext }]}
              >
                Total
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {currencySymbol}
                {receipt.data.total?.toFixed(2) || "Unknown"}
              </Text>
            </View>
            {receipt.data.items && receipt.data.items.length > 0 && (
              <>
                <Text style={[styles.itemsTitle, { color: colors.text }]}>
                  Items
                </Text>
                {receipt.data.items.map((item: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.itemRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      {item.quantity && item.quantity > 1 && (
                        <Text
                          style={[
                            styles.itemQuantity,
                            { color: colors.subtext },
                          ]}
                        >
                          x{item.quantity}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.itemPrice, { color: colors.text }]}>
                      {currencySymbol}
                      {item.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              /* In a real app, implement download functionality */
            }}
          >
            <Feather name="download" size={20} color="white" />
            <Text style={styles.actionButtonText}>Download Receipt</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerButton: {
    padding: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  receiptContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  receiptImage: {
    width: "100%",
    height: 400,
  },
  receiptDataCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  receiptDataTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  receiptDataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  receiptDataLabel: {
    fontSize: 14,
  },
  receiptDataValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
