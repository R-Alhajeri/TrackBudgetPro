import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import firebaseAdmin from "../lib/firebaseAdmin";

// Define AdminUser interface locally
interface AdminUser {
  uid: string;
  email?: string;
  displayName?: string;
  disabled: boolean;
  customClaims?: Record<string, any>;
  metadata?: {
    creationTime: string;
    lastSignInTime?: string;
  };
}

type UserRole = "user" | "admin" | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLogin?: string;
  status?: "active" | "inactive"; // Add status for admin panel
  subscriptionStatus?: "active" | "trial" | "expired" | "canceled";
  subscriptionType?: "monthly" | "yearly"; // Add subscription type for admin panel
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  totalRevenue?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  userId: string | null;
  user: User | null;
  // Mock user database for demonstration (legacy - will be replaced by Firebase)
  users: User[];
  // Firebase users for admin panel
  firebaseUsers: AdminUser[];
  usersLoading: boolean;

  // Auth methods
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateLastLogin: (userId: string) => void;
  resetAuth: () => void;

  // ADMIN ACTIONS (Legacy - using mock data)
  setUserStatus: (userId: string, status: "active" | "inactive") => void;
  resetUserPassword: (userId: string) => Promise<string>;
  exportUserData: (userId: string, userTransactions: any[]) => string;

  // FIREBASE ADMIN ACTIONS (Real Firebase operations)
  fetchFirebaseUsers: () => Promise<void>;
  updateFirebaseUser: (
    uid: string,
    updateData: {
      displayName?: string;
      disabled?: boolean;
      customClaims?: Record<string, any>;
    }
  ) => Promise<void>;
  disableFirebaseUser: (uid: string) => Promise<void>;
  enableFirebaseUser: (uid: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  deleteFirebaseUser: (uid: string) => Promise<void>;
  setUserRole: (uid: string, role: string) => Promise<void>;
  searchFirebaseUsers: (searchTerm: string) => Promise<AdminUser[]>;
  getFirebaseUserAnalytics: () => Promise<any>;
  getFirebaseSubscriptionAnalytics: () => Promise<any>;
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
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "yearly",
    subscriptionStart: "2024-01-15",
    subscriptionExpiry: "2025-01-15",
    totalRevenue: 43.09,
  },
  {
    id: "user-1",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    lastLogin: new Date().toISOString(),
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "monthly",
    subscriptionStart: "2024-11-01",
    subscriptionExpiry: "2024-12-01",
    totalRevenue: 3.99,
  },
  {
    id: "user-2",
    email: "sarah.johnson@example.com",
    name: "Sarah Johnson",
    role: "user",
    lastLogin: "2024-12-01T10:30:00.000Z",
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "yearly",
    subscriptionStart: "2024-06-01",
    subscriptionExpiry: "2025-06-01",
    totalRevenue: 43.09,
  },
  {
    id: "user-3",
    email: "mike.chen@example.com",
    name: "Mike Chen",
    role: "user",
    lastLogin: "2024-11-28T14:15:00.000Z",
    status: "active",
    subscriptionStatus: "trial",
    subscriptionStart: "2024-11-20",
    subscriptionExpiry: "2024-12-05",
    totalRevenue: 0,
  },
  {
    id: "user-4",
    email: "emma.davis@example.com",
    name: "Emma Davis",
    role: "user",
    lastLogin: "2024-11-25T09:45:00.000Z",
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "monthly",
    subscriptionStart: "2024-10-15",
    subscriptionExpiry: "2024-12-15",
    totalRevenue: 7.98, // 2 months
  },
  {
    id: "user-5",
    email: "alex.martinez@example.com",
    name: "Alex Martinez",
    role: "user",
    lastLogin: "2024-11-20T16:20:00.000Z",
    status: "active",
    subscriptionStatus: "canceled",
    subscriptionType: "monthly",
    subscriptionStart: "2024-09-01",
    subscriptionExpiry: "2024-11-01",
    totalRevenue: 7.98, // 2 months before canceling
  },
  {
    id: "user-6",
    email: "lisa.wong@example.com",
    name: "Lisa Wong",
    role: "user",
    lastLogin: "2024-12-02T11:00:00.000Z",
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "yearly",
    subscriptionStart: "2024-03-01",
    subscriptionExpiry: "2025-03-01",
    totalRevenue: 43.09,
  },
  {
    id: "user-7",
    email: "david.kim@example.com",
    name: "David Kim",
    role: "user",
    lastLogin: "2024-11-30T08:30:00.000Z",
    status: "active",
    subscriptionStatus: "trial",
    subscriptionStart: "2024-11-25",
    subscriptionExpiry: "2024-12-10",
    totalRevenue: 0,
  },
  {
    id: "user-8",
    email: "rachel.brown@example.com",
    name: "Rachel Brown",
    role: "user",
    lastLogin: "2024-11-27T13:45:00.000Z",
    status: "active",
    subscriptionStatus: "active",
    subscriptionType: "monthly",
    subscriptionStart: "2024-11-01",
    subscriptionExpiry: "2024-12-01",
    totalRevenue: 3.99,
  },
];

