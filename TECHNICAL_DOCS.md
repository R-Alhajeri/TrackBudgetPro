# 🔧 TrackBudgetPro - Technical Documentation

## 🏗️ System Architecture

### **Application Layers**

```
┌─────────────────────────────────────┐
│            UI Layer (React Native)  │
├─────────────────────────────────────┤
│         State Layer (Zustand)       │
├─────────────────────────────────────┤
│        Service Layer (Firebase)     │
├─────────────────────────────────────┤
│         Data Layer (Firestore)      │
└─────────────────────────────────────┘
```

### **Component Architecture**

```
app/                    # Expo Router Pages
├── (tabs)/            # Main app navigation
│   ├── index.tsx      # Dashboard/Home
│   ├── budget.tsx     # Budget overview
│   ├── transactions.tsx # Transaction list
│   ├── analytics.tsx  # Analytics & reports
│   └── settings.tsx   # App settings
├── (admin)/           # Admin panel
│   ├── index.tsx      # Admin dashboard
│   └── not-found.tsx  # Admin 404 page
├── category/[id].tsx  # Category details
├── receipt/[id].tsx   # Receipt viewer
└── _layout.tsx        # Root layout
```

## 🔥 Firebase Implementation

### **Database Schema (Firestore)**

#### **Users Collection (`/users/{userId}`)**

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: {
    currency: string;
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: boolean;
  };
  subscription: {
    plan: "free" | "premium";
    status: "active" | "cancelled" | "expired";
    expiresAt?: Timestamp;
  };
}
```

#### **Budgets Collection (`/budgets/{budgetId}`)**

```typescript
interface Budget {
  id: string;
  userId: string;
  name: string;
  totalBudget: number;
  currency: string;
  period: "monthly" | "weekly" | "yearly";
  categories: CategoryBudget[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

interface CategoryBudget {
  categoryId: string;
  allocated: number;
  spent: number;
  remaining: number;
}
```

#### **Transactions Collection (`/transactions/{transactionId}`)**

```typescript
interface Transaction {
  id: string;
  userId: string;
  budgetId: string;
  categoryId: string;
  amount: number;
  currency: string;
  description: string;
  type: "expense" | "income";
  date: Timestamp;
  receipt?: {
    url: string;
    fileName: string;
    size: number;
  };
  location?: {
    name: string;
    coordinates: GeoPoint;
  };
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### **Categories Collection (`/categories/{categoryId}`)**

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  isDefault: boolean;
  userId?: string; // null for default categories
  parentId?: string; // for subcategories
  isActive: boolean;
  createdAt: Timestamp;
}
```

### **Security Rules**

#### **Firestore Rules (`firestore.rules`)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
        resource.data.role == 'admin' &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Budget data per user
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Transactions per user
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Categories - read for all authenticated users, write for own custom categories
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        (resource.data.userId == request.auth.uid || resource.data.userId == null);
    }

    // Admin only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### **Storage Rules (`storage.rules`)**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Receipt images - users can only access their own
    match /receipts/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Profile images
    match /profiles/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin can access all files
    match /{allPaths=**} {
      allow read, write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🗄️ State Management (Zustand)

### **Store Architecture**

```typescript
// store/auth-store.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// store/budget-store.ts
interface BudgetState {
  budgets: Budget[];
  currentBudget: Budget | null;
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  fetchBudgets: () => Promise<void>;
  createBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (
    id: string,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}
```

### **Store Composition Pattern**

```typescript
// Combined store for complex operations
const useBudgetWithTransactions = () => {
  const { budgets, currentBudget } = useBudgetStore();
  const { transactions } = useTransactionStore();

  const currentBudgetTransactions = useMemo(
    () => transactions.filter((t) => t.budgetId === currentBudget?.id),
    [transactions, currentBudget?.id]
  );

  return { budgets, currentBudget, currentBudgetTransactions };
};
```

## 🎨 UI Component System

### **Component Hierarchy**

```
components/
├── core/              # Base components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Card.tsx
├── layout/            # Layout components
│   ├── Header.tsx
│   ├── Navigation.tsx
│   └── Container.tsx
├── budget/            # Budget-specific
│   ├── BudgetCard.tsx
│   ├── CategoryCard.tsx
│   └── BudgetSummary.tsx
├── transaction/       # Transaction-specific
│   ├── TransactionItem.tsx
│   ├── TransactionList.tsx
│   └── AddTransactionModal.tsx
└── admin/             # Admin components
    ├── UserList.tsx
    ├── UserActions.tsx
    └── AdminDashboard.tsx
```

### **Theme System**

```typescript
// constants/colors.ts
export const themes = {
  light: {
    primary: "#007AFF",
    secondary: "#5856D6",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#000000",
    textSecondary: "#8E8E93",
    border: "#C6C6C8",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
  },
  dark: {
    primary: "#0A84FF",
    secondary: "#5E5CE6",
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    border: "#38383A",
    success: "#30D158",
    warning: "#FF9F0A",
    error: "#FF453A",
  },
};

// hooks/useAppTheme.ts
export const useAppTheme = () => {
  const { theme } = useThemeStore();
  const systemTheme = useColorScheme();

  const resolvedTheme = theme === "auto" ? systemTheme : theme;
  const colors = themes[resolvedTheme || "light"];

  return { colors, theme: resolvedTheme };
};
```

## 🔄 Data Flow & Synchronization

### **Real-time Data Flow**

```typescript
// lib/firebase.ts
export const subscribeToUserBudgets = (
  userId: string,
  callback: (budgets: Budget[]) => void
) => {
  return onSnapshot(
    query(
      collection(firestore, "budgets"),
      where("userId", "==", userId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    ),
    (snapshot) => {
      const budgets = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Budget)
      );
      callback(budgets);
    }
  );
};

// store/budget-store.ts
const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  // ... other state

  subscribeToBudgets: (userId: string) => {
    const unsubscribe = subscribeToUserBudgets(userId, (budgets) => {
      set({ budgets, isLoading: false });
    });
    return unsubscribe;
  },
}));
```

### **Offline Data Strategy**

```typescript
// lib/offline.ts
export const enableOfflinePersistence = async () => {
  try {
    await enableNetwork(firestore);
    console.log("Firebase offline persistence enabled");
  } catch (error) {
    console.error("Failed to enable offline persistence:", error);
  }
};

