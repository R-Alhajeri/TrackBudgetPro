import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as RNIap from "react-native-iap";
// TODO: Remove backend dependencies for no-backend approach
// import axios from "axios";

// Subscription product IDs
const SUBSCRIPTION_ID_MONTHLY_IOS =
  "com.alhajeritech.elegant_budget_tracker.premium_monthly";
const SUBSCRIPTION_ID_MONTHLY_ANDROID =
  "com.alhajeritech.elegant_budget_tracker.premium_monthly";
const SUBSCRIPTION_ID_YEARLY_IOS =
  "com.alhajeritech.elegant_budget_tracker.premium_yearly";
const SUBSCRIPTION_ID_YEARLY_ANDROID =
  "com.alhajeritech.elegant_budget_tracker.premium_yearly";

// Legacy constants for backward compatibility
const SUBSCRIPTION_ID_IOS = SUBSCRIPTION_ID_MONTHLY_IOS;
const SUBSCRIPTION_ID_ANDROID = SUBSCRIPTION_ID_MONTHLY_ANDROID;
const SUBSCRIPTION_PRICE = "$3.99";

// Subscription products organized by type and platform
const SUBSCRIPTION_PRODUCTS = {
  monthly: {
    ios: SUBSCRIPTION_ID_MONTHLY_IOS,
    android: SUBSCRIPTION_ID_MONTHLY_ANDROID,
  },
  yearly: {
    ios: SUBSCRIPTION_ID_YEARLY_IOS,
    android: SUBSCRIPTION_ID_YEARLY_ANDROID,
  },
};

// Subscription types and pricing
export type SubscriptionType = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  type: SubscriptionType;
  price: number;
  displayPrice: string;
  duration: string;
  savings?: string;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    type: "monthly",
    price: 3.99,
    displayPrice: "$3.99",
    duration: "month",
  },
  {
    id: "yearly",
    type: "yearly",
    price: 43.09,
    displayPrice: "$43.09",
    duration: "year",
    savings: "Save 10%",
    isPopular: true,
  },
];

// Purchase statuses
type PurchaseStatus = "idle" | "pending" | "completed" | "error";

interface SubscriptionState {
  isSubscribed: boolean;
  subscriptionExpiry: string | null; // ISO date string
  subscriptionType: SubscriptionType | null;
  isDemoMode: boolean;
  isGuestMode: boolean;
  subscriptionId: string | null;
  purchaseStatus: PurchaseStatus;
  errorMessage: string | null;
  subscriptionPrice: string;
  selectedPlan: SubscriptionPlan;

  initialize: () => Promise<void>;
  purchaseSubscription: (subscriptionType?: SubscriptionType) => Promise<void>;
  restorePurchases: () => Promise<void>;
  validateReceipt: (receipt: string, platform: string) => Promise<void>;
  setDemoMode: (isDemo: boolean) => void;
  setGuestMode: (isGuest: boolean) => void;
  setSelectedPlan: (plan: SubscriptionPlan) => void;
  checkSubscriptionStatus: () => boolean;
  getSubscriptionProductId: (type: SubscriptionType) => string;
}

