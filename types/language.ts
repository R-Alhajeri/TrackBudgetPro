export type SupportedLanguage = "en" | "es" | "ar";

export interface Translation {
  // General
  dashboard: string;
  categories: string;
  transactions: string;
  settings: string;
  profile: string;
  signIn: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;

  // Budget overview
  budgetDashboard: string;
  budgetOverview: string;
  income: string;
  spent: string;
  remaining: string;
  totalBudget: string;

  // Income
  setIncome: string;
  startBySettingIncome: string;
  setAsDefaultIncome: string;
  setForCurrentMonthOnly: string;
  defaultIncomeDescription: string;
  monthlyIncomeDescription: string;
  incomeUpdated: string;
  enterIncome: string;
  incomeInputAccessibilityLabel: string;
  incomeInputAccessibilityHint: string;
  submitIncomeAccessibilityLabel: string;
  submitIncomeAccessibilityHint: string;
  invalidIncome: string;
  incomePlaceholder: string;
  default: string;
  thisMonthOnly: string;
  setIncomeFirst: string;

  // Categories
  addCategory: string;
  categoryName: string;
  monthlyBudget: string;
  icon: string;
  color: string;
  setAsDefaultBudget: string;
  defaultBudgetDescription: string;
  monthlyBudgetDescription: string;
  topCategories: string;
  seeAll: string;
  youHaventCreatedCategories: string;
  createCategories: string;

  // Transactions
  addTransaction: string;
  description: string;
  amount: string;
  date: string;
  category: string;

  // Receipt scanner
  scanReceipt: string;
  needCameraPermission: string;
  grantPermission: string;
  positionReceiptWithinFrame: string;
  processing: string;
  scanningReceipt: string;
  retake: string;
  useReceipt: string;
  receipt: string;
  merchant: string;
  total: string;
  close: string;

  // Settings
  language: string;
  theme: string;
  currency: string;
  notifications: string;
  exportData: string;
  importData: string;
  resetData: string;
  about: string;
  feedback: string;

  // Authentication
  login: string;
  signup: string;
  email: string;
  password: string;
  forgotPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;

  // Errors
  error: string;
  somethingWentWrong: string;
  tryAgain: string;

  // Empty states
  noTransactions: string;
  noCategories: string;
  addYourFirst: string;

  // Additional keys needed for the app
  expenses: string;
  balance: string;
  budget: string;
  overview: string;
  categoryBudget: string;
  categoryColor: string;
  addingTo: string;
  loading: string;
  errorOccurred: string;
  success: string;
  back: string;
  next: string;
  done: string;
  confirm: string;
  unknown: string;
  logout: string;
  transactionAmount: string;
  transactionDate: string;
  transactionCategory: string;
  transactionDescription: string;
  noTransactionsYet: string;
  noCategoriesYet: string;
  addYourFirstCategory: string;
  addYourFirstTransaction: string;
  notification: string;
  rateApp: string;
  shareApp: string;
  privacyPolicy: string;
  termsOfService: string;
  version: string;
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;
  english: string;
  arabic: string;
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
  sendFeedback: string;
  feedbackType: string;
  feedbackMessage: string;
  feedbackSuccess: string;
  confirmDelete: string;
  areYouSureDeleteCategory: string;
  areYouSureDeleteTransaction: string;
  invalidAmount: string;
  requiredField: string;
  invalidEmail: string;
  invalidPassword: string;
  failedToLoadReceiptImage: string;
  appName: string;
  editCategory: string;
  deleteCategory: string;
  editTransaction: string;
  deleteTransaction: string;
  welcomeToBudget: string;
  updateIncome: string;
  overBy: string;
  of: string;
  areYouSureToLogout: string;
  user: string;
  standardUser: string;
  appVersion: string;

  // Subscription Page
  unlockFullAccess: string;
  subscribeToBudgetTracker: string;
  subscriptionBenefits: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  alreadySubscribed: string;
  budgetTracker: string;
  retrySubscription: string;

  // Currency selector
  searchCurrency: string;
  currenciesAvailable: string;
  currenciesList: string;

  // Category card
  pressToViewTransactions: string;

  // Transaction type
  transactionType: string;

  // Category validation
  categoryNameRequired: string;
  categoryNameTooLong: string;
  invalidCharacters: string;
  budgetRequired: string;
  enterValidAmount: string;
  categoryNamePlaceholder: string;
  iconSelection: string;
  submitCategoryDetails: string;

  // Receipt and Transaction Additional Keys
  aiPoweredScan: string;
  receiptUploaded: string;
  change: string;
  enterDescription: string;
  whatWasThisExpenseFor: string;
  receiptCaptured: string;
  changeReceipt: string;
  addingTransactionFor: string;
  expense: string;
  transactionAdded: string;
  errorAddingTransaction: string;

  // Chart labels
  monthlySummary: string;
  totalSpent: string;
  average: string;
  spendingByCategory: string;
  lastWeekSpending: string;
  todaySpending: string;
  lastNDaysSpending: string;
  recentTransactions: string;
  increasing: string;
  decreasing: string;
  stable: string;

  // Budget summary page
  budgetSummaryDescription: string;
  whatIsBudgetSummary: string;
  budgetSummaryExplanation: string;
  howToUse: string;
  budgetSummaryUsage: string;

  // Component translations
  pleaseFixErrors: string;
  pleaseCompleteAllFields: string;
  pleaseEnterValidAmount: string;
  comingSoon: string;
  receiptScannerComingSoon: string;
  firstAvailableMonth: string;
  home: string;

  // Subscription
  premiumSubscription: string;
  unlockFinancialPotential: string;
  unlimitedCategoriesTransactions: string;
  noLimitsOrganization: string;
  advancedAnalytics: string;
  deepSpendingInsights: string;
  excelExport: string;
  professionalReports: string;
  removeAds: string;
  cleanExperience: string;
  prioritySupport: string;
  getHelpWhenNeeded: string;
  cancelAnytimeNoFees: string;
  whatsIncluded: string;
  premiumActive: string;
  until: string;
  upgradeToPremium: string;
  currentlyDemoMode: string;
  upgradeToUnlock: string;
  securePaymentCancel: string;
  manageSubscriptionIOS: string;
  manageSubscriptionAndroid: string;
  subscriptionManagedByStore: string;
  subscriptionStatus: string;
  activeUntil: string;
  subscribed: string;
  notSubscribed: string;
  guestLimitReached: string;
  guestCategoryLimitMessage: string;
  guestTransactionLimitMessage: string;
  createFreeAccount: string;
}

export type LanguageCode = "en" | "es" | "ar";

export interface LanguageState {
  language: LanguageCode;
  isRTL: boolean;
  setLanguage: (language: LanguageCode) => void;
  t: (
    key: keyof Translation,
    params?: Record<string, string | number>
  ) => string;
  resetLanguage?: () => void;
}
