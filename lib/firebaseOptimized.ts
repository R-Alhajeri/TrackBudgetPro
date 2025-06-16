// TrackBudgetPro - Optimized Firebase Services
// Implements database optimizations from DATABASE_OPTIMIZATION_ANALYSIS.md

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  enableNetwork,
  disableNetwork,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  getFirestore as getFirestoreFromFirebase,
} from "firebase/firestore";
import { getFirebaseFirestore } from "./firebase";

// Get firestore instance
const getFirestore = () => {
  const firestore = getFirebaseFirestore();
  if (!firestore) {
    throw new Error("Firestore not initialized");
  }
  return firestore;
};

// ===============================
// OPTIMIZED DATA INTERFACES
// ===============================

interface OptimizedTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  type: "expense" | "income";
  date: Timestamp;
  categoryId: string;
  categoryName: string; // Denormalized for faster queries
  categoryIcon: string; // Denormalized for faster queries
  budgetId?: string;
  receipt?: {
    url: string;
    fileName: string;
    size: number;
  };
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MonthlyAnalytics {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  categoryBreakdown: Record<
    string,
    {
      amount: number;
      count: number;
      percentage: number;
    }
  >;
  transactionCount: number;
  avgTransactionAmount: number;
  topCategories: Array<{
    categoryId: string;
    name: string;
    amount: number;
    count: number;
  }>;
  lastUpdated: Timestamp;
}

interface OptimizedCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  budget?: number;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  transactionCount: number; // Denormalized
  totalAmount: number; // Denormalized
  lastUsed?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===============================
// PAGINATION INTERFACE
// ===============================

interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot;
}

interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
  totalCount?: number;
}

// ===============================
// OPTIMIZED TRANSACTION SERVICES
// ===============================

export class OptimizedTransactionService {
  private static getUserTransactionsRef(userId: string) {
    return collection(getFirestore(), `users/${userId}/transactions`);
  }

  private static getUserAnalyticsRef(userId: string) {
    return collection(getFirestore(), `users/${userId}/analytics`);
  }

  // Get paginated transactions with optimized indexing
  static async getUserTransactions(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<OptimizedTransaction>> {
    const { pageSize = 50, lastDoc } = options;

    let q = query(
      this.getUserTransactionsRef(userId),
      orderBy("date", "desc"),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    const data = docs.slice(0, pageSize).map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as OptimizedTransaction)
    );

    return {
      data,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    };
  }

  // Get transactions by date range with compound indexing
  static async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<OptimizedTransaction>> {
    const { pageSize = 100 } = options;

    const q = query(
      this.getUserTransactionsRef(userId),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
      orderBy("date", "desc"),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as OptimizedTransaction)
    );