// Optimistic updates pattern
export const optimisticUpdate = async <T>(
  optimisticData: T,
  updateFunction: () => Promise<T>,
  rollbackFunction: (error: Error) => void
) => {
  try {
    // Apply optimistic update immediately
    // Then perform actual update
    const result = await updateFunction();
    return result;
  } catch (error) {
    // Rollback on error
    rollbackFunction(error as Error);
    throw error;
  }
};
```

## 🧪 Testing Strategy

### **Testing Structure**

```
__tests__/
├── components/        # Component tests
├── stores/           # State management tests
├── utils/            # Utility function tests
├── integration/      # Integration tests
└── e2e/             # End-to-end tests
```

### **Testing Utilities**

```typescript
// __tests__/utils/test-utils.tsx
export const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <NavigationContainer>{children}</NavigationContainer>
  );

  return render(ui, { wrapper: Wrapper });
};

// Mock Firebase for testing
export const mockFirebase = {
  auth: () => mockAuth,
  firestore: () => mockFirestore,
  storage: () => mockStorage,
};
```

## 🚀 Performance Optimization

### **Code Splitting**

```typescript
// Lazy loading for heavy components
const AdminPanel = lazy(() => import("../components/AdminPanel"));
const Analytics = lazy(() => import("../components/Analytics"));

// Route-based code splitting with Expo Router
export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Stack.Screen name="admin" component={AdminPanel} />
    </Suspense>
  );
}
```

### **Image Optimization**

```typescript
// utils/image.ts
export const optimizeImage = async (uri: string): Promise<string> => {
  const { uri: optimizedUri } = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return optimizedUri;
};
```

### **Bundle Analysis**

```bash
# Analyze bundle size
npx expo-bundle-analyzer

# Optimize images
npx expo optimize

# Tree shake unused code
npx expo export --clear
```

---

_Technical documentation last updated: June 11, 2025_  
_For API documentation, see Firebase Console_  
_For deployment guide, see DEPLOYMENT_GUIDE.md_
