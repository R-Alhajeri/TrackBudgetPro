export interface Category {
  id: string;
  name: string;
  budget: number;
  color: string;
  icon: string;
  spent: number;
  total?: number; // Represents the total value for charting purposes
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  currency?: string;
  originalAmount?: number;
  receiptImage?: string;
  receiptData?: ReceiptData;
}

export interface ReceiptData {
  merchant?: string;
  date?: string;
  total?: number;
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate relative to base currency (USD)
}

export interface BudgetState {
  income: number;
  categories: Category[];
  transactions: Transaction[];
  baseCurrency: string;
  currencies: Currency[];
  receipts: Record<string, string>; // transactionId -> receipt image URI
  selectedMonth: string;
  defaultIncome: number;
  defaultCategoryBudgets: Record<string, number>;

  // Actions
  setIncome: (income: number) => void;
  addCategory: (category: Omit<Category, "id" | "spent">) => void;
  updateCategory: (
    id: string,
    category: Partial<Omit<Category, "id" | "spent">>
  ) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => string;
  deleteTransaction: (id: string) => void;
  setBaseCurrency: (currencyCode: string) => void;
  updateCurrencyRates: (currencies: Partial<Currency>[]) => void;
  addReceipt: (
    transactionId: string,
    imageUri: string,
    receiptData?: ReceiptData
  ) => void;
  deleteReceipt: (transactionId: string) => void;
  setSelectedMonth: (month: string) => void;
  resetBudgetData: () => void;
  setDefaultIncome: (income: number) => void;
  setDefaultCategoryBudgets: (categories: Record<string, number>) => void;

  // Backend actions
  fetchBudgetFromBackend?: (year: number, month: number) => Promise<void>;
  setBudgetToBackend?: (
    year: number,
    month: number,
    income: number,
    categories: Record<string, number>
  ) => Promise<void>;
  fetchCategoriesFromBackend?: () => Promise<Category[]>; // Change return type to Category[]
  createCategoryInBackend?: (
    name: string,
    color: string,
    icon: string
  ) => Promise<void>; // Restore to previous: just void, not Category
  updateCategoryInBackend?: (
    id: string,
    name: string,
    color: string,
    icon: string
  ) => Promise<void>;
  deleteCategoryInBackend?: (id: string) => Promise<void>;
  fetchTransactionsFromBackend?: (year: number, month: number) => Promise<void>;
  createTransactionInBackend?: (
    input: Omit<Transaction, "id">,
    year: number,
    month: number
  ) => Promise<void>;
  updateTransactionInBackend?: (
    input: Transaction,
    year: number,
    month: number
  ) => Promise<void>;
  deleteTransactionInBackend?: (
    id: string,
    year: number,
    month: number
  ) => Promise<void>;
  // Receipt backend actions
  fetchReceiptsFromBackend?: () => Promise<void>;
  uploadReceiptToBackend?: (imageUrl: string, data: any) => Promise<any>;
  deleteReceiptFromBackend?: (id: string) => Promise<void>;
  getReceiptFromBackend?: (id: string) => Promise<any>;
}