const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isSubscribed: false,
      subscriptionExpiry: null,
      subscriptionType: null,
      isDemoMode: true,
      isGuestMode: false,
      subscriptionId: null,
      purchaseStatus: "idle",
      errorMessage: null,
      subscriptionPrice: SUBSCRIPTION_PRICE,
      selectedPlan: SUBSCRIPTION_PLANS[0], // Default to monthly plan

      getSubscriptionProductId: (type: SubscriptionType) => {
        const platform = Platform.OS;
        if (type === "monthly") {
          return platform === "ios"
            ? SUBSCRIPTION_PRODUCTS.monthly.ios
            : SUBSCRIPTION_PRODUCTS.monthly.android;
        } else {
          return platform === "ios"
            ? SUBSCRIPTION_PRODUCTS.yearly.ios
            : SUBSCRIPTION_PRODUCTS.yearly.android;
        }
      },

      initialize: async () => {
        try {
          // Initialize IAP module
          await RNIap.initConnection();

          // Get all subscription product IDs for current platform
          const currentPlatformIds = [
            get().getSubscriptionProductId("monthly"),
            get().getSubscriptionProductId("yearly"),
          ];

          const products = await RNIap.getProducts({
            skus: currentPlatformIds,
          });

          // Update subscription plans with actual prices
          if (products.length > 0) {
            const monthlyProduct = products.find((p) =>
              p.productId.includes("monthly")
            );
            const yearlyProduct = products.find((p) =>
              p.productId.includes("yearly")
            );

            if (monthlyProduct) {
              SUBSCRIPTION_PLANS[0].displayPrice =
                monthlyProduct.localizedPrice;
            }
            if (yearlyProduct) {
              SUBSCRIPTION_PLANS[1].displayPrice = yearlyProduct.localizedPrice;
            }
          }

          // Set up purchase listener
          const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
            async (purchase) => {
              try {
                // Determine subscription type from product ID
                let subscriptionType: SubscriptionType = "monthly";
                if (purchase.productId.includes("yearly")) {
                  subscriptionType = "yearly";
                }

                // TODO: Skip backend validation for no-backend approach
                // await get().validateReceipt(
                //   purchase.transactionReceipt,
                //   Platform.OS
                // );

                // For no-backend: Assume purchase is valid
                console.log(
                  "Purchase validation skipped for no-backend approach"
                );

                // Update subscription type
                set({ subscriptionType });

                // Finish the transaction
                if (Platform.OS === "ios") {
                  await RNIap.finishTransaction({
                    purchase,
                    isConsumable: false,
                  });
                } else {
                  await RNIap.acknowledgePurchaseAndroid({
                    token: purchase.purchaseToken!,
                  });
                }
              } catch (error) {
                console.error("Error processing purchase:", error);
                set({
                  purchaseStatus: "error",
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "Failed to process purchase",
                });
              }
            }
          );

          // Register an event handler for our cleanup needs
          const cleanup = () => {
            if (purchaseUpdateSubscription) {
              purchaseUpdateSubscription.remove();
            }
            RNIap.endConnection();
          };

          // Store cleanup function in global scope if needed
          (global as any).__iapCleanup = cleanup;
        } catch (error) {
          console.error("Error initializing IAP:", error);
          set({
            purchaseStatus: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to initialize in-app purchases",
          });
        }
      },

      purchaseSubscription: async (
        subscriptionType: SubscriptionType = "monthly"
      ) => {
        try {
          set({ purchaseStatus: "pending", errorMessage: null });

          const subscriptionId =
            get().getSubscriptionProductId(subscriptionType);

          // Update selected plan based on subscription type
          const selectedPlan = SUBSCRIPTION_PLANS.find(
            (plan) => plan.type === subscriptionType
          );
          if (selectedPlan) {
            set({ selectedPlan });
          }

          // Request purchase
          await RNIap.requestSubscription({ sku: subscriptionId });

          // Note: Purchase processing happens in the purchaseUpdatedListener
        } catch (error) {
          console.error("Error purchasing subscription:", error);
          set({
            purchaseStatus: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to purchase subscription",
          });
        }
      },

      restorePurchases: async () => {
        try {
          set({ purchaseStatus: "pending", errorMessage: null });

          // Get available purchases
          const purchases = await RNIap.getAvailablePurchases();

          // Find subscription purchases
          for (const purchase of purchases) {
            // Check if this is one of our subscription products
            const isMonthlySubscription =
              purchase.productId === get().getSubscriptionProductId("monthly");
            const isYearlySubscription =
              purchase.productId === get().getSubscriptionProductId("yearly");

            if (isMonthlySubscription || isYearlySubscription) {
              // Determine subscription type
              const subscriptionType: SubscriptionType = isYearlySubscription
                ? "yearly"
                : "monthly";

              // TODO: Skip backend validation for no-backend approach
              // await get().validateReceipt(
              //   purchase.transactionReceipt,
              //   Platform.OS
              // );

              // For no-backend: Set subscription as active
              console.log(
                "Restore purchase validation skipped for no-backend approach"
              );
              set({
                isSubscribed: true,
                subscriptionType,
                subscriptionExpiry: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
                isDemoMode: false,
                purchaseStatus: "completed",
              });

              // Update subscription type
              set({ subscriptionType });
            }
          }

          set({ purchaseStatus: "completed" });
        } catch (error) {
          console.error("Error restoring purchases:", error);
          set({
            purchaseStatus: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to restore purchases",
          });
        }
      },

      validateReceipt: async (receipt: string, platform: string) => {
        try {
          // TODO: For no-backend approach, skip server-side validation
          // In production, you might want to validate receipts client-side only
          // or use Apple/Google's built-in validation

          /* COMMENTED OUT: Backend validation for no-backend approach
          // Validate receipt with our backend
          const response = await axios.post("/api/payments/validate", {
            receipt,
            platform,
          });

          if (response.data.success) {
            const { expiryDate, subscriptionType } = response.data;
            set({
              isSubscribed: true,
              subscriptionExpiry: expiryDate,
              subscriptionType: subscriptionType || "monthly",
              isDemoMode: false,
              purchaseStatus: "completed",
            });
          } else {
            throw new Error("Invalid receipt");
          }
          */

          // For no-backend approach: Accept receipt as valid
          // Note: This is for demo purposes only. In production, implement proper validation
          console.log("Receipt validation skipped for no-backend approach");
          set({
            isSubscribed: true,
            subscriptionExpiry: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // 30 days from now
            subscriptionType: "monthly",
            isDemoMode: false,
            purchaseStatus: "completed",
          });
        } catch (error) {
          console.error("Receipt validation error:", error);
          set({
            purchaseStatus: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to validate receipt",
          });
        }
      },

      setDemoMode: (isDemo: boolean) => set({ isDemoMode: isDemo }),

      setGuestMode: (isGuest: boolean) =>
        set({ isGuestMode: isGuest, isDemoMode: isGuest }),

      setSelectedPlan: (plan: SubscriptionPlan) => set({ selectedPlan: plan }),

      checkSubscriptionStatus: () => {
        const { isSubscribed, subscriptionExpiry } = get();
        if (!isSubscribed || !subscriptionExpiry) return false;

        const expiryDate = new Date(subscriptionExpiry);
        const now = new Date();
        if (now > expiryDate) {
          set({
            isSubscribed: false,
            subscriptionExpiry: null,
            subscriptionType: null,
            isDemoMode: true,
          });
          return false;
        }
        return true;
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isSubscribed: state.isSubscribed,
        subscriptionExpiry: state.subscriptionExpiry,
        subscriptionType: state.subscriptionType,
        isDemoMode: state.isDemoMode,
        isGuestMode: state.isGuestMode,
        subscriptionPrice: state.subscriptionPrice,
        selectedPlan: state.selectedPlan,
        // Don't persist dynamic state like purchase status
      }),
    }
  )
);

export default useSubscriptionStore;
