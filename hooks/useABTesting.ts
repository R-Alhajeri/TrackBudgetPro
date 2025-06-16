import { useState, useEffect } from "react";
import { trackEvent } from "../utils/analytics";

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: any;
}

interface ABTest {
  testId: string;
  testName: string;
  variants: ABTestVariant[];
  isActive: boolean;
  targetUsers?: "guest" | "demo" | "all";
}

// Define A/B tests for different upgrade strategies
const activeTests: ABTest[] = [
  {
    testId: "upgrade_prompt_strategy",
    testName: "Upgrade Prompt Strategy",
    isActive: true,
    targetUsers: "all",
    variants: [
      {
        id: "control",
        name: "Standard Prompt",
        weight: 25,
        config: {
          style: "standard",
          urgency: "medium",
          socialProof: false,
          animationType: "slide",
          showProgress: false,
        },
      },
      {
        id: "social_proof",
        name: "Social Proof Emphasis",
        weight: 25,
        config: {
          style: "social",
          urgency: "medium",
          socialProof: true,
          animationType: "scale",
          showProgress: false,
          testimonials: true,
        },
      },
      {
        id: "urgency_driven",
        name: "Urgency Driven",
        weight: 25,
        config: {
          style: "urgent",
          urgency: "high",
          socialProof: false,
          animationType: "bounce",
          showProgress: true,
          limitedTime: true,
        },
      },
      {
        id: "value_focused",
        name: "Value Focused",
        weight: 25,
        config: {
          style: "value",
          urgency: "low",
          socialProof: true,
          animationType: "fade",
          showProgress: false,
          featureHighlight: true,
          roi: true,
        },
      },
    ],
  },
  {
    testId: "pricing_display",
    testName: "Pricing Display Strategy",
    isActive: true,
    targetUsers: "all",
    variants: [
      {
        id: "monthly_focus",
        name: "Monthly Price Focus",
        weight: 50,
        config: {
          primaryPricing: "monthly",
          showAnnualSavings: true,
          emphasizeValue: false,
        },
      },
      {
        id: "annual_focus",
        name: "Annual Savings Focus",
        weight: 50,
        config: {
          primaryPricing: "annual",
          showAnnualSavings: true,
          emphasizeValue: true,
          savingsHighlight: true,
        },
      },
    ],
  },
  {
    testId: "onboarding_flow",
    testName: "Guest Mode Onboarding",
    isActive: true,
    targetUsers: "guest",
    variants: [
      {
        id: "immediate_value",
        name: "Immediate Value Proposition",
        weight: 33,
        config: {
          showWelcomeGuide: true,
          highlightLimitations: false,
          focusOnBenefits: true,
          delayUpgradePrompt: false,
        },
      },
      {
        id: "progressive_disclosure",
        name: "Progressive Feature Disclosure",
        weight: 33,
        config: {
          showWelcomeGuide: false,
          highlightLimitations: true,
          focusOnBenefits: false,
          delayUpgradePrompt: true,
          progressiveRestrictions: true,
        },
      },
      {
        id: "hybrid_approach",
        name: "Hybrid Value + Restrictions",
        weight: 34,
        config: {
          showWelcomeGuide: true,
          highlightLimitations: true,
          focusOnBenefits: true,
          delayUpgradePrompt: false,
          progressiveRestrictions: false,
        },
      },
    ],
  },
];

export const useABTesting = () => {
  const [assignedVariants, setAssignedVariants] = useState<
    Record<string, string>
  >({});
  const [userId] = useState(() => {
    // Generate a consistent user ID for this session
    return Math.random().toString(36).substring(2, 15);
  });

  // Hash function for consistent assignment
  const hashUserId = (testId: string) => {
    let hash = 0;
    const str = userId + testId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Assign user to variant based on weighted distribution
  const assignVariant = (test: ABTest): string => {
    const hash = hashUserId(test.testId);
    const totalWeight = test.variants.reduce(
      (sum, variant) => sum + variant.weight,
      0
    );
    const position = hash % totalWeight;

    let currentPosition = 0;
    for (const variant of test.variants) {
      currentPosition += variant.weight;
      if (position < currentPosition) {
        return variant.id;
      }
    }

    return test.variants[0].id; // Fallback
  };

  // Initialize variant assignments
  useEffect(() => {
    const assignments: Record<string, string> = {};

    activeTests.forEach((test) => {
      if (test.isActive) {
        const variantId = assignVariant(test);
        assignments[test.testId] = variantId;

        // Track assignment
        trackEvent("ab_test_assignment", {
          testId: test.testId,
          testName: test.testName,
          variantId,
          variantName: test.variants.find((v) => v.id === variantId)?.name,
          userId,
        });
      }
    });

    setAssignedVariants(assignments);
  }, []);

  const getVariant = (testId: string): ABTestVariant | null => {
    const test = activeTests.find((t) => t.testId === testId);
    if (!test || !test.isActive) return null;

    const variantId = assignedVariants[testId];
    if (!variantId) return null;

    return test.variants.find((v) => v.id === variantId) || null;
  };

  const getConfig = (testId: string): any => {
    const variant = getVariant(testId);
    return variant?.config || {};
  };

  const trackConversion = (
    testId: string,
    conversionType: string,
    value?: number
  ) => {
    const variant = getVariant(testId);
    if (!variant) return;

    trackEvent("ab_test_conversion", {
      testId,
      variantId: variant.id,
      variantName: variant.name,
      conversionType,
      value,
      userId,
    });
  };

  const trackInteraction = (
    testId: string,
    interactionType: string,
    details?: any
  ) => {
    const variant = getVariant(testId);
    if (!variant) return;

    trackEvent("ab_test_interaction", {
      testId,
      variantId: variant.id,
      variantName: variant.name,
      interactionType,
      userId,
      ...details,
    });
  };

  // Specific helpers for upgrade prompt testing
  const getUpgradePromptConfig = () => {
    return getConfig("upgrade_prompt_strategy");
  };

  const getPricingConfig = () => {
    return getConfig("pricing_display");
  };

  const getOnboardingConfig = () => {
    return getConfig("onboarding_flow");
  };

  const isInVariant = (testId: string, variantId: string): boolean => {
    return assignedVariants[testId] === variantId;
  };

  return {
    getVariant,
    getConfig,
    getUpgradePromptConfig,
    getPricingConfig,
    getOnboardingConfig,
    isInVariant,
    trackConversion,
    trackInteraction,
    assignedVariants,
    activeTests,
  };
};
