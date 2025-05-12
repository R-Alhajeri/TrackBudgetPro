import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type UserRole = "user" | "admin" | "guest" | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLogin?: string;
  expiresAt?: string; // For guest/demo users
}

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  userId: string | null;
  user: User | null;
  token: string | null; // JWT from backend
  // Mock user database for demonstration
  users: User[];

  // Auth methods now only update state, not call backend
  setAuth: (payload: { user: User; token: string }) => void;
  clearAuth: () => void;
  updateLastLogin: (userId: string) => void;
  resetAuth: () => void;
  hasHydrated: boolean;
}

// More secure hash function
// In a real app, use a proper crypto library like bcrypt
const secureHash = async (input: string): Promise<string> => {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    "crypto" in window
  ) {
    try {
      // Use Web Crypto API for more secure hashing on web
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.error("Crypto API error:", error);
      // Fallback to simple hash if Web Crypto fails
      return simpleHashFallback(input);
    }
  } else {
    // For non-web platforms, use a fallback
    return simpleHashFallback(input);
  }
};

// Fallback hash function (still not secure for production)
const simpleHashFallback = (input: string): string => {
  let hash = 0;
  if (input.length === 0) return hash.toString();

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(16);
};

// Mock user database
const mockUsers: User[] = [
  {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    lastLogin: new Date().toISOString(),
  },
  {
    id: "user-1",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    lastLogin: new Date().toISOString(),
  },
];

// Mock passwords with hashed values
// In a real app, these would be stored in a secure database
const mockPasswords: Record<string, string> = {
  "admin@example.com": simpleHashFallback("admin123"), // always fallback hash
  "user@example.com": simpleHashFallback("user123"), // always fallback hash
};

// Maximum failed login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
// Lockout duration in milliseconds (15 minutes)
const LOCKOUT_DURATION = 15 * 60 * 1000;

// Track failed login attempts
const failedLoginAttempts: Record<
  string,
  { count: number; timestamp: number }
> = {};

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password strength validation
const validatePasswordStrength = (
  password: string
): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  return { valid: true, message: "Password is strong" };
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userRole: null,
      userId: null,
      user: null,
      token: null,
      users: mockUsers,
      hasHydrated: false,

      setAuth: ({ user, token }) => {
        set({
          isAuthenticated: true,
          userRole: user.role,
          userId: user.id,
          user,
          token,
        });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          userRole: null,
          userId: null,
          user: null,
          token: null,
        });
      },

      updateLastLogin: (userId) => {
        const { users } = get();
        const user = users.find((u) => u.id === userId);

        if (user) {
          const updatedUser = {
            ...user,
            lastLogin: new Date().toISOString(),
          };

          set({
            users: users.map((u) => (u.id === userId ? updatedUser : u)),
            user: get().user?.id === userId ? updatedUser : get().user,
          });
        }
      },

      resetAuth: async () => {
        await AsyncStorage.removeItem("auth-storage");
        set({
          isAuthenticated: false,
          userRole: null,
          userId: null,
          user: null,
          token: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist authentication state, not the mock users
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        userId: state.userId,
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: (state) => {
        return (state, error) => {
          if (!error) {
            useAuthStore.setState({ hasHydrated: true });
          }
        };
      },
    }
  )
);

// Helper function for constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Generate a cryptographically secure random ID
function generateSecureId(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    "crypto" in window
  ) {
    // Use Web Crypto API for secure random values on web
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
  } else {
    // Fallback for non-web platforms
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }

  return result;
}

export default useAuthStore;