    return {
      data,
      hasMore: snapshot.docs.length === pageSize,
    };
  }

  // Get transactions by category with optimized indexing
  static async getTransactionsByCategory(
    userId: string,
    categoryId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<OptimizedTransaction>> {
    const { pageSize = 50, lastDoc } = options;

    let q = query(
      this.getUserTransactionsRef(userId),
      where("categoryId", "==", categoryId),
      orderBy("date", "desc"),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    const data = docs.slice(0, pageSize).map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as OptimizedTransaction)
    );

    return {
      data,
      hasMore,
      lastDoc: hasMore ? docs[pageSize - 1] : undefined,
    };
  }

  // Add transaction with automatic analytics update
  static async addTransaction(
    userId: string,
    transactionData: Omit<
      OptimizedTransaction,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<string> {
    const now = Timestamp.now();
    const transactionRef = doc(this.getUserTransactionsRef(userId));
    const transactionWithTimestamps = {
      ...transactionData,
      id: transactionRef.id,
      createdAt: now,
      updatedAt: now,
    };

    return runTransaction(getFirestore(), async (transaction) => {
      // Add the transaction
      transaction.set(transactionRef, transactionWithTimestamps);

      // Update monthly analytics
      const month = transactionData.date.toDate().toISOString().slice(0, 7); // YYYY-MM
      const analyticsRef = doc(this.getUserAnalyticsRef(userId), month);

      const analyticsDoc = await transaction.get(analyticsRef);
      const currentAnalytics = analyticsDoc.exists()
        ? (analyticsDoc.data() as MonthlyAnalytics)
        : null;

      const updatedAnalytics = this.updateMonthlyAnalytics(
        currentAnalytics,
        transactionWithTimestamps,
        "add"
      );

      transaction.set(analyticsRef, updatedAnalytics, { merge: true });

      return transactionRef.id;
    });
  }

  // Update transaction with analytics recalculation
  static async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<OptimizedTransaction>
  ): Promise<void> {
    const transactionRef = doc(
      this.getUserTransactionsRef(userId),
      transactionId
    );

    return runTransaction(getFirestore(), async (transaction) => {
      const transactionDoc = await transaction.get(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error("Transaction not found");
      }

      const oldTransaction = transactionDoc.data() as OptimizedTransaction;
      const newTransaction = {
        ...oldTransaction,
        ...updates,
        updatedAt: Timestamp.now(),
      };

      transaction.update(transactionRef, updates);

      // Update analytics if amount, date, or type changed
      if (updates.amount || updates.date || updates.type) {
        const oldMonth = oldTransaction.date.toDate().toISOString().slice(0, 7);
        const newMonth = (updates.date || oldTransaction.date)
          .toDate()
          .toISOString()
          .slice(0, 7);

        // Remove from old month analytics
        const oldAnalyticsRef = doc(this.getUserAnalyticsRef(userId), oldMonth);
        const oldAnalyticsDoc = await transaction.get(oldAnalyticsRef);
        if (oldAnalyticsDoc.exists()) {
          const oldAnalytics = oldAnalyticsDoc.data() as MonthlyAnalytics;
          const updatedOldAnalytics = this.updateMonthlyAnalytics(
            oldAnalytics,
            oldTransaction,
            "remove"
          );
          transaction.set(oldAnalyticsRef, updatedOldAnalytics, {
            merge: true,
          });
        }

        // Add to new month analytics
        const newAnalyticsRef = doc(this.getUserAnalyticsRef(userId), newMonth);
        const newAnalyticsDoc = await transaction.get(newAnalyticsRef);
        const newAnalytics = newAnalyticsDoc.exists()
          ? (newAnalyticsDoc.data() as MonthlyAnalytics)
          : null;
        const updatedNewAnalytics = this.updateMonthlyAnalytics(
          newAnalytics,
          newTransaction,
          "add"
        );
        transaction.set(newAnalyticsRef, updatedNewAnalytics, { merge: true });
      }
    });
  }

  // Delete transaction with analytics update
  static async deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<void> {
    const transactionRef = doc(
      this.getUserTransactionsRef(userId),
      transactionId
    );

    return runTransaction(getFirestore(), async (transaction) => {
      const transactionDoc = await transaction.get(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error("Transaction not found");
      }

      const transactionData = transactionDoc.data() as OptimizedTransaction;
      transaction.delete(transactionRef);

      // Update monthly analytics
      const month = transactionData.date.toDate().toISOString().slice(0, 7);
      const analyticsRef = doc(this.getUserAnalyticsRef(userId), month);
      const analyticsDoc = await transaction.get(analyticsRef);

      if (analyticsDoc.exists()) {
        const analytics = analyticsDoc.data() as MonthlyAnalytics;
        const updatedAnalytics = this.updateMonthlyAnalytics(
          analytics,
          transactionData,
          "remove"
        );
        transaction.set(analyticsRef, updatedAnalytics, { merge: true });
      }
    });
  }

  // Helper method to update monthly analytics
  private static updateMonthlyAnalytics(
    currentAnalytics: MonthlyAnalytics | null,
    transaction: OptimizedTransaction,
    operation: "add" | "remove"
  ): MonthlyAnalytics {
    const multiplier = operation === "add" ? 1 : -1;
    const month = transaction.date.toDate().toISOString().slice(0, 7);

    const base: MonthlyAnalytics = currentAnalytics || {
      id: month,
      userId: transaction.userId,
      month,
      totalExpenses: 0,
      totalIncome: 0,
      netAmount: 0,
      categoryBreakdown: {},
      transactionCount: 0,
      avgTransactionAmount: 0,
      topCategories: [],
      lastUpdated: Timestamp.now(),
    };

    // Update totals
    if (transaction.type === "expense") {
      base.totalExpenses += transaction.amount * multiplier;
    } else {
      base.totalIncome += transaction.amount * multiplier;
    }

    base.netAmount = base.totalIncome - base.totalExpenses;
    base.transactionCount += multiplier;
    base.avgTransactionAmount =
      base.transactionCount > 0
        ? (base.totalExpenses + base.totalIncome) / base.transactionCount
        : 0;

    // Update category breakdown
    const categoryKey = transaction.categoryId;
    if (!base.categoryBreakdown[categoryKey]) {
      base.categoryBreakdown[categoryKey] = {
        amount: 0,
        count: 0,
        percentage: 0,
      };
    }

    base.categoryBreakdown[categoryKey].amount +=
      transaction.amount * multiplier;
    base.categoryBreakdown[categoryKey].count += multiplier;

    // Calculate percentages
    const total = base.totalExpenses + base.totalIncome;
    Object.keys(base.categoryBreakdown).forEach((key) => {
      base.categoryBreakdown[key].percentage =
        total > 0 ? (base.categoryBreakdown[key].amount / total) * 100 : 0;
    });

    // Update top categories
    base.topCategories = Object.entries(base.categoryBreakdown)
      .map(([categoryId, data]) => ({
        categoryId,
        name: transaction.categoryName,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    base.lastUpdated = Timestamp.now();

    return base;
  }
}

// ===============================
// OPTIMIZED ANALYTICS SERVICES
// ===============================

export class OptimizedAnalyticsService {
  // Get pre-calculated monthly analytics (much faster than real-time calculation)
  static async getMonthlyAnalytics(
    userId: string,
    month: string
  ): Promise<MonthlyAnalytics | null> {
    const analyticsRef = doc(
      getFirestore(),
      `users/${userId}/analytics`,
      month
    );
    const analyticsDoc = await getDoc(analyticsRef);

    return analyticsDoc.exists()
      ? ({ id: analyticsDoc.id, ...analyticsDoc.data() } as MonthlyAnalytics)
      : null;
  }

  // Get analytics for multiple months
  static async getAnalyticsRange(
    userId: string,
    startMonth: string,
    endMonth: string
  ): Promise<MonthlyAnalytics[]> {
    const analyticsRef = collection(
      getFirestore(),
      `users/${userId}/analytics`
    );
    const q = query(
      analyticsRef,
      where("month", ">=", startMonth),
      where("month", "<=", endMonth),
      orderBy("month", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as MonthlyAnalytics)
    );
  }

  // Force recalculation of monthly analytics (for data consistency)
  static async recalculateMonthlyAnalytics(
    userId: string,
    month: string
  ): Promise<void> {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    const transactions =
      await OptimizedTransactionService.getTransactionsByDateRange(
        userId,
        startDate,
        endDate,
        { pageSize: 1000 }
      );

    const analytics: MonthlyAnalytics = {
      id: month,
      userId,
      month,
      totalExpenses: 0,
      totalIncome: 0,
      netAmount: 0,
      categoryBreakdown: {},
      transactionCount: transactions.data.length,
      avgTransactionAmount: 0,
      topCategories: [],
      lastUpdated: Timestamp.now(),
    };

    // Calculate totals and category breakdown
    transactions.data.forEach((transaction) => {
      if (transaction.type === "expense") {
        analytics.totalExpenses += transaction.amount;
      } else {
        analytics.totalIncome += transaction.amount;
      }

      const categoryKey = transaction.categoryId;
      if (!analytics.categoryBreakdown[categoryKey]) {
        analytics.categoryBreakdown[categoryKey] = {
          amount: 0,
          count: 0,
          percentage: 0,
        };
      }

      analytics.categoryBreakdown[categoryKey].amount += transaction.amount;
      analytics.categoryBreakdown[categoryKey].count += 1;
    });

    analytics.netAmount = analytics.totalIncome - analytics.totalExpenses;
    analytics.avgTransactionAmount =
      analytics.transactionCount > 0
        ? (analytics.totalExpenses + analytics.totalIncome) /
          analytics.transactionCount
        : 0;

    // Calculate percentages and top categories
    const total = analytics.totalExpenses + analytics.totalIncome;
    Object.keys(analytics.categoryBreakdown).forEach((key) => {
      analytics.categoryBreakdown[key].percentage =
        total > 0 ? (analytics.categoryBreakdown[key].amount / total) * 100 : 0;
    });

    analytics.topCategories = Object.entries(analytics.categoryBreakdown)
      .map(([categoryId, data]) => {
        const transaction = transactions.data.find(
          (t) => t.categoryId === categoryId
        );
        return {
          categoryId,
          name: transaction?.categoryName || "Unknown",
          amount: data.amount,
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Save the calculated analytics
    const analyticsRef = doc(
      getFirestore(),
      `users/${userId}/analytics`,
      month
    );
    await updateDoc(analyticsRef, analytics as any);
  }
}

// ===============================
// OFFLINE & PERFORMANCE UTILITIES
// ===============================

export class FirebasePerformanceManager {
  // Enable offline persistence for better performance
  static async enableOfflineMode(): Promise<void> {
    try {
      await disableNetwork(getFirestore());
      console.log("📱 Offline mode enabled");
    } catch (error) {
      console.error("Failed to enable offline mode:", error);
    }
  }

  // Re-enable network connectivity
  static async enableOnlineMode(): Promise<void> {
    try {
      await enableNetwork(getFirestore());
      console.log("🌐 Online mode enabled");
    } catch (error) {
      console.error("Failed to enable online mode:", error);
    }
  }

  // Batch operations for better performance
  static async batchWrite(operations: Array<() => void>): Promise<void> {
    const batch = writeBatch(getFirestore());

    operations.forEach((operation) => {
      operation();
    });

    await batch.commit();
  }
}

// ===============================
// EXPORT ALL SERVICES
// ===============================

export {
  OptimizedTransaction,
  MonthlyAnalytics,
  OptimizedCategory,
  PaginatedResult,
  PaginationOptions,
};
