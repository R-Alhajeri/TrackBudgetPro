import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, AppState } from "react-native";
import useThemeStore from "@/store/theme-store";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ErrorBoundary } from "./error-boundary";
import { trpc, trpcClient } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TooltipBanner from "@/components/TooltipBanner";
import useTooltipStore from "@/store/tooltip-store";

// Custom error fallback component
function ErrorFallback({
  error,
  retry,
}: {
  error: Error | unknown;
  retry: () => void;
}) {
  const router = useRouter();

  // Safely extract error message with proper type checking
  let errorMessage = "An unknown error occurred";

  if (error) {
    if (typeof error === "string") {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || "An error occurred";
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.retryButton} onPress={retry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
        <Pressable
          style={styles.homeButton}
          onPress={() => {
            router.replace("/");
            setTimeout(retry, 100);
          }}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme, setTheme } = useThemeStore();
  const [rateLimitBanner, setRateLimitBanner] = useState(false);
  const rateLimitBannerShown = useTooltipStore((s) => s.rateLimitBannerShown);
  const setRateLimitBannerShown = useTooltipStore(
    (s) => s.setRateLimitBannerShown
  );

  // Set theme based on system preference on first load
  useEffect(() => {
    if (theme === "system" && colorScheme) {
      setTheme(colorScheme === "dark" ? "dark" : "light");
    }
  }, [colorScheme, theme, setTheme]);

  // Initialize Query Client for React Query (used by TRPC)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  // Listen for tRPC 429 errors globally
  useEffect(() => {
    const origConsoleError = console.error;
    const handler = (msg?: any) => {
      if (
        typeof msg === "string" &&
        msg.includes("TRPC HTTP Error: 429") &&
        !rateLimitBannerShown
      ) {
        setRateLimitBanner(true);
        setRateLimitBannerShown(true);
      }
    };
    console.error = function (...args) {
      handler(args[0]);
      origConsoleError.apply(console, args);
    };
    return () => {
      console.error = origConsoleError;
    };
  }, [rateLimitBannerShown, setRateLimitBannerShown]);

  // Hide banner on app background (optional UX)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") setRateLimitBanner(false);
    });
    return () => sub.remove();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipBanner
          message="Too many requests. Please wait a moment before trying again."
          visible={rateLimitBanner}
          onClose={() => setRateLimitBanner(false)}
          type="error"
        />
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error("Error caught by ErrorBoundary:", error, errorInfo);
          }}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen
              name="category/[id]"
              options={{ title: "Category Details" }}
            />
            <Stack.Screen
              name="receipt/[id]"
              options={{ title: "Receipt Details" }}
            />
          </Stack>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#dc3545",
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#343a40",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 8,
  },
  homeButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
