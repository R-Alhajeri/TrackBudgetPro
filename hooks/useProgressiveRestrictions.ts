import { useState, useEffect, useCallback, useMemo } from "react";
import useSubscriptionStore from "../store/subscription-store";
import useAuthStore from "../store/auth-store";
import useBudgetStore from "../store/budget-store";
import { trackEvent } from "../utils/analytics";

interface RestrictionConfig {
  categoryLimit: number;
  transactionLimit: number;
  exportAllowed: boolean;
  analyticsAllowed: boolean;
  syncAllowed: boolean;
  timeBasedRestrictions: boolean;
}

export const useProgressiveRestrictions = () => {
  const { isGuestMode, isDemoMode, isSubscribed } = useSubscriptionStore();
  const { userRole } = useAuthStore();
  const { categories, transactions } = useBudgetStore();
  const [sessionStartTime] = useState(Date.now());
  const [initialLimits] = useState<RestrictionConfig>({
    categoryLimit: 3, // Free account limit
    transactionLimit: 15, // Free account limit
    exportAllowed: true,
    analyticsAllowed: true,
    syncAllowed: false, // Free accounts don't get cloud sync
    timeBasedRestrictions: false,
  });

  const isAdmin = userRole === "admin";

  const getTimeSpentMinutes = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / (1000 * 60));
  }, [sessionStartTime]);

  const getCurrentRestrictions = useCallback((): RestrictionConfig => {
    // Admins have unlimited access
    if (isAdmin) {
      return {
        categoryLimit: Infinity,
        transactionLimit: Infinity,
        exportAllowed: true,
        analyticsAllowed: true,
        syncAllowed: true,
        timeBasedRestrictions: false,
      };
    }

    if (isSubscribed) {
      return {
        categoryLimit: Infinity,
        transactionLimit: Infinity,
        exportAllowed: true,
        analyticsAllowed: true,
        syncAllowed: true,
        timeBasedRestrictions: false,
      };
    }

    if (!isGuestMode && !isDemoMode) {
      // Free account (registered user)
      return {
        categoryLimit: 3, // Free account limit: 3 categories
        transactionLimit: 15, // Free account limit: 15 transactions
        exportAllowed: true,
        analyticsAllowed: true,
        syncAllowed: false, // Cloud sync is premium only
        timeBasedRestrictions: false,
      };
    }

    const timeSpent = getTimeSpentMinutes();
    const interactionCount = categories.length + transactions.length;

    // Progressive tightening based on time and usage for guest/demo mode
    let restrictions: RestrictionConfig = {
      categoryLimit: 2, // Start more restrictive for guests
      transactionLimit: 8, // Start more restrictive for guests
      exportAllowed: true,
      analyticsAllowed: true,
      syncAllowed: false,
      timeBasedRestrictions: false,
    };

    // After 5 minutes or 3 interactions, reduce limits further
    if (timeSpent >= 5 || interactionCount >= 3) {
      restrictions.categoryLimit = 2;
      restrictions.transactionLimit = 5;
    }

    // After 10 minutes or 6 interactions, further restrictions
    if (timeSpent >= 10 || interactionCount >= 6) {
      restrictions.categoryLimit = 1;
      restrictions.transactionLimit = 3;
      restrictions.exportAllowed = false;
    }

    // After 15 minutes or 10 interactions, heavy restrictions
    if (timeSpent >= 15 || interactionCount >= 10) {
      restrictions.categoryLimit = 1;
      restrictions.transactionLimit = 3;
      restrictions.exportAllowed = false;
      restrictions.analyticsAllowed = false;
      restrictions.timeBasedRestrictions = true;
    }

    return restrictions;
  }, [
    isAdmin,
    isSubscribed,
    isGuestMode,
    isDemoMode,
    categories.length,
    transactions.length,
    getTimeSpentMinutes,
  ]);

  const checkRestriction = useCallback(
    (
      action: keyof RestrictionConfig,
      currentUsage?: number
    ): { allowed: boolean; reason?: string; upgradePrompt?: string } => {
      // Admins always allowed
      if (isAdmin) {
        return { allowed: true };
      }

      const restrictions = getCurrentRestrictions();

      switch (action) {
        case "categoryLimit":
          const allowed = currentUsage
            ? currentUsage < restrictions.categoryLimit
            : true;
          return {
            allowed,
            reason: allowed
              ? undefined
              : `Limited to ${restrictions.categoryLimit} categories in ${
                  isGuestMode ? "guest" : isDemoMode ? "demo" : "free"
                } mode`,
            upgradePrompt:
              isGuestMode || isDemoMode
                ? "Create a free account for more categories"
                : "Upgrade to premium for unlimited categories",
          };

        case "transactionLimit":
          const transactionAllowed = currentUsage
            ? currentUsage < restrictions.transactionLimit
            : true;
          return {
            allowed: transactionAllowed,
            reason: transactionAllowed
              ? undefined
              : `Limited to ${restrictions.transactionLimit} transactions in ${
                  isGuestMode ? "guest" : isDemoMode ? "demo" : "free"
                } mode`,
            upgradePrompt:
              isGuestMode || isDemoMode
                ? "Create a free account for more transactions"
                : "Upgrade to premium for unlimited transactions",
          };

        case "exportAllowed":
          return {
            allowed: restrictions.exportAllowed,
            reason: restrictions.exportAllowed
              ? undefined
              : "Export feature locked in guest mode",
            upgradePrompt: "Export your data with a premium account",
          };

        case "analyticsAllowed":
          return {
            allowed: restrictions.analyticsAllowed,
            reason: restrictions.analyticsAllowed
              ? undefined
              : "Analytics locked after extended guest session",
            upgradePrompt: "Get detailed insights with an account",
          };

        case "syncAllowed":
          return {
            allowed: restrictions.syncAllowed,
            reason: restrictions.syncAllowed
              ? undefined
              : isGuestMode || isDemoMode
              ? "Cloud sync requires an account"
              : "Cloud sync is a premium feature",
            upgradePrompt:
              isGuestMode || isDemoMode
                ? "Create an account to sync your data"
                : "Upgrade to premium for cloud sync across devices",
          };

        default:
          return { allowed: true };
      }
    },
    [isAdmin, getCurrentRestrictions, isGuestMode, isDemoMode]
  );

  const trackRestrictionHit = useCallback(
    (action: keyof RestrictionConfig, currentUsage?: number) => {
      const restrictions = getCurrentRestrictions();
      const timeSpent = getTimeSpentMinutes();

      trackEvent("restriction_hit", {
        action,
        currentUsage,
        timeSpentMinutes: timeSpent,
        userType: isGuestMode ? "guest" : "demo",
        categoryCount: categories.length,
        transactionCount: transactions.length,
        restrictionLevel: restrictions.timeBasedRestrictions
          ? "heavy"
          : !restrictions.exportAllowed
          ? "medium"
          : "light",
      });
    },
    [
      getCurrentRestrictions,
      getTimeSpentMinutes,
      isGuestMode,
      categories.length,
      transactions.length,
    ]
  );

  const getProgressionMessage = useCallback(() => {
    const timeSpent = getTimeSpentMinutes();
    const restrictions = getCurrentRestrictions();

    if (restrictions.timeBasedRestrictions) {
      return {
        type: "urgent" as const,
        title: "Extended Guest Session",
        message: `You've been exploring for ${timeSpent} minutes. Don't lose your progress!`,
        cta: "Save Everything Now",
      };
    }

    if (!restrictions.exportAllowed) {
      return {
        type: "warning" as const,
        title: "Features Becoming Limited",
        message: `Some features are now locked after ${timeSpent} minutes of use.`,
        cta: "Unlock Full Access",
      };
    }

    if (restrictions.categoryLimit === 2) {
      return {
        type: "info" as const,
        title: "Enjoying the App?",
        message: `You've been exploring for ${timeSpent} minutes. Ready to save your progress?`,
        cta: "Create Account",
      };
    }

    return null;
  }, [getTimeSpentMinutes, getCurrentRestrictions]);

  return {
    getCurrentRestrictions,
    checkRestriction,
    trackRestrictionHit,
    getProgressionMessage,
    timeSpentMinutes: getTimeSpentMinutes(),
    isRestricted: isGuestMode || isDemoMode,
  };
};
