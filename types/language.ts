export interface Translation {
  // Common
  appName: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  close: string;
  success: string;
  error: string;
  errorOccurred: string;
  sessionExpiredPleaseLogin: string; // Added
  authenticationRequiredToViewDashboard: string; // Added

  // Dashboard
  dashboard: string;
  budgetDashboard: string;
  budgetOverview: string;
  thisMonth: string;
  remaining: string;
  income: string;
  spent: string;
  categories: string;
  topCategories: string;
  seeAll: string;
  welcomeToBudget: string;
  startBySettingIncome: string;
  setIncome: string;
  updateIncome: string;
  youHaventCreatedCategories: string;
  createCategories: string;

  // Categories
  category: string;
  categoryName: string;
  monthlyBudget: string;
  icon: string;
  color: string;
  addCategory: string;
  noCategoriesYet: string;
  createBudgetCategories: string;
  setYourIncomeFirst: string;
  pleaseSetIncome: string;
  goToDashboard: string;
  overBy: string;
  of: string;

  // Transactions
  transactions: string;
  transaction: string;
  addTransaction: string;
  noTransactionsYet: string;
  startTrackingExpenses: string;
  createCategoriesFirst: string;
  needToCreateCategories: string;
  description: string;
  whatWasThisExpenseFor: string;
  receipt: string;
  scanReceipt: string;
  receiptCaptured: string;
  changeReceipt: string;
  spendingSummary: string;
  totalSpent: string;
  average: string;
  spendingByCategory: string;
  last7Days: string;
  recentTransactions: string;
  transactionAdded: string;
  errorAddingTransaction: string;

  // Settings
  settings: string;
  appSettings: string;
  notifications: string;
  manageBudgetAlerts: string;
  darkMode: string;
  language: string;
  baseCurrency: string;
  current: string;
  budgetData: string;
  budgetSummary: string;
  resetAllData: string;
  deleteAllBudgetInfo: string;
  feedback: string;
  sendFeedback: string;
  requestFeaturesReportIssues: string;
  about: string;
  helpAndSupport: string;
  aboutBudgetTracker: string;
  aboutAppDescription: string;
  version: string;

  // Currency
  selectCurrency: string;
  searchCurrencies: string;
  currencyChanged: string;
  currencyChangeApplied: string;
  changeCurrencyTitle: string;
  changeCurrencyWarning: string;
  resetAndChange: string;
  changeOnly: string;
  currencyChangedAndDataReset: string;

  // Receipt Scanner
  scanningReceipt: string;
  positionReceiptWithinFrame: string;
  useReceipt: string;
  retake: string;
  processing: string;
  needCameraPermission: string;
  grantPermission: string;

  // Feedback
  feedbackType: string;
  featureRequest: string;
  reportBug: string;
  general: string;
  yourFeedback: string;
  describeFeature: string;
  describeIssue: string;
  shareThoughts: string;
  sending: string;
  pleaseEnterYourFeedback: string;
  feedbackContainsInvalidContent: string;

  // Alerts
  resetAllDataTitle: string;
  resetAllDataMessage: string;
  reset: string;
  thankYou: string;
  feedbackSubmitted: string;
  dataResetComplete: string;
  allDataHasBeenReset: string;

  // Receipt Details
  receiptDetails: string;
  merchant: string;
  date: string;
  total: string;
  items: string;
  downloadReceipt: string;
  receiptNotFound: string;
  goBack: string;

  // Admin Panel
  adminPanel: string;
  adminPanelDescription: string;
  analyticsDashboard: string;
  userManagement: string;
  userFeedbackSuggestions: string;
  appSettingsAdmin: string;
  totalUsers: string;
  activeUsers: string;
  newThisMonth: string;
  avgSession: string;
  totalTransactions: string;
  totalMoneyManaged: string;
  viewDetailedReports: string;
  viewAllUsers: string;
  viewAllFeedback: string;
  updateCurrencyRates: string;
  sendGlobalNotification: string;
  manageAppFeatures: string;
  deactivate: string;
  activate: string;
  markAsRead: string;
  logoutAdmin: string;
  logout: string;
  areYouSureToLogout: string;
  noUsersAvailable: string;
  noFeedbackAvailable: string;
  active: string;
  inactive: string;
  appSettingsAdminDescription: string;
  areYouSureToPerformAction: string;
  thisUser: string;
  userHasBeen: string;
  markThisFeedbackAsRead: string;
  feedbackMarkedAsRead: string;

  // Enhanced Admin Panel
  overview: string;
  users: string;
  day: string;
  week: string;
  month: string;
  year: string;
  userMetrics: string;
  performanceMetrics: string;
  topCountries: string;
  country: string;
  revenue: string;
  totalRevenue: string;
  avgTransactionValue: string;
  monthlyRevenue: string;
  conversionRate: string;
  appCrashes: string;
  avgLoadTime: string;
  retentionRate: string;
  exportReport: string;
  detailedAnalytics: string;
  searchUsers: string;
  filter: string;
  export: string;
  user: string;
  email: string;
  status: string;
  actions: string;
  noUsersFound: string;
  searchFeedback: string;
  noFeedbackFound: string;
  from: string;
  setPriority: string;
  priority: string;
  low: string;
  medium: string;
  high: string;
  priorityUpdated: string;
  areYouSureToDeleteFeedback: string;
  feedbackDeleted: string;
  selectPriorityLevel: string;
  appConfiguration: string;
  securitySettings: string;
  systemMonitoring: string;
  manageUserRoles: string;
  viewAuditLogs: string;
  systemAlerts: string;
  showSystemAlerts: string;
  hideSystemAlerts: string;
  systemPerformance: string;
  resolve: string;
  ignore: string;
  alertResolved: string;
  alertIgnored: string;
  exportSuccess: string;
  dataExportedSuccessfully: string;
  sendNotification: string;
  enterNotificationMessage: string;
  send: string;
  notificationSent: string;

  // Subscription Metrics
  subscriptionRevenue: string;
  monthlyRecurringRevenue: string;
  annualRecurringRevenue: string;
  revenueGrowth: string;
  averageRevenuePerUser: string;
  subscriptionMetrics: string;
  totalSubscribers: string;
  activeSubscriptions: string;
  canceledSubscriptions: string;
  avgSubscriptionLength: string;
  subscriptionPlans: string;
  plan: string;
  subscribers: string;
  churnRate: string;
  revenueByCountry: string;
  exportRevenueReport: string;
  updateSubscriptionPlans: string;
  manageFeatures: string;
  price: string;
  monthlyPlan: string;
  yearlyPlan: string;

  // Additional keys for settings functionality
  account: string;
  accessAdminControls: string;
  signOutOfYourAccount: string;
  loginSignUp: string;
  accessYourAccount: string;
  dataManagement: string;
  exportData: string;
  saveYourBudgetData: string;
  importData: string;
  restoreYourBudgetData: string;
  madeWithLove: string;
  logoutConfirmation: string;
  logoutWithReset: string;
  notificationsEnabled: string;
  notificationsDisabled: string;
  notificationsEnabledMessage: string;
  notificationsDisabledMessage: string;
  helpAndSupportMessage: string;
  contactSupport: string;
  visitFAQ: string;
  privacyPolicy: string;
  termsOfService: string;
  importSuccess: string;
  dataImportedSuccessfully: string;
  importDataConfirmation: string;
  import: string;
  invalidImportFile: string;

  // Additional keys for signin and admin
  profile: string;
  signIn: string;
  administrator: string;
  standardUser: string;
  appVersion: string;
  exportError: string;
  filterUsers: string;
  selectFilterOptions: string;
  filterByStatus: string;
  selectStatus: string;
  all: string;
  filterByPlan: string;
  selectPlan: string;
  monthly: string;
  yearly: string;
  resetFilters: string;
  filterFeedback: string;
  filterByType: string;
  selectType: string;
  filterByPriority: string;
  selectPriority: string;
  filterByReadStatus: string;
  selectReadStatus: string;
  read: string;
  unread: string;
  thisFeatureIsComingSoon: string;

  // AddCategoryModal validation errors
  categoryNameRequired: string;
  categoryNameTooLong: string;
  categoryNameInvalid: string;
  budgetRequired: string;
  budgetInvalid: string;

  // Login/Signup/Validation
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMinLength: string;
  passwordNumber: string;
  passwordSpecial: string;
  passwordUppercase: string;
  passwordLowercase: string;
  confirmPasswordRequired: string;
  passwordsDoNotMatch: string;
  nameRequired: string;
  loginFailed: string;
  loginError: string;
  loginTooManyAttempts: string;
  loginNote: string;
  loginWelcome: string;
  loginSubtitle: string;
  loginButton: string;
  signupPrompt: string;
  signupLink: string;
  signupTitle: string;
  signupSubtitle: string;
  signupButton: string;
  signupFailed: string;
  signupError: string;
  signupNote: string;
  alreadyHaveAccount: string;
  adminAccessDenied: string;
  adminAccessDeniedDesc: string;
  adminDashboardTitle: string;
  adminDashboardWelcome: string;
  adminUserManagement: string;
  adminUserManagementDesc1: string;
  adminUserManagementDesc2: string;
  adminAnalytics: string;
  adminAnalyticsDesc1: string;
  adminAnalyticsDesc2: string;
  adminSettings: string;
  adminSettingsDesc1: string;
  adminSettingsDesc2: string;

  // Not Found / 404
  notFoundTitle: string;
  notFoundMessage: string;
  goHome: string;

  // Modal
  modalTitle: string;
  modalDescription: string;

  // AddTransactionModal
  amountRequired: string;
  amountPlaceholder: string;
  descriptionRequired: string;
  descriptionTooLong: string;
  descriptionInvalid: string;
  categoryRequired: string;
  addingToMonth: string;

  lastLogin: string;
  continueAsGuest: string;
  guestLimitReached: string;
  upgradeToUnlock: string;

  // Onboarding/Tour
  onboardingWelcomeTitle: string;
  onboardingWelcomeDesc: string;
  onboardingAddTransactionTitle: string;
  onboardingAddTransactionDesc: string;
  onboardingCategoriesTitle: string;
  onboardingCategoriesDesc: string;
  onboardingPrivacyTitle: string;
  onboardingPrivacyDesc: string;
  step: string;
  next: string;
  finish: string;

  setAsDefaultIncome: string;
  setAsDefaultCategoryBudget: string;
  usingDefaultIncome: string;
  usingDefaultCategoryBudgets: string;
  overrideForThisMonth: string;
}

export interface LanguageState {
  language: "en" | "ar";
  translations: Record<"en" | "ar", Translation>;
  t: (key: keyof Translation) => string;
  setLanguage: (language: "en" | "ar") => void;
  isRTL: boolean;
  resetLanguage: () => void;
}