// Mock passwords with hashed values
// In a real app, these would be stored in a secure database
const mockPasswords: Record<string, string> = {
  "admin@example.com": simpleHashFallback("admin123"),
  "user@example.com": simpleHashFallback("user123"),
  "sarah.johnson@example.com": simpleHashFallback("demo123"),
  "mike.chen@example.com": simpleHashFallback("demo123"),
  "emma.davis@example.com": simpleHashFallback("demo123"),
  "alex.martinez@example.com": simpleHashFallback("demo123"),
  "lisa.wong@example.com": simpleHashFallback("demo123"),
  "david.kim@example.com": simpleHashFallback("demo123"),
  "rachel.brown@example.com": simpleHashFallback("demo123"),
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
      users: mockUsers,
      firebaseUsers: [],
      usersLoading: false,

      login: async (email, password) => {
        try {
          // Input validation
          if (!email || !password) {
            return false;
          }

          // Sanitize email input
          const sanitizedEmail = email.trim().toLowerCase();

          // Validate email format
          if (!EMAIL_REGEX.test(sanitizedEmail)) {
            return false;
          }

          // Check for account lockout
          const now = Date.now();
          if (
            failedLoginAttempts[sanitizedEmail] &&
            failedLoginAttempts[sanitizedEmail].count >= MAX_LOGIN_ATTEMPTS &&
            now - failedLoginAttempts[sanitizedEmail].timestamp <
              LOCKOUT_DURATION
          ) {
            // Account is temporarily locked
            return false;
          }

          // Find user by email
          const user = mockUsers.find(
            (u) => u.email.toLowerCase() === sanitizedEmail
          );

          // If user doesn't exist, increment failed attempts
          if (!user) {
            if (!failedLoginAttempts[sanitizedEmail]) {
              failedLoginAttempts[sanitizedEmail] = {
                count: 0,
                timestamp: now,
              };
            }
            failedLoginAttempts[sanitizedEmail].count += 1;
            failedLoginAttempts[sanitizedEmail].timestamp = now;
            return false;
          }

          // Get stored password hash
          const storedHash = mockPasswords[user.email];

          // Hash the provided password
          const passwordHash = await secureHash(password);

          // Verify password with constant-time comparison to prevent timing attacks
          const passwordsMatch = constantTimeCompare(passwordHash, storedHash);

          if (passwordsMatch) {
            // Reset failed login attempts on successful login
            if (failedLoginAttempts[sanitizedEmail]) {
              delete failedLoginAttempts[sanitizedEmail];
            }

            // Update last login time
            const updatedUser = {
              ...user,
              lastLogin: new Date().toISOString(),
            };

            set({
              isAuthenticated: true,
              userRole: updatedUser.role,
              userId: updatedUser.id,
              user: updatedUser,
              users: get().users.map((u) =>
                u.id === updatedUser.id ? updatedUser : u
              ),
            });

            // Update subscription store when user logs in
            // Import subscription store dynamically to avoid circular dependency
            import("./subscription-store")
              .then(({ default: useSubscriptionStore }) => {
                const subscriptionStore = useSubscriptionStore.getState();

                // If user is admin or has valid subscription, disable guest mode
                if (
                  updatedUser.role === "admin" ||
                  updatedUser.subscriptionStatus === "active"
                ) {
                  subscriptionStore.setGuestMode(false);
                  subscriptionStore.setDemoMode(false);
                } else {
                  // Regular users without subscription stay in demo mode
                  subscriptionStore.setGuestMode(false);
                  subscriptionStore.setDemoMode(true);
                }
              })
              .catch(console.error);

            return true;
          }

          // Increment failed login attempts
          if (!failedLoginAttempts[sanitizedEmail]) {
            failedLoginAttempts[sanitizedEmail] = { count: 0, timestamp: now };
          }
          failedLoginAttempts[sanitizedEmail].count += 1;
          failedLoginAttempts[sanitizedEmail].timestamp = now;

          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      signup: async (name, email, password) => {
        try {
          // Input validation
          if (!name || !email || !password) {
            return false;
          }

          // Sanitize inputs
          const sanitizedEmail = email.trim().toLowerCase();
          const sanitizedName = name.trim();

          // Basic email validation
          if (!EMAIL_REGEX.test(sanitizedEmail)) {
            return false;
          }

          // Password strength validation
          const passwordValidation = validatePasswordStrength(password);
          if (!passwordValidation.valid) {
            return false;
          }

          // Check if email already exists
          if (
            get().users.some((u) => u.email.toLowerCase() === sanitizedEmail)
          ) {
            return false;
          }

          // Hash the password
          const passwordHash = await secureHash(password);

          // Create new user with a more secure ID
          const newUser: User = {
            id: `user-${Date.now()}-${generateSecureId(16)}`,
            email: sanitizedEmail,
            name: sanitizedName,
            role: "user", // New users are always regular users
            lastLogin: new Date().toISOString(),
          };

          // Add user to mock database
          const updatedUsers = [...get().users, newUser];
          mockPasswords[sanitizedEmail] = passwordHash;

          set({
            users: updatedUsers,
            isAuthenticated: true,
            userRole: "user",
            userId: newUser.id,
            user: newUser,
          });

          return true;
        } catch (error) {
          console.error("Signup error:", error);
          return false;
        }
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

      logout: () => {
        set({
          isAuthenticated: false,
          userRole: null,
          userId: null,
          user: null,
        });

        // Reset subscription store to guest mode when logging out
        import("./subscription-store")
          .then(({ default: useSubscriptionStore }) => {
            const subscriptionStore = useSubscriptionStore.getState();
            subscriptionStore.setGuestMode(true);
            subscriptionStore.setDemoMode(false);
          })
          .catch(console.error);
      },

      resetAuth: () => {
        // Clear authentication state but keep the mock users
        set({
          isAuthenticated: false,
          userRole: null,
          userId: null,
          user: null,
        });
      },

      // ADMIN ACTIONS
      setUserStatus: (userId: string, status: "active" | "inactive") => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, status } : u
          ),
          user:
            state.user && state.user.id === userId
              ? { ...state.user, status }
              : state.user,
        }));
      },

      resetUserPassword: async (userId: string) => {
        // For demo: set password to 'Temp1234!'
        const user = get().users.find((u) => u.id === userId);
        if (!user) throw new Error("User not found");
        const newPassword = "Temp1234!";
        mockPasswords[user.email] = await secureHash(newPassword);
        return newPassword;
      },

      exportUserData: (userId: string, userTransactions: any[]) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) throw new Error("User not found");
        // For demo: return JSON string
        return JSON.stringify(
          { user, transactions: userTransactions },
          null,
          2
        );
      },

      // FIREBASE ADMIN ACTIONS IMPLEMENTATION (Using mock data for development)
      fetchFirebaseUsers: async () => {
        set({ usersLoading: true });
        try {
          // For development, use mock data instead of actual Firebase admin calls
          console.log("Using mock Firebase users data");
          const mockFirebaseUsers = [
            {
              uid: "mock-admin-1",
              email: "admin@example.com",
              displayName: "Admin User",
              disabled: false,
              customClaims: { role: "admin" },
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
              },
            },
            {
              uid: "mock-user-1",
              email: "user@example.com",
              displayName: "Regular User",
              disabled: false,
              customClaims: { role: "user" },
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
              },
            },
          ];

          set({ firebaseUsers: mockFirebaseUsers, usersLoading: false });
        } catch (error) {
          console.error("Error fetching Firebase users:", error);
          set({ usersLoading: false });
          // Don't throw error, just use empty array
          set({ firebaseUsers: [] });
        }
      },

      updateFirebaseUser: async (
        uid: string,
        updateData: {
          displayName?: string;
          disabled?: boolean;
          customClaims?: Record<string, any>;
        }
      ) => {
        try {
          await firebaseAdmin.updateUser(uid, updateData);
          // Refresh the user list
          await get().fetchFirebaseUsers();
        } catch (error) {
          console.error("Error updating Firebase user:", error);
          throw error;
        }
      },

      disableFirebaseUser: async (uid: string) => {
        try {
          await firebaseAdmin.setUserDisabled(uid, true);
          // Refresh the user list
          await get().fetchFirebaseUsers();
        } catch (error) {
          console.error("Error disabling Firebase user:", error);
          throw error;
        }
      },

      enableFirebaseUser: async (uid: string) => {
        try {
          await firebaseAdmin.setUserDisabled(uid, false);
          // Refresh the user list
          await get().fetchFirebaseUsers();
        } catch (error) {
          console.error("Error enabling Firebase user:", error);
          throw error;
        }
      },

      sendPasswordReset: async (email: string) => {
        try {
          await firebaseAdmin.sendPasswordResetEmail(email);
        } catch (error) {
          console.error("Error sending password reset:", error);
          throw error;
        }
      },

      deleteFirebaseUser: async (uid: string) => {
        try {
          await firebaseAdmin.deleteUser(uid);
          // Refresh the user list
          await get().fetchFirebaseUsers();
        } catch (error) {
          console.error("Error deleting Firebase user:", error);
          throw error;
        }
      },

      setUserRole: async (uid: string, role: string) => {
        try {
          await firebaseAdmin.setCustomUserClaims(uid, { role });
          // Refresh the user list
          await get().fetchFirebaseUsers();
        } catch (error) {
          console.error("Error setting user role:", error);
          throw error;
        }
      },

      searchFirebaseUsers: async (searchTerm: string) => {
        try {
          return await firebaseAdmin.searchUsers(searchTerm);
        } catch (error) {
          console.error("Error searching Firebase users:", error);
          throw error;
        }
      },

      getFirebaseUserAnalytics: async () => {
        try {
          return await firebaseAdmin.getUserAnalytics();
        } catch (error) {
          console.error("Error getting Firebase user analytics:", error);
          throw error;
        }
      },

      getFirebaseSubscriptionAnalytics: async () => {
        try {
          return await firebaseAdmin.getSubscriptionAnalytics();
        } catch (error) {
          console.error(
            "Error getting Firebase subscription analytics:",
            error
          );
          throw error;
        }
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
      }),
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
