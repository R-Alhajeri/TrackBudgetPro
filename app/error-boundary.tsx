import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const IFRAME_ID = "alhajeritech-web-preview";

const webTargetOrigins = [
  "http://localhost:3000",
  "https://alhajeritech.com",
  "https://alhajeritech.app",
];

function sendErrorToIframeParent(error: any, errorInfo?: any) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    console.debug("Sending error to parent:", {
      error,
      errorInfo,
      referrer: document.referrer,
    });

    // Safely extract error message
    let errorMessage = "Unknown error";
    let errorStack = undefined;

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message || "An error occurred";
        errorStack = error.stack;
      } else if (typeof error === "object" && error !== null) {
        const errorObj = error as { message?: string; stack?: string };
        errorMessage = errorObj.message
          ? String(errorObj.message)
          : "An object error occurred";
        errorStack = errorObj.stack ? String(errorObj.stack) : undefined;
      } else {
        errorMessage = String(error);
      }
    }

    // Safely extract component stack
    let componentStack = undefined;
    if (
      errorInfo &&
      typeof errorInfo === "object" &&
      errorInfo !== null &&
      "componentStack" in errorInfo
    ) {
      componentStack = String(errorInfo.componentStack);
    }

    const errorPayload = {
      type: "ERROR",
      error: {
        message: errorMessage,
        stack: errorStack,
        componentStack: componentStack,
        timestamp: new Date().toISOString(),
      },
      iframeId: IFRAME_ID,
    };

    try {
      window.parent.postMessage(
        errorPayload,
        webTargetOrigins.includes(document.referrer) ? document.referrer : "*"
      );
    } catch (postMessageError) {
      console.error("Failed to send error to parent:", postMessageError);
    }
  }
}

if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener(
    "error",
    (event) => {
      event.preventDefault();
      const errorDetails = event.error || {
        message: event.message || "Unknown error",
        filename: event.filename || "Unknown file",
        lineno: event.lineno || "Unknown line",
        colno: event.colno || "Unknown column",
      };
      sendErrorToIframeParent(errorDetails);
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      event.preventDefault();
      const error = event.reason || new Error("Unhandled Promise Rejection");
      sendErrorToIframeParent(error);
    },
    true
  );

  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length > 0) {
      sendErrorToIframeParent(args.join(" "));
    }
    originalConsoleError.apply(console, args);
  };
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error | null) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Safely handle the error
    const safeError = error || new Error("Unknown error occurred");

    sendErrorToIframeParent(safeError, errorInfo);
    if (this.props.onError) {
      this.props.onError(safeError, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Safe error message extraction
      let errorMessage = "An unknown error occurred";

      if (this.state.error) {
        if (typeof this.state.error === "string") {
          errorMessage = this.state.error;
        } else if (this.state.error instanceof Error) {
          errorMessage = this.state.error.message || "An error occurred";
        } else if (
          typeof this.state.error === "object" &&
          this.state.error !== null
        ) {
          // Type guard to ensure we can access message property
          const errorObj = this.state.error as { message?: string };
          errorMessage = errorObj.message
            ? String(errorObj.message)
            : "An object error occurred";
        } else {
          errorMessage = String(this.state.error);
        }
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{errorMessage}</Text>
            {Platform.OS !== "web" && (
              <Text style={styles.description}>
                Please check your device logs for more details.
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 36,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ErrorBoundary;
