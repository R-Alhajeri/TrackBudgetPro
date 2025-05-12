import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BudgetState, Category, Transaction, Currency } from "@/types/budget";
import * as budgetApi from "@/lib/budget-api";
import * as receiptApi from "@/lib/receipt-api";

// Get current date in YYYY-MM format
const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
};

const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      income: 0,
      categories: [],
      transactions: [],
      baseCurrency: "USD",
      currencies: [],
      receipts: {},
      selectedMonth: getCurrentMonth(), // Format: YYYY-MM (current month)
      defaultIncome: 0,
      defaultCategoryBudgets: {},

      setIncome: (income) => {
        set({ income });
      },

      setDefaultIncome: (income) => {
        set({ defaultIncome: income });
      },

      setDefaultCategoryBudgets: (categories) => {
        set({ defaultCategoryBudgets: categories });
      },

      addCategory: (category) => {
        const newCategory: Category = {
          id: Date.now().toString(),
          ...category,
          spent: 0,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updatedCategory) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...updatedCategory } : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          transactions: state.transactions.filter(
            (transaction) => transaction.categoryId !== id
          ),
        }));
      },

      addTransaction: (transaction) => {
        const { baseCurrency, currencies, selectedMonth } = get();
        const transactionId = Date.now().toString();

        // Handle currency conversion if needed
        let convertedAmount = transaction.amount;
        if (transaction.currency && transaction.currency !== baseCurrency) {
          const fromCurrency = currencies.find(
            (c) => c.code === transaction.currency
          );
          const toCurrency = currencies.find((c) => c.code === baseCurrency);

          if (fromCurrency && toCurrency) {
            // Convert to base currency
            convertedAmount =
              (transaction.amount / fromCurrency.rate) * toCurrency.rate;
          }
        }

        // Set the transaction date to be within the selected month
        // Use the current day if it's the current month, otherwise use the 1st of the month
        const currentDate = new Date();
        const selectedMonthDate = new Date(selectedMonth + "-01");
        const isCurrentMonth =
          currentDate.getFullYear() === selectedMonthDate.getFullYear() &&
          currentDate.getMonth() === selectedMonthDate.getMonth();

        const transactionDate = isCurrentMonth
          ? currentDate.toISOString()
          : new Date(selectedMonth + "-01").toISOString();

        const newTransaction: Transaction = {
          id: transactionId,
          ...transaction,
          date: transactionDate,
          originalAmount:
            transaction.currency !== baseCurrency
              ? transaction.amount
              : undefined,
        };

        // Update the spent amount for the category
        const { categories } = get();
        const updatedCategories = categories.map((category) => {
          if (category.id === transaction.categoryId) {
            return {
              ...category,
              spent: category.spent + convertedAmount,
            };
          }
          return category;
        });

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
          categories: updatedCategories,
        }));

        return transactionId;
      },

      deleteTransaction: (id) => {
        const { transactions, categories, receipts } = get();
        const transaction = transactions.find((t) => t.id === id);

        if (!transaction) return;

        // Calculate the amount to subtract (handle currency conversion)
        let amountToSubtract = transaction.amount;
        if (transaction.originalAmount !== undefined) {
          // If there was a currency conversion, use the converted amount
          amountToSubtract = transaction.amount;
        }

        const updatedCategories = categories.map((category) => {
          if (category.id === transaction.categoryId) {
            return {
              ...category,
              spent: Math.max(0, category.spent - amountToSubtract),
            };
          }
          return category;
        });

        // Remove receipt if exists
        const updatedReceipts = { ...receipts };
        if (updatedReceipts[id]) {
          delete updatedReceipts[id];
        }

        set({
          transactions: transactions.filter((t) => t.id !== id),
          categories: updatedCategories,
          receipts: updatedReceipts,
        });
      },

      setBaseCurrency: (currencyCode) => {
        // Set the base currency
        set({ baseCurrency: currencyCode });
      },

      updateCurrencyRates: (updatedCurrencies) => {
        set((state) => ({
          currencies: state.currencies.map((currency) => {
            const updated = updatedCurrencies.find(
              (c) => c.code === currency.code
            );
            return updated ? { ...currency, ...updated } : currency;
          }),
        }));
      },

      addReceipt: (transactionId, imageUri, receiptData) => {
        // Store the receipt image
        set((state) => ({
          receipts: {
            ...state.receipts,
            [transactionId]: imageUri,
          },
          // Update transaction with receipt data if provided
          transactions: state.transactions.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, receiptData }
              : transaction
          ),
        }));
      },

      deleteReceipt: (transactionId) => {
        set((state) => {
          const updatedReceipts = { ...state.receipts };
          delete updatedReceipts[transactionId];

          return {
            receipts: updatedReceipts,
            // Remove receipt data from transaction
            transactions: state.transactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    receiptData: undefined,
                    receiptImage: undefined,
                  }
                : transaction
            ),
          };
        });
      },

      setSelectedMonth: (month) => {
        set({ selectedMonth: month });
      },

      resetBudgetData: () => {
        set({
          income: 0,
          categories: [],
          transactions: [],
          receipts: {},
          // Keep baseCurrency and currencies
        });
      },

      // Backend-integrated actions
      fetchBudgetFromBackend: async (year: number, month: number) => {
        const budget = await budgetApi.fetchBudget(year, month);
        if (budget) {
          // Fetch categories to get details but don't set them to state yet
          const categoriesFromBackend = await budgetApi.fetchCategories();

          // Only set categories related to this month's budget
          set({
            income: budget.income,
            // Only include categories with a non-zero budget for the selected month
            categories: Object.entries(budget.categories)
              .filter(([_, amount]) => typeof amount === "number" && amount > 0)
              .map(([id, amount]) => {
                const cat = categoriesFromBackend.find((c: any) => c.id === id);
                return {
                  id,
                  name: cat?.name || "",
                  color: cat?.color || "",
                  icon: cat?.icon || "",
                  spent: 0,
                  budget: typeof amount === "number" ? amount : 0,
                };
              }),
          });
        } else {
          // Use defaults if no explicit month data
          const { defaultIncome, defaultCategoryBudgets } = get();
          const categoriesFromBackend = await budgetApi.fetchCategories();
          set({
            income: defaultIncome,
            categories: Object.entries(defaultCategoryBudgets)
              .filter(([_, amount]) => typeof amount === "number" && amount > 0)
              .map(([id, amount]) => {
                const cat = categoriesFromBackend.find((c: any) => c.id === id);
                return {
                  id,
                  name: cat?.name || "",
                  color: cat?.color || "",
                  icon: cat?.icon || "",
                  spent: 0,
                  budget: typeof amount === "number" ? amount : 0,
                };
              }),
          });
        }

        // Always fetch transactions for the same month
        await get().fetchTransactionsFromBackend?.(year, month);
      },
      setBudgetToBackend: async (
        year: number,
        month: number,
        income: number,
        categories: Record<string, number>
      ) => {
        await budgetApi.setBudget(year, month, income, categories);
        // Optionally re-fetch
        await get().fetchBudgetFromBackend?.(year, month);
      },
      fetchCategoriesFromBackend: async () => {
        // Fetch categories but don't automatically set them in the store
        // This way they won't overwrite our per-month filtered categories
        const categories = await budgetApi.fetchCategories();
        // Transform them to match our frontend Category type that includes budget and spent
        return categories.map((c: any) => ({
          ...c,
          budget: c.budget || 0,
          spent: 0,
        }));
      },
      createCategoryInBackend: async (
        name: string,
        color: string,
        icon: string
      ) => {
        // Restore to previous: do not return backend Category, just void
        await budgetApi.createCategory(name, color, icon);
        // After creating a category, always re-fetch the budget for the current month
        // This will ensure the UI is up-to-date with only relevant categories
        const [year, month] = get().selectedMonth.split("-").map(Number);
        await get().fetchBudgetFromBackend?.(year, month);
      },
      updateCategoryInBackend: async (
        id: string,
        name: string,
        color: string,
        icon: string
      ) => {
        await budgetApi.updateCategory(id, name, color, icon);
        // After updating a category, re-fetch the budget for the current month
        const [year, month] = get().selectedMonth.split("-").map(Number);
        await get().fetchBudgetFromBackend?.(year, month);
      },
      deleteCategoryInBackend: async (id: string) => {
        await budgetApi.deleteCategory(id);
        // After deleting a category, re-fetch the budget for the current month
        const [year, month] = get().selectedMonth.split("-").map(Number);
        await get().fetchBudgetFromBackend?.(year, month);
      },
      fetchTransactionsFromBackend: async (year: number, month: number) => {
        const transactions = await budgetApi.fetchTransactions(year, month);

        // Only set transactions for the requested month
        // Format the month for comparison
        const monthString = `${year}-${month.toString().padStart(2, "0")}`;

        set({
          transactions: transactions
            .filter((t: any) => t.date.startsWith(monthString))
            .map((t: any) => ({
              ...t,
              description: t.description ?? "",
            })),
        });
      },
      createTransactionInBackend: async (
        input: Omit<Transaction, "id">,
        year: number,
        month: number
      ) => {
        await budgetApi.createTransaction(input, year, month);

        // Re-fetch budget which will also fetch transactions and update category spent amounts
        await get().fetchBudgetFromBackend?.(year, month);
      },
      updateTransactionInBackend: async (input: Transaction) => {
        await budgetApi.updateTransaction(input);

        // Use the transaction date to determine year/month for re-fetch
        const date = new Date(input.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Re-fetch budget which will also fetch transactions and update category spent amounts
        await get().fetchBudgetFromBackend?.(year, month);
      },
      deleteTransactionInBackend: async (
        id: string,
        year: number,
        month: number
      ) => {
        await budgetApi.deleteTransaction(id);

        // Re-fetch budget which will also fetch transactions and update category spent amounts
        await get().fetchBudgetFromBackend?.(year, month);
      },
      // Receipt backend actions
      fetchReceiptsFromBackend: async () => {
        const receipts = await receiptApi.fetchReceipts();
        // Map receipts to local store format (transactionId -> imageUrl)
        const receiptsMap: Record<string, string> = {};
        receipts.forEach((r: any) => {
          receiptsMap[r.id] = r.imageUrl;
        });
        set({ receipts: receiptsMap });
      },
      uploadReceiptToBackend: async (imageUrl: string, data: any) => {
        const receipt = await receiptApi.uploadReceipt(imageUrl, data);
        // Optionally update local receipts state
        set((state) => ({
          receipts: { ...state.receipts, [receipt.id]: receipt.imageUrl },
        }));
        return receipt;
      },
      deleteReceiptFromBackend: async (id: string) => {
        await receiptApi.deleteReceipt(id);
        set((state) => {
          const updatedReceipts = { ...state.receipts };
          delete updatedReceipts[id];
          return { receipts: updatedReceipts };
        });
      },
      getReceiptFromBackend: async (id: string) => {
        return await receiptApi.getReceipt(id);
      },
    }),
    {
      name: "budget-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        income: state.income,
        categories: state.categories,
        transactions: state.transactions,
        baseCurrency: state.baseCurrency,
        receipts: state.receipts,
        selectedMonth: state.selectedMonth,
        defaultIncome: state.defaultIncome,
        defaultCategoryBudgets: state.defaultCategoryBudgets,
        // Do not overwrite currencies with default, persist the actual state
        currencies:
          state.currencies.length > 0 ? state.currencies : defaultCurrencies,
      }),
    }
  )
);

// Import after the store definition to avoid circular dependency
import { defaultCurrencies } from "@/constants/currencies";

export default useBudgetStore;
