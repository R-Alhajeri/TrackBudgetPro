import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BudgetState, Category, Transaction, Currency } from "../types/budget";
import LocalNotificationManager from "../utils/LocalNotificationManager";

const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      income: 0,
      monthlyIncomes: {}, // Store income values for specific months
      categories: [],
      transactions: [],
      baseCurrency: "USD",
      currencies: [],
      receipts: {},
      selectedMonth: new Date().toISOString().slice(0, 7), // Format: YYYY-MM (current month)

      setIncome: (income: number, isDefault: boolean = true) => {
        if (isDefault) {
          set({ income });
        } else {
          const selectedMonth = get().selectedMonth;
          set((state) => ({
            monthlyIncomes: {
              ...state.monthlyIncomes,
              [selectedMonth]: income,
            },
          }));
        }
      },

      setMonthlyIncome: (month: string, income: number) => {
        set((state) => ({
          monthlyIncomes: {
            ...state.monthlyIncomes,
            [month]: income,
          },
        }));
      },

      getIncomeForMonth: (month: string) => {
        const { income, monthlyIncomes } = get();
        // Return the month-specific income if it exists, otherwise return the default income
        return monthlyIncomes[month] !== undefined
          ? monthlyIncomes[month]
          : income;
      },

      addCategory: (category: Omit<Category, "id" | "spent">) => {
        const newCategory: Category = {
          id: Date.now().toString(),
          ...category,
          spent: 0,
          monthlyBudgets: {}, // Store budgets for specific months
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (
        id: string,
        updatedCategory: Partial<Omit<Category, "id">>
      ) => {
        set((state: BudgetState) => ({
          categories: state.categories.map((category: Category) =>
            category.id === id ? { ...category, ...updatedCategory } : category
          ),
        }));
      },

      setCategoryMonthlyBudget: (
        categoryId: string,
        month: string,
        budget: number
      ) => {
        set((state: BudgetState) => ({
          categories: state.categories.map((category: Category) => {
            if (category.id === categoryId) {
              return {
                ...category,
                monthlyBudgets: {
                  ...(category.monthlyBudgets || {}),
                  [month]: budget,
                },
              };
            }
            return category;
          }),
        }));
      },

      deleteCategory: (id: string) => {
        set((state: BudgetState) => ({
          categories: state.categories.filter(
            (category: Category) => category.id !== id
          ),
          transactions: state.transactions.filter(
            (transaction: Transaction) => transaction.categoryId !== id
          ),
        }));
      },

      addTransaction: (
        transaction: Omit<Transaction, "id"> & { id?: string }
      ) => {
        const { baseCurrency, currencies, selectedMonth } = get();
        const transactionId = Date.now().toString();
        if (!transaction.userId) {
          throw new Error("Transaction must include userId");
        }

        // Handle currency conversion if needed
        let convertedAmount = transaction.amount;
        if (transaction.currency && transaction.currency !== baseCurrency) {
          const fromCurrency = currencies.find(
            (c: Currency) => c.code === transaction.currency
          );
          const toCurrency = currencies.find(
            (c: Currency) => c.code === baseCurrency
          );

          if (fromCurrency?.rate && toCurrency?.rate) {
            // Convert to base currency
            convertedAmount =
              (transaction.amount / fromCurrency.rate) * toCurrency.rate;
          }
        }

        // Set the transaction date to be within the selected month
        const currentDate = new Date();
        const selectedMonthDate = new Date(selectedMonth + "-01");
        const isCurrentMonth =
          currentDate.getFullYear() === selectedMonthDate.getFullYear() &&
          currentDate.getMonth() === selectedMonthDate.getMonth();

        const newTransaction: Transaction = {
          id: transactionId,
          ...transaction,
          date: isCurrentMonth
            ? currentDate.toISOString()
            : new Date(selectedMonth + "-01").toISOString(),
          amount: convertedAmount,
        };
        set((state: BudgetState) => ({
          transactions: [...state.transactions, newTransaction],
        }));

        // Update category spent amounts after adding a transaction
        const currentState = get();

        // Always update all category spent amounts to ensure consistency
        // This ensures any transaction type changes are correctly reflected
        currentState.updateCategorySpentAmounts();

        return transactionId; // Ensure the function returns a string
      },

      deleteTransaction: (id: string) => {
        const { transactions, categories, receipts } = get();
        const transaction = transactions.find((t: Transaction) => t.id === id);

        if (!transaction) return;

        // Remove the transaction from the store
        set((state: BudgetState) => ({
          transactions: state.transactions.filter(
            (t: Transaction) => t.id !== id
          ),
        }));

        // Update all category spent amounts after removing
        get().updateCategorySpentAmounts();

        // Clean up any associated receipts
        if (transaction.receiptImageUri) {
          const updatedReceipts = { ...get().receipts };
          delete updatedReceipts[transaction.id];
          set((state: BudgetState) => ({
            ...state,
            receipts: updatedReceipts,
          }));
        }

        // Remove receipt if exists
        const updatedReceipts = { ...receipts };
        if (updatedReceipts[id]) {
          delete updatedReceipts[id];

          set({
            receipts: updatedReceipts,
          });
        }
      },

      setBaseCurrency: (currencyCode: string) => {
        // Set the base currency
        set({ baseCurrency: currencyCode });
      },

      updateCurrencyRates: (updatedCurrencies: Partial<Currency>[]) => {
        set((state: BudgetState) => ({
          currencies: state.currencies.map((currency: Currency) => {
            const updated = updatedCurrencies.find(
              (c: Partial<Currency>) => c.code === currency.code
            );
            return updated ? { ...currency, ...updated } : currency;
          }),
        }));
      },

      addReceipt: (
        transactionId: string,
        imageUri: string,
        receiptData?: any
      ) => {
        set((state: BudgetState) => ({
          receipts: {
            ...state.receipts,
            [transactionId]: imageUri,
          },
          transactions: state.transactions.map((transaction: Transaction) =>
            transaction.id === transactionId
              ? { ...transaction, receiptData }
              : transaction
          ),
        }));
      },

      deleteReceipt: (transactionId: string) => {
        set((state: BudgetState) => {
          const updatedReceipts = { ...state.receipts };
          delete updatedReceipts[transactionId];
          return {
            receipts: updatedReceipts,
            transactions: state.transactions.map((transaction: Transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    receiptData: undefined,
                    receiptImageUri: undefined,
                  }
                : transaction
            ),
          };
        });
      },

      setSelectedMonth: (month: string) => {
        const isValidMonth =
          month && typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
        set({
          selectedMonth: isValidMonth
            ? month
            : new Date().toISOString().slice(0, 7),
        });
      },

      resetBudgetData: () => {
        set({
          income: 0,
          monthlyIncomes: {},
          categories: [],
          transactions: [],
          receipts: {},
        });
      },

      // Returns the earliest month for which the user has set an income (default or month-specific)
      getFirstIncomeMonth: (): string | null => {
        const { income, monthlyIncomes, transactions } = get();

        // First priority: Check if there are any month-specific incomes set
        // This is the hard boundary that users should never be able to go before
        if (Object.keys(monthlyIncomes).length > 0) {
          // Sort chronologically and return the earliest month
          return Object.keys(monthlyIncomes).sort()[0];
        }

        // Second priority: If there's a default income set, use current month
        // Default income applies to all months, so we use current month as boundary
        if (income > 0) {
          return new Date().toISOString().slice(0, 7);
        }

        // Third priority: If no income at all but there are transactions,
        // use the earliest transaction month as the boundary
        if (transactions.length > 0) {
          return transactions
            .map((t: Transaction) => t.date.slice(0, 7))
            .sort()[0];
        }

        // If nothing else is set, default to current month
        return new Date().toISOString().slice(0, 7);
      }, // Helper to update category spent values based on transactions
      updateCategorySpentAmounts: () => {
        const { categories, transactions, selectedMonth } = get();

        // Create a copy of categories to update
        const updatedCategories = categories.map((category: Category) => {
          // Find all transactions for this category that are expenses
          // Also handle legacy transactions that might not have a type field
          const categoryTransactions = transactions.filter(
            (t: Transaction) =>
              t.categoryId === category.id && (t.type === "expense" || !t.type)
          );

          // Calculate the total spent amount
          const totalSpent = categoryTransactions.reduce(
            (sum: number, transaction: Transaction) => sum + transaction.amount,
            0
          );

          // Get the budget for this category (monthly or default)
          const monthlyBudget = category.monthlyBudgets?.[selectedMonth];
          const budget =
            monthlyBudget !== undefined ? monthlyBudget : category.budget;

          // Check if budget is exceeded and send notification
          const previousSpent = category.spent || 0;
          if (totalSpent > budget && previousSpent <= budget && budget > 0) {
            // Budget just exceeded, send notification
            LocalNotificationManager.sendCategoryBudgetAlert(
              category.name,
              totalSpent,
              budget
            );
          }

          // Return updated category with correct spent amount
          return {
            ...category,
            spent: totalSpent,
          };
        });

        // Update state with the recalculated spent amounts
        set({ categories: updatedCategories });
      },
    }),
    {
      name: "budget-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        income: state.income,
        monthlyIncomes: state.monthlyIncomes,
        categories: state.categories,
        transactions: state.transactions,
        baseCurrency: state.baseCurrency,
        receipts: state.receipts,
        selectedMonth: state.selectedMonth,
        // Do not overwrite currencies with default, persist the actual state
        currencies:
          state.currencies.length > 0 ? state.currencies : defaultCurrencies,
      }),
    }
  )
);

// Import after the store definition to avoid circular dependency
import { defaultCurrencies } from "../constants/currencies";

export default useBudgetStore;
