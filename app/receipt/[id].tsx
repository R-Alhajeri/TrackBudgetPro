import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { ArrowLeft, Download, Trash2 } from "lucide-react-native";
import useBudgetStore from "../../store/budget-store";
import useAppTheme from "../../hooks/useAppTheme";
import useLanguageStore from "../../store/language-store";
import { Currency } from "../../types/budget";

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, receipts, deleteReceipt, baseCurrency, currencies } =
    useBudgetStore();
  const { colors } = useAppTheme();
  const { t } = useLanguageStore();

  const transaction = transactions.find((t) => t.id === id);
  const receiptImage = receipts[id];
  const currencySymbol =
    currencies.find((c: Currency) => c.code === baseCurrency)?.symbol ||
    baseCurrency;

  if (!transaction || !receiptImage) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          {t("somethingWentWrong")}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{t("back")}</Text>
        </Pressable>
      </View>
    );
  }

  const handleDeleteReceipt = () => {
    if (deleteReceipt) {
      deleteReceipt(id);
    }
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("receipt"),
          headerRight: () => (
            <Pressable
              onPress={handleDeleteReceipt}
              style={styles.headerButton}
            >
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>
            {transaction.description}
          </Text>
          <Text style={[styles.transactionAmount, { color: colors.text }]}>
            {currencySymbol}
            {transaction.amount.toFixed(2)}
          </Text>
          <Text style={[styles.transactionDate, { color: colors.subtext }]}>
            {new Date(transaction.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View
          style={[styles.receiptContainer, { backgroundColor: colors.card }]}
        >
          <Image
            source={{ uri: receiptImage }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        </View>

        {transaction.receiptData && (
          <View
            style={[styles.receiptDataCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.receiptDataTitle, { color: colors.text }]}>
              {t("receipt")}
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
                {t("merchant")}
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {transaction.receiptData.merchant || t("unknown")}
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
                {t("date")}
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {transaction.receiptData.date
                  ? new Date(transaction.receiptData.date).toLocaleDateString()
                  : t("unknown")}
              </Text>
            </View>

            <View style={styles.receiptDataItem}>
              <Text
                style={[styles.receiptDataLabel, { color: colors.subtext }]}
              >
                {t("total")}
              </Text>
              <Text style={[styles.receiptDataValue, { color: colors.text }]}>
                {currencySymbol}
                {transaction.receiptData.total?.toFixed(2) || t("unknown")}
              </Text>
            </View>

            {transaction.receiptData.items &&
              transaction.receiptData.items.length > 0 && (
                <>
                  <Text style={[styles.itemsTitle, { color: colors.text }]}>
                    {t("addYourFirst")}
                  </Text>
                  {transaction.receiptData.items.map((item, index) => (
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
            <Download size={20} color="white" />
            <Text style={styles.actionButtonText}>{t("exportData")}</Text>
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
