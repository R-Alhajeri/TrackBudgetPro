import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as InAppPurchases from "expo-in-app-purchases";

const SUBSCRIPTION_PRODUCT_ID = "monthly_subscription_499"; // Replace with your real product ID

export default function InAppSubscriptionSection() {
  const [iapStatus, setIapStatus] = useState<"active" | "inactive" | "unknown">(
    "unknown"
  );
  const [iapLoading, setIapLoading] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);

  useEffect(() => {
    InAppPurchases.connectAsync();
    return () => {
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const checkSubscription = async () => {
    setIapLoading(true);
    setIapError(null);
    try {
      const { responseCode, results } =
        await InAppPurchases.getPurchaseHistoryAsync();
      const active = results?.some(
        (item: any) =>
          item.productId === SUBSCRIPTION_PRODUCT_ID && !item.acknowledged
      );
      setIapStatus(active ? "active" : "inactive");
    } catch (e: any) {
      setIapError(e.message || "Failed to check subscription");
      setIapStatus("unknown");
    } finally {
      setIapLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleIapSubscribe = async () => {
    setIapLoading(true);
    setIapError(null);
    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync([
        SUBSCRIPTION_PRODUCT_ID,
      ]);
      if (
        responseCode !== InAppPurchases.IAPResponseCode.OK ||
        !results ||
        !results.length
      ) {
        throw new Error("Subscription product not found");
      }
      await InAppPurchases.purchaseItemAsync(SUBSCRIPTION_PRODUCT_ID);
      setTimeout(checkSubscription, 2000);
    } catch (e: any) {
      setIapError(e.message || "Purchase failed");
    } finally {
      setIapLoading(false);
    }
  };

  return (
    <View style={styles.sectionContent}>
      <Pressable
        style={[
          styles.button,
          iapLoading || iapStatus === "active" ? styles.buttonDisabled : null,
        ]}
        onPress={handleIapSubscribe}
        disabled={iapLoading || iapStatus === "active"}
        testID="iap-subscribe-button"
      >
        <Text style={styles.buttonText}>
          {iapLoading
            ? "Processing..."
            : iapStatus === "active"
            ? "Subscribed"
            : "Subscribe for $4.99/month"}
        </Text>
      </Pressable>
      {iapError && <Text style={styles.errorText}>{iapError}</Text>}
      <Text style={styles.infoText}>
        Secure payment via App Store / Google Play. Cancel anytime in your
        account settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 12,
    padding: 12,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#dc3545",
    textAlign: "center",
    marginTop: 8,
  },
  infoText: {
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
  },
});
