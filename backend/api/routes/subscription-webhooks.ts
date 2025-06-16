import express from "express";
import type { Request, Response } from "express";
import crypto from "crypto";

const router = express.Router();

// Store for subscription data (in production, use a proper database)
interface SubscriptionRecord {
  userId: string;
  subscriptionId: string;
  productId: string;
  platform: "ios" | "android";
  status: "active" | "expired" | "cancelled" | "on_hold" | "in_grace_period";
  purchaseDate: string;
  expiryDate: string;
  autoRenewing: boolean;
  originalTransactionId?: string;
  lastNotificationDate: string;
  priceAmountMicros?: number;
  priceCurrencyCode?: string;
}

// In-memory store (replace with database in production)
const subscriptionStore = new Map<string, SubscriptionRecord>();

// Apple App Store Server Notifications
router.post(
  "/apple/webhook",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    try {
      // Verify the notification is from Apple
      const signature = req.headers["x-apple-signature"] as string;
      if (!verifyAppleSignature(req.body, signature)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const notification = JSON.parse(req.body.toString());
      const { notificationType, subtype, data } = notification;

      // Extract subscription information
      const transactionInfo = data?.signedTransactionInfo;
      const renewalInfo = data?.signedRenewalInfo;

      if (!transactionInfo) {
        return res.status(400).json({ error: "Missing transaction info" });
      }

      // Decode the JWT tokens (in production, use proper JWT library)
      const transaction = decodeAppleJWT(transactionInfo);
      const renewal = renewalInfo ? decodeAppleJWT(renewalInfo) : null;

      // Process different notification types
      switch (notificationType) {
        case "INITIAL_BUY":
          handleInitialPurchase(transaction, "ios");
          break;
        case "DID_RENEW":
          handleRenewal(transaction, "ios");
          break;
        case "EXPIRED":
          handleExpiration(transaction, "ios");
          break;
        case "DID_CHANGE_RENEWAL_STATUS":
          handleRenewalStatusChange(transaction, renewal, "ios");
          break;
        case "REFUND":
          handleRefund(transaction, "ios");
          break;
        default:
          console.log(`Unhandled notification type: ${notificationType}`);
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Apple webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Google Play Store Server Notifications
router.post(
  "/google/webhook",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    try {
      const pubSubMessage = JSON.parse(req.body.toString());
      const data = JSON.parse(
        Buffer.from(pubSubMessage.message.data, "base64").toString()
      );

      const { subscriptionNotification, packageName } = data;

      if (!subscriptionNotification) {
        return res
          .status(400)
          .json({ error: "Not a subscription notification" });
      }

      const { subscriptionId, purchaseToken, notificationType } =
        subscriptionNotification;

      // Process different notification types
      switch (notificationType) {
        case 1: // SUBSCRIPTION_RECOVERED
          handleGoogleSubscriptionRecover(subscriptionId, purchaseToken);
          break;
        case 2: // SUBSCRIPTION_RENEWED
          handleGoogleSubscriptionRenewal(subscriptionId, purchaseToken);
          break;
        case 3: // SUBSCRIPTION_CANCELED
          handleGoogleSubscriptionCancellation(subscriptionId, purchaseToken);
          break;
        case 4: // SUBSCRIPTION_PURCHASED
          handleGoogleSubscriptionPurchase(subscriptionId, purchaseToken);
          break;
        case 5: // SUBSCRIPTION_ON_HOLD
          handleGoogleSubscriptionOnHold(subscriptionId, purchaseToken);
          break;
        case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
          handleGoogleSubscriptionGracePeriod(subscriptionId, purchaseToken);
          break;
        case 7: // SUBSCRIPTION_RESTARTED
          handleGoogleSubscriptionRestart(subscriptionId, purchaseToken);
          break;
        case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
          handleGooglePriceChangeConfirmed(subscriptionId, purchaseToken);
          break;
        case 9: // SUBSCRIPTION_DEFERRED
          handleGoogleSubscriptionDeferred(subscriptionId, purchaseToken);
          break;
        case 10: // SUBSCRIPTION_PAUSED
          handleGoogleSubscriptionPaused(subscriptionId, purchaseToken);
          break;
        case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
          handleGooglePauseScheduleChanged(subscriptionId, purchaseToken);
          break;
        case 12: // SUBSCRIPTION_REVOKED
          handleGoogleSubscriptionRevoked(subscriptionId, purchaseToken);
          break;
        case 13: // SUBSCRIPTION_EXPIRED
          handleGoogleSubscriptionExpired(subscriptionId, purchaseToken);
          break;
        default:
          console.log(
            `Unhandled Google notification type: ${notificationType}`
          );
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Google webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get subscription analytics for admin panel
router.get("/analytics", (req: Request, res: Response) => {
  try {
    const subscriptions = Array.from(subscriptionStore.values());

    const analytics = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === "active")
        .length,
      expiredSubscriptions: subscriptions.filter((s) => s.status === "expired")
        .length,
      cancelledSubscriptions: subscriptions.filter(
        (s) => s.status === "cancelled"
      ).length,
      onHoldSubscriptions: subscriptions.filter((s) => s.status === "on_hold")
        .length,
      gracePeriodSubscriptions: subscriptions.filter(
        (s) => s.status === "in_grace_period"
      ).length,

      // Platform breakdown
      iosSubscriptions: subscriptions.filter((s) => s.platform === "ios")
        .length,
      androidSubscriptions: subscriptions.filter(
        (s) => s.platform === "android"
      ).length,

      // Revenue calculations (simplified)
      monthlyRevenue: calculateMonthlyRevenue(subscriptions),

      // Recent activity
      recentSubscriptions: subscriptions
        .sort(
          (a, b) =>
            new Date(b.lastNotificationDate).getTime() -
            new Date(a.lastNotificationDate).getTime()
        )
        .slice(0, 10),
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// Helper functions for Apple webhooks
function verifyAppleSignature(payload: Buffer, signature: string): boolean {
  // In production, implement proper Apple signature verification
  // This requires Apple's public key and proper cryptographic verification
  return true; // Placeholder
}

function decodeAppleJWT(token: string): any {
  // In production, use a proper JWT library to decode and verify Apple's JWTs
  // This is a simplified placeholder
  const base64Payload = token.split(".")[1];
  return JSON.parse(Buffer.from(base64Payload, "base64").toString());
}

function handleInitialPurchase(transaction: any, platform: "ios" | "android") {
  const subscription: SubscriptionRecord = {
    userId: transaction.webOrderLineItemId || transaction.originalTransactionId,
    subscriptionId: transaction.originalTransactionId,
    productId: transaction.productId,
    platform,
    status: "active",
    purchaseDate: new Date(transaction.purchaseDate * 1000).toISOString(),
    expiryDate: new Date(transaction.expiresDate * 1000).toISOString(),
    autoRenewing: true,
    originalTransactionId: transaction.originalTransactionId,
    lastNotificationDate: new Date().toISOString(),
  };

  subscriptionStore.set(subscription.subscriptionId, subscription);
  console.log("Initial purchase recorded:", subscription);
}

function handleRenewal(transaction: any, platform: "ios" | "android") {
  const subscriptionId = transaction.originalTransactionId;
  const existing = subscriptionStore.get(subscriptionId);

  if (existing) {
    existing.status = "active";
    existing.expiryDate = new Date(
      transaction.expiresDate * 1000
    ).toISOString();
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(subscriptionId, existing);
    console.log("Subscription renewed:", existing);
  }
}

function handleExpiration(transaction: any, platform: "ios" | "android") {
  const subscriptionId = transaction.originalTransactionId;
  const existing = subscriptionStore.get(subscriptionId);

  if (existing) {
    existing.status = "expired";
    existing.autoRenewing = false;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(subscriptionId, existing);
    console.log("Subscription expired:", existing);
  }
}

function handleRenewalStatusChange(
  transaction: any,
  renewal: any,
  platform: "ios" | "android"
) {
  const subscriptionId = transaction.originalTransactionId;
  const existing = subscriptionStore.get(subscriptionId);

  if (existing && renewal) {
    existing.autoRenewing = renewal.autoRenewStatus === 1;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(subscriptionId, existing);
    console.log("Renewal status changed:", existing);
  }
}

function handleRefund(transaction: any, platform: "ios" | "android") {
  const subscriptionId = transaction.originalTransactionId;
  const existing = subscriptionStore.get(subscriptionId);

  if (existing) {
    existing.status = "cancelled";
    existing.autoRenewing = false;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(subscriptionId, existing);
    console.log("Subscription refunded:", existing);
  }
}

// Helper functions for Google webhooks
async function handleGoogleSubscriptionPurchase(
  subscriptionId: string,
  purchaseToken: string
) {
  // Validate with Google Play Developer API
  const subscriptionData = await validateGoogleSubscription(
    subscriptionId,
    purchaseToken
  );

  if (subscriptionData) {
    const subscription: SubscriptionRecord = {
      userId: subscriptionData.obfuscatedExternalAccountId || purchaseToken,
      subscriptionId: purchaseToken,
      productId: subscriptionId,
      platform: "android",
      status: "active",
      purchaseDate: new Date(
        parseInt(subscriptionData.startTimeMillis)
      ).toISOString(),
      expiryDate: new Date(
        parseInt(subscriptionData.expiryTimeMillis)
      ).toISOString(),
      autoRenewing: subscriptionData.autoRenewing,
      lastNotificationDate: new Date().toISOString(),
      priceAmountMicros: subscriptionData.priceAmountMicros,
      priceCurrencyCode: subscriptionData.priceCurrencyCode,
    };

    subscriptionStore.set(subscription.subscriptionId, subscription);
    console.log("Google subscription purchased:", subscription);
  }
}

async function handleGoogleSubscriptionRenewal(
  subscriptionId: string,
  purchaseToken: string
) {
  const subscriptionData = await validateGoogleSubscription(
    subscriptionId,
    purchaseToken
  );
  const existing = subscriptionStore.get(purchaseToken);

  if (existing && subscriptionData) {
    existing.status = "active";
    existing.expiryDate = new Date(
      parseInt(subscriptionData.expiryTimeMillis)
    ).toISOString();
    existing.autoRenewing = subscriptionData.autoRenewing;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(purchaseToken, existing);
    console.log("Google subscription renewed:", existing);
  }
}

async function handleGoogleSubscriptionCancellation(
  subscriptionId: string,
  purchaseToken: string
) {
  const existing = subscriptionStore.get(purchaseToken);

  if (existing) {
    existing.status = "cancelled";
    existing.autoRenewing = false;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(purchaseToken, existing);
    console.log("Google subscription cancelled:", existing);
  }
}

async function handleGoogleSubscriptionExpired(
  subscriptionId: string,
  purchaseToken: string
) {
  const existing = subscriptionStore.get(purchaseToken);

  if (existing) {
    existing.status = "expired";
    existing.autoRenewing = false;
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(purchaseToken, existing);
    console.log("Google subscription expired:", existing);
  }
}

async function handleGoogleSubscriptionOnHold(
  subscriptionId: string,
  purchaseToken: string
) {
  const existing = subscriptionStore.get(purchaseToken);

  if (existing) {
    existing.status = "on_hold";
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(purchaseToken, existing);
    console.log("Google subscription on hold:", existing);
  }
}

async function handleGoogleSubscriptionGracePeriod(
  subscriptionId: string,
  purchaseToken: string
) {
  const existing = subscriptionStore.get(purchaseToken);

  if (existing) {
    existing.status = "in_grace_period";
    existing.lastNotificationDate = new Date().toISOString();
    subscriptionStore.set(purchaseToken, existing);
    console.log("Google subscription in grace period:", existing);
  }
}

// Placeholder implementations for other Google handlers
async function handleGoogleSubscriptionRecover(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle subscription recovery
}

async function handleGoogleSubscriptionRestart(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle subscription restart
}

async function handleGooglePriceChangeConfirmed(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle price change confirmation
}

async function handleGoogleSubscriptionDeferred(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle subscription deferral
}

async function handleGoogleSubscriptionPaused(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle subscription pause
}

async function handleGooglePauseScheduleChanged(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle pause schedule change
}

async function handleGoogleSubscriptionRevoked(
  subscriptionId: string,
  purchaseToken: string
) {
  // Handle subscription revocation
}

// Google Play Developer API validation
async function validateGoogleSubscription(
  subscriptionId: string,
  purchaseToken: string
) {
  // In production, make API call to Google Play Developer API
  // This requires proper authentication and the Google Play Developer API

  // Placeholder implementation
  return {
    startTimeMillis: Date.now().toString(),
    expiryTimeMillis: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
    autoRenewing: true,
    priceAmountMicros: 3990000, // $3.99 in micros
    priceCurrencyCode: "USD",
    obfuscatedExternalAccountId: `user_${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  };
}

function calculateMonthlyRevenue(subscriptions: SubscriptionRecord[]): number {
  // Simplified revenue calculation
  // In production, you'd need to account for different subscription tiers, currencies, etc.
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  );

  return activeSubscriptions.reduce((total, sub) => {
    if (sub.priceAmountMicros) {
      return total + sub.priceAmountMicros / 1000000; // Convert from micros
    }
    // Fallback pricing if not available
    return total + (sub.productId.includes("yearly") ? 43.09 / 12 : 3.99);
  }, 0);
}

export default router;
