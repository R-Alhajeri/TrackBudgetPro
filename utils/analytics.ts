export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// In a real app, this would integrate with services like Mixpanel, Amplitude, or Firebase Analytics
class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        platform: "mobile", // or detect platform
      },
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Log to console in development
    if (__DEV__) {
      console.log("📊 Analytics Event:", analyticsEvent);
    }

    // In production, send to analytics service
    this.sendToAnalyticsService(analyticsEvent);
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    // In a real app, this would send to your analytics service
    // For now, we'll just store locally
    try {
      // Example: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) });
    } catch (error) {
      console.error("Failed to send analytics event:", error);
    }
  }

  // Subscription and conversion tracking
  trackSubscriptionConversion(
    source: string,
    variant?: string,
    properties?: Record<string, any>
  ) {
    this.track("subscription_conversion", {
      source,
      variant,
      ...properties,
    });
  }

  trackUpgradePrompt(
    trigger: string,
    shown: boolean = true,
    properties?: Record<string, any>
  ) {
    this.track("upgrade_prompt", {
      trigger,
      shown,
      ...properties,
    });
  }

  trackRestrictionHit(restriction: string, properties?: Record<string, any>) {
    this.track("restriction_hit", {
      restriction,
      ...properties,
    });
  }

  trackEngagement(action: string, properties?: Record<string, any>) {
    this.track("user_engagement", {
      action,
      ...properties,
    });
  }

  trackABTest(
    testName: string,
    variant: string,
    properties?: Record<string, any>
  ) {
    this.track("ab_test_assignment", {
      testName,
      variant,
      ...properties,
    });
  }

  trackModalInteraction(
    modalType: string,
    action: "open" | "close" | "click",
    element?: string
  ) {
    this.track("modal_interaction", {
      modalType,
      action,
      element,
    });
  }

  trackFeatureUsage(feature: string, properties?: Record<string, any>) {
    this.track("feature_usage", {
      feature,
      ...properties,
    });
  }

  trackUserFlow(step: string, flow: string, properties?: Record<string, any>) {
    this.track("user_flow", {
      step,
      flow,
      ...properties,
    });
  }

  // Get analytics data for debugging or reporting
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  clearEvents() {
    this.events = [];
  }
}

// Create singleton instance
const analyticsManager = new AnalyticsManager();

// Export convenience functions
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  analyticsManager.track(event, properties);
};

export const trackSubscriptionConversion = (
  source: string,
  variant?: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackSubscriptionConversion(source, variant, properties);
};

export const trackUpgradePrompt = (
  trigger: string,
  shown: boolean = true,
  properties?: Record<string, any>
) => {
  analyticsManager.trackUpgradePrompt(trigger, shown, properties);
};

export const trackRestrictionHit = (
  restriction: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackRestrictionHit(restriction, properties);
};

export const trackEngagement = (
  action: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackEngagement(action, properties);
};

export const trackABTest = (
  testName: string,
  variant: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackABTest(testName, variant, properties);
};

export const trackModalInteraction = (
  modalType: string,
  action: "open" | "close" | "click",
  element?: string
) => {
  analyticsManager.trackModalInteraction(modalType, action, element);
};

export const trackFeatureUsage = (
  feature: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackFeatureUsage(feature, properties);
};

export const trackUserFlow = (
  step: string,
  flow: string,
  properties?: Record<string, any>
) => {
  analyticsManager.trackUserFlow(step, flow, properties);
};

export const setUserId = (userId: string) => {
  analyticsManager.setUserId(userId);
};

export const getAnalyticsEvents = () => {
  return analyticsManager.getEvents();
};

export const getSessionId = () => {
  return analyticsManager.getSessionId();
};

export const clearAnalyticsEvents = () => {
  analyticsManager.clearEvents();
};

export default analyticsManager;
