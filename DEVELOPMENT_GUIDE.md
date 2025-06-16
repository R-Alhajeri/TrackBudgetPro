# 📱 TrackBudgetPro - Development Guide

## 🏗️ Project Architecture

### **Core Structure**

```
trackbudgetpro-v3/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   ├── (admin)/           # Admin panel
│   └── category/          # Category management
├── components/            # Reusable UI components
├── lib/                   # Core libraries & Firebase
├── store/                 # Zustand state management
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── constants/             # App constants & themes
```

### **Technology Stack**

- **Framework**: Expo SDK 53 with Expo Router
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: React Native with custom theming
- **Navigation**: Expo Router (file-based routing)

## 🔥 Firebase Configuration

### **Production Setup**

- **Project ID**: `elegantbudgettracker`
- **iOS Bundle**: `com.alhajeritech.trackbudgetpro`
- **Android Package**: `com.alhajeritech.trackbudgetpro`
- **Web Domain**: `elegantbudgettracker.firebaseapp.com`

### **Services Enabled**

- ✅ Authentication (Email/Password)
- ✅ Firestore Database
- ✅ Cloud Storage
- ✅ Analytics (optional)

### **Configuration Files**

- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)
- `lib/firebase.ts` (Web fallback)
- `lib/firebase.production.ts` (Production config)

## 🚀 Development Workflow

### **Development Build (with Firebase)**

```bash
# Install dependencies
npm install

# Create development build with Firebase native modules
eas build --profile development --platform ios
eas build --profile development --platform android
```

### **Expo Go Development (Mock Firebase)**

```bash
# Start development server
npm start

# Uses mock Firebase implementation
# Good for UI/UX development
```

### **Production Build**

```bash
# Build for app stores
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 🎨 UI/UX Guidelines

### **Theme System**

- Uses custom hook `useAppTheme()` for consistent theming
- Supports light/dark mode
- Colors defined in `constants/colors.ts`

### **Component Structure**

- All components in `/components` directory
- TypeScript interfaces in `/types`
- Consistent styling patterns

### **Navigation**

- File-based routing with Expo Router
- Tab navigation for main features
- Stack navigation for detailed views

## 📊 State Management

### **Stores (Zustand)**

- `auth-store.ts` - User authentication
- `budget-store.ts` - Budget data & transactions
- `theme-store.ts` - UI theme preferences
- `language-store.ts` - Internationalization
- `notification-store.ts` - Push notifications
- `subscription-store.ts` - Premium features

### **Data Flow**

```
User Action → Store Update → Component Re-render → Firebase Sync
```

## 🛠️ Key Features

### **Core Functionality**

- ✅ Budget tracking & categorization
- ✅ Receipt scanning with camera
- ✅ Monthly budget summaries
- ✅ Multi-currency support
- ✅ Dark/light theme toggle

### **Admin Panel**

- ✅ Firebase user management
- ✅ User role management (admin/user)
- ✅ Password reset functionality
- ✅ User account actions (enable/disable/delete)

### **Premium Features**

- ✅ Advanced analytics
- ✅ Export functionality
- ✅ Cloud backup
- ✅ Premium themes

## 🧪 Testing Strategy

### **Development Testing**

1. **Expo Go**: UI/UX testing with mock data
2. **Development Build**: Real Firebase testing
3. **Production Build**: Final testing before release

### **Firebase Testing**

- Development: Mock implementation
- Staging: Real Firebase with test data
- Production: Real Firebase with production data

## 🔧 Troubleshooting

### **Common Issues**

1. **Firebase Auth fails in Expo Go**: Expected behavior, use development build
2. **Route not found**: Check file naming in `app/` directory
3. **Theme not applying**: Verify `useAppTheme()` hook usage

### **Debug Tools**

- React Native Debugger
- Expo Development Tools
- Firebase Console
- Chrome DevTools (web)

## 📦 Dependencies

### **Core Dependencies**

- `expo`: Latest SDK
- `expo-router`: File-based routing
- `firebase`: Web SDK
- `@react-native-firebase/*`: Native modules
- `zustand`: State management
- `react-native`: Core framework

### **Development Dependencies**

- `typescript`: Type checking
- `@types/*`: Type definitions
- `eas-cli`: Build & deployment

## 🎯 Future Development

### **Planned Features**

- [ ] Real-time collaboration
- [ ] Advanced reporting
- [ ] AI-powered insights
- [ ] Apple Pay/Google Pay integration

### **Performance Optimizations**

- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Bundle size optimization

## 📄 License & Credits

- **License**: Private/Commercial
- **Developer**: AlHajeri Tech
- **Firebase**: Google Cloud Platform
- **UI Library**: React Native

---

_Last updated: June 11, 2025_
