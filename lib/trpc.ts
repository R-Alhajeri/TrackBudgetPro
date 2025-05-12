import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import useAuthStore from "@/store/auth-store";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Use environment variable if available
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback to a safe default if the environment variable is not set
  if (__DEV__) {
    // Set your Mac's LAN IP here for testing on physical devices
    const LAN_IP = "192.168.8.185";

    // For web
    if (Platform.OS === "web") {
      return "http://localhost:3000";
    }

    // For iOS
    if (Platform.OS === "ios") {
      // Comment/uncomment the appropriate line:
      return "http://localhost:3000"; // For iOS simulator
      // return `http://${LAN_IP}:3000`; // For physical iOS device
    }

    // For Android
    if (Platform.OS === "android") {
      // Comment/uncomment the appropriate line:
      return "http://10.0.2.2:3000"; // For Android emulator
      // return `http://${LAN_IP}:3000`; // For physical Android device
    }
  }

  // Production fallback
  return "https://api.example.com";
};

// Create a secure TRPC client with proper error handling and batching
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        // Add auth token if available
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, {
            ...options,
            // Add security headers
            headers: {
              ...options?.headers,
              "Content-Security-Policy": "default-src 'self'",
              "X-Content-Type-Options": "nosniff",
            },
          });

          if (!response.ok) {
            console.error(
              `TRPC HTTP Error: ${response.status} ${response.statusText}`
            );
            const errorData = await response.json().catch(() => ({}));
            console.error("TRPC Error Data:", errorData);
            throw new Error(
              errorData.message || `HTTP error ${response.status}`
            );
          }

          return response;
        } catch (error) {
          console.error("TRPC Request Failed:", error);
          throw error;
        }
      },
    }),
  ],
});

// Helper function to get auth token
function getAuthToken(): string | null {
  // Use Zustand store to get the JWT if available
  try {
    // Use a synchronous getter to avoid React hook rules
    const state = useAuthStore.getState();
    return state.token || null;
  } catch (error) {
    console.error("Error getting auth token from store:", error);
    return null;
  }
}
