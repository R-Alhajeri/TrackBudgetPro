# Store-Managed Subscription Tracking Guide

## Overview

When subscriptions are handled by App Store and Google Play Store, you have two options for tracking subscription analytics:

1. **No Backend Required**: Use built-in analytics from Apple App Store Connect and Google Play Console
2. **Custom Backend**: Implement server-to-server webhooks for real-time tracking in your own admin panel

## Option 1: No Backend Required (Recommended for Most Apps)

### Apple App Store Connect Analytics

**Access**: App Store Connect → My Apps → Your App

1. **App Analytics Dashboard**

   - Active subscribers count
   - New/cancelled subscribers
   - Revenue data by time period
   - Retention rates and churn analysis

2. **Sales and Trends**

   - Detailed subscription revenue
   - Export data as CSV/Excel
   - Filter by territory, time period
   - Refund tracking

3. **Subscription Dashboard**
   - Real-time subscription status
   - Revenue breakdowns by product
   - Subscriber lifecycle metrics

### Google Play Console Analytics

**Access**: Google Play Console → Your App

1. **Subscriptions Dashboard** (Monetization → Subscriptions)

   - Active subscribers count
   - Subscription events timeline
   - Revenue metrics
   - Churn analysis

2. **Financial Reports**

   - Detailed revenue breakdowns
   - Export capabilities
   - Tax and fee calculations
   - Payout information

3. **User Acquisition & Retention**
   - Conversion funnel analysis
   - Retention cohorts
   - Lifetime value metrics

### Benefits of Using Store Analytics:

- ✅ **No server costs** - Everything is provided by Apple/Google
- ✅ **No maintenance** - Stores handle all infrastructure
- ✅ **Always accurate** - Data comes directly from payment processing
- ✅ **Built-in tools** - Export, filtering, reporting features included
- ✅ **Official metrics** - Same data used for payouts and taxes

## Option 2: Custom Backend with Webhooks

### Architecture

```
App Store/Play Store → Webhook → Your Backend → Admin Panel
```

## 1. Apple App Store Integration

### Step 1: Configure App Store Server Notifications

1. **In App Store Connect:**

   - Go to your app → App Store Server Notifications
   - Set up your webhook URL: `https://yourdomain.com/api/subscription-webhooks/apple/webhook`
   - Choose notification types (recommended: all)

2. **Handle Webhook Events:**
   - `INITIAL_BUY` - New subscription
   - `DID_RENEW` - Subscription renewed
   - `EXPIRED` - Subscription expired
   - `DID_CHANGE_RENEWAL_STATUS` - Auto-renewal turned on/off
   - `REFUND` - Subscription refunded

### Step 2: Verify Apple Signatures

```typescript
import crypto from "crypto";

function verifyAppleSignature(payload: Buffer, signature: string): boolean {
  // Get Apple's public key from their API
  const publicKey = await getApplePublicKey();

  // Verify the signature
  const verify = crypto.createVerify("sha256");
  verify.update(payload);
  return verify.verify(publicKey, signature, "base64");
}
```

### Step 3: Decode JWS Tokens

```typescript
import jwt from "jsonwebtoken";

function decodeAppleJWT(token: string): any {
  // Apple uses JWS (JSON Web Signature)
  return jwt.decode(token);
}
```

## 2. Google Play Store Integration

### Step 1: Configure Pub/Sub Notifications

1. **In Google Cloud Console:**

   - Create a Pub/Sub topic
   - Create a subscription for your webhook endpoint
   - Set up service account with proper permissions

2. **In Google Play Console:**
   - Go to Monetization → Subscriptions
   - Configure Real-time developer notifications
   - Set your Pub/Sub topic

### Step 2: Handle Pub/Sub Messages

```typescript
// Notification types:
// 1: SUBSCRIPTION_RECOVERED
// 2: SUBSCRIPTION_RENEWED
// 3: SUBSCRIPTION_CANCELED
// 4: SUBSCRIPTION_PURCHASED
// 5: SUBSCRIPTION_ON_HOLD
// 6: SUBSCRIPTION_IN_GRACE_PERIOD
// 7: SUBSCRIPTION_RESTARTED
// 8: SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
// 9: SUBSCRIPTION_DEFERRED
// 10: SUBSCRIPTION_PAUSED
// 11: SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
// 12: SUBSCRIPTION_REVOKED
// 13: SUBSCRIPTION_EXPIRED
```

### Step 3: Validate with Google Play Developer API

```typescript
import { google } from "googleapis";

async function validateGoogleSubscription(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string
) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "path/to/service-account-key.json",
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  const androidpublisher = google.androidpublisher({
    version: "v3",
    auth,
  });

  const result = await androidpublisher.purchases.subscriptions.get({
    packageName,
    subscriptionId,
    token: purchaseToken,
  });

  return result.data;
}
```

## 3. Database Schema

### Subscription Records Table

