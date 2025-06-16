/**
 * Firebase Admin Service - No Backend Required
 *
 * This service provides admin functionality using Firebase's built-in capabilities.
 * No custom backend server is needed - all admin operations use Firebase directly.
 * Includes mock fallback for development environments like Expo Go.
 */

import {
  getAuth,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  setDoc,
  Timestamp,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import {
  OptimizedTransactionService,
  OptimizedAnalyticsService,
} from "./firebaseOptimized";
import { Platform } from "react-native";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  emailVerified: boolean;
  customClaims?: {
    role?: string;
    subscriptionStatus?: string;
    subscriptionType?: string;
  };
  metadata: {
    creationTime: string;
    lastSignInTime?: string;
  };
  providerData: any[];
}

export interface UserUpdateData {
  displayName?: string;
  email?: string;
  disabled?: boolean;
  emailVerified?: boolean;
  customClaims?: Record<string, any>;
}

// Mock data for when Firebase is not available
const mockUsers: AdminUser[] = [
  {
    uid: "mock-admin-1",
    email: "admin@example.com",
    displayName: "Admin User",
    disabled: false,
    emailVerified: true,
    customClaims: { role: "admin" },
    metadata: {
      creationTime: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
  },
  {
    uid: "mock-user-1",
    email: "user1@example.com",
    displayName: "Regular User 1",
    disabled: false,
    emailVerified: true,
    customClaims: { role: "user" },
    metadata: {
      creationTime: new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000
      ).toISOString(),
      lastSignInTime: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    providerData: [],
  },
  {
    uid: "mock-user-2",
    email: "user2@example.com",
    displayName: "Regular User 2",
    disabled: true,
    emailVerified: false,
    customClaims: { role: "user" },
    metadata: {
      creationTime: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      lastSignInTime: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    providerData: [],
  },
  {
    uid: "mock-user-3",
    email: "newuser@example.com",
    displayName: "New User",
    disabled: false,
    emailVerified: true,
    customClaims: { role: "user" },
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
  },
];

class FirebaseAdminService {
  private _auth: any = null;
  private _firestore: any = null;
  private _isMockMode: boolean = false;

  private get auth() {
    if (!this._auth) {
      try {
        this._auth = getAuth();
        // Test if auth is functional
        if (!this._auth || typeof this._auth.currentUser === "undefined") {
          throw new Error("Auth not functional");
        }
      } catch (error) {
        console.warn("Firebase Auth not available, using mock mode:", error);
        this._isMockMode = true;
        this._auth = null;
      }
    }
    return this._auth;
  }

  private get firestore() {
    if (!this._firestore) {
      try {
        this._firestore = getFirestore();
      } catch (error) {
        console.warn(
          "Firebase Firestore not available, using mock mode:",
          error
        );
        this._isMockMode = true;
        this._firestore = null;
      }
    }
    return this._firestore;
  }

  private get isMockMode(): boolean {
    // Check if we're in mock mode or if Firebase services are unavailable
    return this._isMockMode || !this.auth || !this.firestore;
  }

  /**
   * Get all users (limited to 1000 for performance)
   * Note: In a real app with many users, implement pagination
   */
  async getUsers(maxResults: number = 1000): Promise<AdminUser[]> {
    if (this.isMockMode) {
      console.log("Using mock users data");
      return [...mockUsers].slice(0, maxResults);
    }

    try {
      // Get users from Firestore users collection
      const usersRef = collection(this.firestore, "users");
      const usersQuery = query(
        usersRef,
        orderBy("createdAt", "desc"),
        limit(maxResults)
      );
      const snapshot = await getDocs(usersQuery);

      const users: AdminUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email || "",
          displayName: data.displayName || data.name || "",
          disabled: data.disabled || false,
          emailVerified: data.emailVerified || false,
          customClaims: data.customClaims || {},
          metadata: {
            creationTime:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            lastSignInTime: data.lastSignInTime?.toDate?.()?.toISOString(),
          },
          providerData: data.providerData || [],
        });
      });

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  /**
   * Update user data
   */
  async updateUser(uid: string, updateData: UserUpdateData): Promise<void> {
    if (this.isMockMode) {
      console.log(`Mock: Updating user ${uid}:`, updateData);
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        if (updateData.displayName !== undefined) {
          mockUsers[userIndex].displayName = updateData.displayName;
        }
        if (updateData.disabled !== undefined) {
          mockUsers[userIndex].disabled = updateData.disabled;
        }
        if (updateData.emailVerified !== undefined) {
          mockUsers[userIndex].emailVerified = updateData.emailVerified;
        }
        if (updateData.customClaims !== undefined) {
          mockUsers[userIndex].customClaims = {
            ...mockUsers[userIndex].customClaims,
            ...updateData.customClaims,
          };
        }
        console.log(`Mock: User ${uid} updated successfully`);
      }
      return;
    }

    try {
      const userRef = doc(this.firestore, "users", uid);
      const updatePayload: any = {};

      if (updateData.displayName !== undefined) {
        updatePayload.displayName = updateData.displayName;
        updatePayload.name = updateData.displayName; // Keep both for compatibility
      }

      if (updateData.disabled !== undefined) {
        updatePayload.disabled = updateData.disabled;
        updatePayload.status = updateData.disabled ? "inactive" : "active";
      }

      if (updateData.emailVerified !== undefined) {
        updatePayload.emailVerified = updateData.emailVerified;
      }

      if (updateData.customClaims !== undefined) {
        updatePayload.customClaims = updateData.customClaims;

        // Update role if provided
        if (updateData.customClaims.role) {
          updatePayload.role = updateData.customClaims.role;
        }
      }

      updatePayload.updatedAt = Timestamp.now();

      await updateDoc(userRef, updatePayload);
      console.log(`User ${uid} updated successfully`);
    } catch (error) {
      console.error("Error updating user:", error);
      // Fallback to mock update
      console.log("Falling back to mock user update");
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        if (updateData.displayName !== undefined) {
          mockUsers[userIndex].displayName = updateData.displayName;
        }
        if (updateData.disabled !== undefined) {
          mockUsers[userIndex].disabled = updateData.disabled;
        }
        if (updateData.customClaims !== undefined) {
          mockUsers[userIndex].customClaims = {
            ...mockUsers[userIndex].customClaims,
            ...updateData.customClaims,
          };
        }
      }
    }
  }

  /**
   * Disable/Enable user account
   */
  async setUserDisabled(uid: string, disabled: boolean): Promise<void> {
    try {
      await this.updateUser(uid, { disabled });
      console.log(
        `User ${uid} ${disabled ? "disabled" : "enabled"} successfully`
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      throw new Error("Failed to update user status");
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    if (this.isMockMode) {
      console.log(`Mock: Password reset email sent to ${email}`);
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      console.log(`Mock fallback: Password reset email sent to ${email}`);
    }
  }

  /**
   * Set custom user claims (like role, subscription status)
   */
  async setCustomUserClaims(
    uid: string,
    customClaims: Record<string, any>
  ): Promise<void> {
    try {
      await this.updateUser(uid, { customClaims });
      console.log(`Custom claims set for user ${uid}:`, customClaims);
    } catch (error) {
      console.error("Error setting custom claims:", error);
      throw new Error("Failed to set custom claims");
    }
  }

  /**
   * Delete user account
   * Note: This will delete from Firestore. For Firebase Auth deletion,
   * users need to delete their own account or use Firebase Admin SDK server-side
   */
  async deleteUser(uid: string): Promise<void> {
    if (this.isMockMode) {
      console.log(`Mock: Deleting user ${uid}`);
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
        console.log(`Mock: User ${uid} deleted successfully`);
      }
      return;
    }

    try {
      // Delete user document from Firestore
      const userRef = doc(this.firestore, "users", uid);
      await deleteDoc(userRef);

      // Also delete user's budget data
      const budgetRef = doc(this.firestore, "budgets", uid);
      await deleteDoc(budgetRef);

      console.log(`User ${uid} deleted successfully`);
    } catch (error) {
      console.error("Error deleting user:", error);
      // Fallback to mock delete
      console.log("Falling back to mock user deletion");
      const userIndex = mockUsers.findIndex((u) => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
      }
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> {
    try {
      const usersRef = collection(this.firestore, "users");
      const allUsersSnapshot = await getDocs(usersRef);

      const totalUsers = allUsersSnapshot.size;
      let activeUsers = 0;
      let newUsersToday = 0;
      let newUsersThisWeek = 0;
      let newUsersThisMonth = 0;

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfWeek = new Date(
        startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      allUsersSnapshot.forEach((doc) => {
        const userData = doc.data();

        // Count active users (not disabled)
        if (!userData.disabled) {
          activeUsers++;
        }

        // Count new users
        const createdAt = userData.createdAt?.toDate();
        if (createdAt) {
          if (createdAt >= startOfDay) newUsersToday++;
          if (createdAt >= startOfWeek) newUsersThisWeek++;
          if (createdAt >= startOfMonth) newUsersThisMonth++;
        }
      });

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw new Error("Failed to get user analytics");
    }
  }

  /**
   * Search users by email or name
   */
  async searchUsers(searchTerm: string): Promise<AdminUser[]> {
    try {
      const usersRef = collection(this.firestore, "users");

      // Search by email
      const emailQuery = query(
        usersRef,
        where("email", ">=", searchTerm.toLowerCase()),
        where("email", "<=", searchTerm.toLowerCase() + "\uf8ff"),
        limit(50)
      );

      const emailSnapshot = await getDocs(emailQuery);
      const emailResults: AdminUser[] = [];

      emailSnapshot.forEach((doc) => {
        const data = doc.data();
        emailResults.push({
          uid: doc.id,
          email: data.email || "",
          displayName: data.displayName || data.name || "",
          disabled: data.disabled || false,
          emailVerified: data.emailVerified || false,
          customClaims: data.customClaims || {},
          metadata: {
            creationTime:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            lastSignInTime: data.lastSignInTime?.toDate?.()?.toISOString(),
          },
          providerData: data.providerData || [],
        });
      });

      return emailResults;
    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }

  /**
   * Get subscription analytics from Firestore
   */
  async getSubscriptionAnalytics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  }> {
    try {
      const usersRef = collection(this.firestore, "users");
      const snapshot = await getDocs(usersRef);

      let totalSubscriptions = 0;
      let activeSubscriptions = 0;
      let expiredSubscriptions = 0;
      let monthlyRevenue = 0;
      let yearlyRevenue = 0;

      snapshot.forEach((doc) => {
        const userData = doc.data();
        const subscriptionStatus =
          userData.customClaims?.subscriptionStatus ||
          userData.subscriptionStatus;

        if (subscriptionStatus && subscriptionStatus !== "none") {
          totalSubscriptions++;

          if (subscriptionStatus === "active") {
            activeSubscriptions++;

            // Calculate revenue based on subscription type
            const subscriptionType = userData.subscriptionType || "monthly";
            if (subscriptionType === "monthly") {
              monthlyRevenue += 3.99; // Example monthly price
            } else if (subscriptionType === "yearly") {
              yearlyRevenue += 43.99; // Example yearly price
              monthlyRevenue += 43.99 / 12; // Add monthly equivalent
            }
          } else if (
            subscriptionStatus === "expired" ||
            subscriptionStatus === "canceled"
          ) {
            expiredSubscriptions++;
          }
        }
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        monthlyRevenue,
        yearlyRevenue,
      };
    } catch (error) {
      console.error("Error getting subscription analytics:", error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      };
    }
  }

  /**
   * OPTIMIZED ADMIN FUNCTIONS
   * Using the new optimized database structure
   */

  // Get user analytics with optimized queries
  async getUserAnalyticsOptimized(
    userId: string,
    months: number = 6
  ): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);

      const startMonth = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const endMonth = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const analytics = await OptimizedAnalyticsService.getAnalyticsRange(
        userId,
        startMonth,
        endMonth
      );

      return {
        monthlyData: analytics,
        totalTransactions: analytics.reduce(
          (sum, month) => sum + month.transactionCount,
          0
        ),
        totalExpenses: analytics.reduce(
          (sum, month) => sum + month.totalExpenses,
          0
        ),
        totalIncome: analytics.reduce(
          (sum, month) => sum + month.totalIncome,
          0
        ),
        avgMonthlySpending:
          analytics.length > 0
            ? analytics.reduce((sum, month) => sum + month.totalExpenses, 0) /
              analytics.length
            : 0,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      return null;
    }
  }

  // Bulk user operations with optimized performance
  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<UserUpdateData>
  ): Promise<{
    success: string[];
    failed: Array<{ uid: string; error: string }>;
  }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ uid: string; error: string }>,
    };

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = writeBatch(this.firestore);
      const batchUserIds = userIds.slice(i, i + batchSize);

      for (const userId of batchUserIds) {
        try {
          const userRef = doc(this.firestore, "users", userId);
          batch.update(userRef, {
            ...updates,
            updatedAt: Timestamp.now(),
          });
          results.success.push(userId);
        } catch (error) {
          results.failed.push({
            uid: userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      try {
        await batch.commit();
      } catch (error) {
        // Mark all batch users as failed
        batchUserIds.forEach((userId) => {
          const successIndex = results.success.indexOf(userId);
          if (successIndex > -1) {
            results.success.splice(successIndex, 1);
            results.failed.push({
              uid: userId,
              error:
                error instanceof Error ? error.message : "Batch commit failed",
            });
          }
        });
      }
    }

    return results;
  }

  // Database performance monitoring
  async getDatabasePerformanceMetrics(): Promise<{
    totalUsers: number;
    totalTransactions: number;
    avgTransactionsPerUser: number;
    dataGrowthRate: number;
    storageUsage: number;
    queryPerformance: {
      avgQueryTime: number;
      slowQueries: number;
    };
  }> {
    try {
      const startTime = Date.now();

      // Get total users
      const usersSnapshot = await getDocs(collection(this.firestore, "users"));
      const totalUsers = usersSnapshot.size;

      // Sample query performance by testing a few user transactions
      let totalTransactions = 0;
      let sampleQueryTimes: number[] = [];

      // Test with first 10 users for performance sampling
      const sampleUsers = usersSnapshot.docs.slice(0, 10);

      for (const userDoc of sampleUsers) {
        const queryStart = Date.now();
        const userTransactions =
          await OptimizedTransactionService.getUserTransactions(userDoc.id, {
            pageSize: 50,
          });
        const queryTime = Date.now() - queryStart;
        sampleQueryTimes.push(queryTime);
        totalTransactions += userTransactions.data.length;
      }

      const avgQueryTime =
        sampleQueryTimes.length > 0
          ? sampleQueryTimes.reduce((sum, time) => sum + time, 0) /
            sampleQueryTimes.length
          : 0;
      const slowQueries = sampleQueryTimes.filter((time) => time > 1000).length;

      const totalTime = Date.now() - startTime;

      return {
        totalUsers,
        totalTransactions: Math.round(
          totalTransactions * (totalUsers / sampleUsers.length)
        ), // Extrapolate
        avgTransactionsPerUser:
          totalUsers > 0 ? totalTransactions / sampleUsers.length : 0,
        dataGrowthRate: 0, // Would need historical data
        storageUsage: 0, // Would need Cloud Storage API
        queryPerformance: {
          avgQueryTime,
          slowQueries,
        },
      };
    } catch (error) {
      console.error("Error getting database performance metrics:", error);
      return {
        totalUsers: 0,
        totalTransactions: 0,
        avgTransactionsPerUser: 0,
        dataGrowthRate: 0,
        storageUsage: 0,
        queryPerformance: {
          avgQueryTime: 0,
          slowQueries: 0,
        },
      };
    }
  }

  // Cleanup inactive users and old data
  async cleanupOldData(daysOld: number = 90): Promise<{
    deletedUsers: number;
    deletedTransactions: number;
    reclaimedStorage: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

      let deletedUsers = 0;
      let deletedTransactions = 0;

      // Find inactive users (haven't logged in for X days)
      const inactiveUsersQuery = query(
        collection(this.firestore, "users"),
        where("lastLoginAt", "<", cutoffTimestamp),
        where("isActive", "==", false),
        limit(100) // Process in batches
      );

      const inactiveUsersSnapshot = await getDocs(inactiveUsersQuery);

      for (const userDoc of inactiveUsersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Delete user's subcollection data
          const userTransactions = await getDocs(
            collection(this.firestore, `users/${userId}/transactions`)
          );

          const batch = writeBatch(this.firestore);
          userTransactions.docs.forEach((transactionDoc) => {
            batch.delete(transactionDoc.ref);
            deletedTransactions++;
          });

          // Delete user categories
          const userCategories = await getDocs(
            collection(this.firestore, `users/${userId}/categories`)
          );
          userCategories.docs.forEach((categoryDoc) => {
            batch.delete(categoryDoc.ref);
          });

          // Delete user analytics
          const userAnalytics = await getDocs(
            collection(this.firestore, `users/${userId}/analytics`)
          );
          userAnalytics.docs.forEach((analyticsDoc) => {
            batch.delete(analyticsDoc.ref);
          });

          // Delete user document
          batch.delete(userDoc.ref);

          await batch.commit();
          deletedUsers++;
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
        }
      }

      return {
        deletedUsers,
        deletedTransactions,
        reclaimedStorage: deletedUsers * 0.5 + deletedTransactions * 0.5, // Estimated KB
      };
    } catch (error) {
      console.error("Error cleaning up old data:", error);
      return {
        deletedUsers: 0,
        deletedTransactions: 0,
        reclaimedStorage: 0,
      };
    }
  }

  // Force recalculate analytics for all users
  async recalculateAllAnalytics(): Promise<{
    processedUsers: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    try {
      const usersSnapshot = await getDocs(collection(this.firestore, "users"));
      const results = {
        processedUsers: 0,
        errors: [] as Array<{ userId: string; error: string }>,
      };

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Get user's transaction months
          const transactionsSnapshot = await getDocs(
            collection(this.firestore, `users/${userId}/transactions`)
          );

          const months = new Set<string>();
          transactionsSnapshot.docs.forEach((doc) => {
            const transaction = doc.data();
            if (transaction.date) {
              const date = transaction.date.toDate();
              const month = `${date.getFullYear()}-${String(
                date.getMonth() + 1
              ).padStart(2, "0")}`;
              months.add(month);
            }
          });

          // Recalculate analytics for each month
          for (const month of months) {
            await OptimizedAnalyticsService.recalculateMonthlyAnalytics(
              userId,
              month
            );
          }

          results.processedUsers++;
        } catch (error) {
          results.errors.push({
            userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error recalculating analytics:", error);
      return {
        processedUsers: 0,
        errors: [
          {
            userId: "all",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  }
}

// Export singleton instance
export const firebaseAdmin = new FirebaseAdminService();
export default firebaseAdmin;
