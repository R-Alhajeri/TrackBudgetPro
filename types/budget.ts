export interface Category {
  id: string;
  name: string;
  budget: number;
  icon: string;
  color: string;
  spent?: number;
  monthlyBudgets?: Record<string, number>; // YYYY-MM -> budget amount
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptData {
  total: number;
  date: string;
  merchant: string;
  items?: ReceiptItem[];
  category?: string;
}

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  userId: string; // NEW: associate transaction with a user
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  type: TransactionType; // New field to distinguish between expense and income
  receiptImageUri?: string;
  receiptData?: ReceiptData;
  originalAmount?: number;
  currency?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

export interface BudgetState {
  income: number;
  monthlyIncomes: Record<string, number>; // YYYY-MM -> income amount
  categories: Category[];
  transactions: Transaction[];
  baseCurrency: string;
  currencies: Currency[];
  receipts: Record<string, string>; // transactionId -> imageUri
  selectedMonth: string; // YYYY-MM

  // Actions
  setIncome: (income: number) => void;
  setMonthlyIncome: (month: string, income: number) => void;
  getIncomeForMonth: (month: string) => number;
  addCategory: (category: Omit<Category, "id" | "spent">) => void;
  updateCategory: (id: string, category: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
  setCategoryMonthlyBudget: (
    categoryId: string,
    month: string,
    budget: number
  ) => void;
  addTransaction: (
    transaction: Omit<Transaction, "id"> & { currency?: string }
  ) => string;
  updateTransaction?: (
    id: string,
    transaction: Partial<Omit<Transaction, "id">>
  ) => void;
  deleteTransaction: (id: string) => void;
  setBaseCurrency: (currencyCode: string) => void;
  updateCurrencyRates?: (currencies: Partial<Currency>[]) => void;
  addReceipt?: (
    transactionId: string,
    imageUri: string,
    receiptData?: ReceiptData
  ) => void;
  deleteReceipt?: (transactionId: string) => void;
  setSelectedMonth: (month: string) => void;
  resetBudgetData: () => void;
  getFirstIncomeMonth: () => string | null;
  updateCategorySpentAmounts: () => void;
}
