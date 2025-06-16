import { useState, useEffect, useRef } from "react";
import useSubscriptionStore from "../store/subscription-store";
import { trackEvent } from "../utils/analytics";

interface EngagementStage {
  stage: "initial" | "interested" | "engaged" | "committed" | "urgent";
  timeSpent: number;
  triggers: string[];
}

export const useEngagementTimer = () => {
  const { isGuestMode, isDemoMode } = useSubscriptionStore();
  const [timeSpent, setTimeSpent] = useState(0);
  const [engagementStage, setEngagementStage] =
    useState<EngagementStage["stage"]>("initial");
  const [interactionCount, setInteractionCount] = useState(0);
  const [triggerQueue, setTriggerQueue] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when in guest or demo mode
  useEffect(() => {
    if (isGuestMode || isDemoMode) {
      intervalRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isGuestMode, isDemoMode]);

  // Update engagement stage based on time and interactions
  useEffect(() => {
    const previousStage = engagementStage;
    let newStage: EngagementStage["stage"] = "initial";
    const newTriggers: string[] = [];

    // Time-based progression
    if (timeSpent >= 120) {
      // 2 minutes
      newStage = "interested";
      if (timeSpent === 120) newTriggers.push("time_2min");
    }

    if (timeSpent >= 300) {
      // 5 minutes
      newStage = "engaged";
      if (timeSpent === 300) newTriggers.push("time_5min");
    }

    if (timeSpent >= 600) {
      // 10 minutes
      newStage = "committed";
      if (timeSpent === 600) newTriggers.push("time_10min");
    }

    if (timeSpent >= 900) {
      // 15 minutes
      newStage = "urgent";
      if (timeSpent === 900) newTriggers.push("time_15min");
    }

    // Interaction-based progression
    if (interactionCount >= 3 && newStage === "initial") {
      newStage = "interested";
      newTriggers.push("interaction_3");
    }

    if (interactionCount >= 7 && newStage === "interested") {
      newStage = "engaged";
      newTriggers.push("interaction_7");
    }

    if (interactionCount >= 15) {
      newStage = "committed";
      newTriggers.push("interaction_15");
    }

    if (newStage !== previousStage) {
      setEngagementStage(newStage);

      // Track stage progression
      trackEvent("engagement_stage_progression", {
        previousStage,
        newStage,
        timeSpent,
        interactionCount,
        triggers: newTriggers,
      });
    }

    if (newTriggers.length > 0) {
      setTriggerQueue((prev) => [...prev, ...newTriggers]);
    }
  }, [timeSpent, interactionCount, engagementStage]);

  const recordInteraction = (interactionType: string, details?: any) => {
    setInteractionCount((prev) => prev + 1);

    trackEvent("guest_interaction", {
      interactionType,
      interactionCount: interactionCount + 1,
      timeSpent,
      engagementStage,
      ...details,
    });
  };

  const consumeTrigger = () => {
    setTriggerQueue((prev) => prev.slice(1));
    return triggerQueue[0] || null;
  };

  const getEngagementConfig = () => {
    switch (engagementStage) {
      case "interested":
        return {
          urgency: "low" as const,
          message: "You're exploring well!",
          cta: "Ready to save your progress?",
          showProgress: false,
          showPersistent: false,
        };
      case "engaged":
        return {
          urgency: "medium" as const,
          message: "Great progress so far!",
          cta: "Don't lose your data",
          showProgress: true,
          showPersistent: false,
        };
      case "committed":
        return {
          urgency: "high" as const,
          message: "You're really getting into this!",
          cta: "Save everything with an account",
          showProgress: true,
          showPersistent: false,
        };
      case "urgent":
        return {
          urgency: "high" as const,
          message: "Don't lose your progress!",
          cta: "Create account now",
          showProgress: true,
          showPersistent: true,
        };
      default:
        return {
          urgency: "low" as const,
          message: "Exploring in guest mode",
          cta: "Sign up for full access",
          showProgress: false,
          showPersistent: false,
        };
    }
  };

  return {
    timeSpent,
    engagementStage,
    interactionCount,
    triggerQueue,
    recordInteraction,
    consumeTrigger,
    getEngagementConfig,
    isActive: isGuestMode || isDemoMode,
  };
};