```sql
CREATE TABLE subscription_records (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  subscription_id VARCHAR(255),
  product_id VARCHAR(255),
  platform ENUM('ios', 'android'),
  status ENUM('active', 'expired', 'cancelled', 'on_hold', 'in_grace_period'),
  purchase_date TIMESTAMP,
  expiry_date TIMESTAMP,
  auto_renewing BOOLEAN,
  original_transaction_id VARCHAR(255),
  last_notification_date TIMESTAMP,
  price_amount_micros BIGINT,
  price_currency_code VARCHAR(3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Subscription Events Table (for audit trail)

```sql
CREATE TABLE subscription_events (
  id VARCHAR(255) PRIMARY KEY,
  subscription_record_id VARCHAR(255),
  event_type VARCHAR(50),
  event_data JSON,
  platform ENUM('ios', 'android'),
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_record_id) REFERENCES subscription_records(id)
);
```

## 4. Admin Panel Analytics

### Real-time Metrics

```typescript
// Key metrics to track:
interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  onHoldSubscriptions: number;
  gracePeriodSubscriptions: number;

  // Platform breakdown
  iosSubscriptions: number;
  androidSubscriptions: number;

  // Revenue metrics
  monthlyRevenue: number;
  yearlyRevenue: number;

  // Performance metrics
  conversionRate: number;
  churnRate: number;
  averageLifetime: number;
}
```

### Revenue Calculations

```typescript
function calculateMonthlyRevenue(subscriptions: SubscriptionRecord[]): number {
  return subscriptions
    .filter((s) => s.status === "active")
    .reduce((total, sub) => {
      // Convert from micros (Google) or get from product catalog
      const monthlyAmount = sub.priceAmountMicros
        ? sub.priceAmountMicros / 1000000
        : getProductPrice(sub.productId);

      // Convert yearly to monthly equivalent
      if (sub.productId.includes("yearly")) {
        return total + monthlyAmount / 12;
      }

      return total + monthlyAmount;
    }, 0);
}
```

## 5. Error Handling & Monitoring

### Webhook Reliability

```typescript
// Implement retry logic for failed webhooks
async function processWebhookWithRetry(payload: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processWebhook(payload);
      return;
    } catch (error) {
      console.error(`Webhook processing failed (attempt ${attempt}):`, error);

      if (attempt === maxRetries) {
        // Send to dead letter queue or alert system
        await handleFailedWebhook(payload, error);
      } else {
        // Exponential backoff
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
}
```

### Monitoring & Alerts

```typescript
// Set up monitoring for:
// 1. Webhook failures
// 2. Subscription anomalies (sudden spikes in cancellations)
// 3. Revenue drops
// 4. Platform-specific issues

interface MonitoringAlert {
  type: "webhook_failure" | "high_churn" | "revenue_drop" | "validation_error";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  data: any;
  timestamp: Date;
}
```

## 6. Security Considerations

### Webhook Security

1. **Verify signatures** from Apple/Google
2. **Use HTTPS** for all webhook endpoints
3. **Implement rate limiting** to prevent abuse
4. **Log all webhook events** for audit trails
5. **Sanitize inputs** before database operations

### API Security

```typescript
// Implement authentication for admin endpoints
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

router.get("/analytics", adminAuth, getSubscriptionAnalytics);
```

## 7. Testing

### Webhook Testing

```typescript
// Use tools like ngrok for local development
// Test with Apple/Google sandbox environments

// Mock webhook events for testing
const mockAppleWebhook = {
  notificationType: "INITIAL_BUY",
  subtype: "",
  data: {
    signedTransactionInfo: "eyJ...", // JWT token
    signedRenewalInfo: "eyJ...",
  },
};
```

## 8. Production Deployment

### Environment Setup

```env
# Apple App Store
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=path_to_private_key

# Google Play
GOOGLE_SERVICE_ACCOUNT_KEY=path_to_service_account_json
GOOGLE_PACKAGE_NAME=com.yourapp.package

# Database
DATABASE_URL=your_database_connection_string

# Webhook URLs
APPLE_WEBHOOK_URL=https://yourdomain.com/api/subscription-webhooks/apple/webhook
GOOGLE_WEBHOOK_URL=https://yourdomain.com/api/subscription-webhooks/google/webhook
```

## Summary

This webhook-based approach provides:

✅ **Real-time subscription tracking** - Know immediately when subscriptions change
✅ **Accurate revenue reporting** - Based on actual store data, not client reports
✅ **Fraud prevention** - Server-side validation prevents manipulation
✅ **Comprehensive analytics** - Full visibility into subscription lifecycle
✅ **Platform-agnostic** - Works with both iOS and Android
✅ **Scalable** - Handles high-volume subscription events
✅ **Audit trail** - Complete history of all subscription events

The key is implementing both Apple and Google webhook handlers that validate, process, and store subscription events in real-time, giving your admin panel accurate, up-to-date subscription data directly from the stores themselves.
