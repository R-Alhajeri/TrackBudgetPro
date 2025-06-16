#!/bin/bash

# TrackBudgetPro - Database Migration Script
# Migrates from flat structure to optimized subcollection structure

set -e  # Exit on any error

echo "🔄 TrackBudgetPro - Database Migration to Optimized Structure"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed.${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${BLUE}ℹ️  Checking Firebase CLI version...${NC}"
firebase --version

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Firebase.${NC}"
    echo "Logging in..."
    firebase login
fi

echo -e "${BLUE}ℹ️  Current Firebase projects:${NC}"
firebase projects:list

# Get project ID
echo -e "${YELLOW}📝 Enter your Firebase project ID:${NC}"
read -r PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set the project
firebase use "$PROJECT_ID"

echo -e "${GREEN}✅ Using Firebase project: $PROJECT_ID${NC}"

# Deploy Firestore indexes first
echo -e "${BLUE}📊 Deploying Firestore indexes...${NC}"
if [ -f "firestore.indexes.json" ]; then
    firebase deploy --only firestore:indexes --project "$PROJECT_ID"
    echo -e "${GREEN}✅ Firestore indexes deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  firestore.indexes.json not found, skipping index deployment${NC}"
fi

# Deploy security rules
echo -e "${BLUE}🔐 Deploying Firestore security rules...${NC}"
if [ -f "firestore.rules" ]; then
    firebase deploy --only firestore:rules --project "$PROJECT_ID"
    echo -e "${GREEN}✅ Firestore security rules deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  firestore.rules not found, skipping rules deployment${NC}"
fi

# Deploy storage rules
echo -e "${BLUE}📦 Deploying Storage security rules...${NC}"
if [ -f "storage.rules" ]; then
    firebase deploy --only storage --project "$PROJECT_ID"
    echo -e "${GREEN}✅ Storage security rules deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  storage.rules not found, skipping storage rules deployment${NC}"
fi

# Create migration cloud function
echo -e "${BLUE}☁️  Creating migration Cloud Function...${NC}"

# Create functions directory if it doesn't exist
mkdir -p functions
cd functions

# Initialize Cloud Functions if not already done
if [ ! -f "package.json" ]; then
    echo -e "${BLUE}📦 Initializing Cloud Functions...${NC}"
    npm init -y
    npm install firebase-functions firebase-admin
fi

# Create migration function
cat > index.js << 'EOF'
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Migration function to move data from flat structure to subcollections
exports.migrateToOptimizedStructure = functions.https.onRequest(async (req, res) => {
  try {
    console.log('🔄 Starting migration to optimized structure...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const migrationResults = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`📝 Migrating data for user: ${userId}`);
      
      try {
        // Migrate transactions
        const transactionsSnapshot = await db.collection('transactions')
          .where('userId', '==', userId)
          .get();
        
        const batch = db.batch();
        let transactionCount = 0;
        
        for (const transactionDoc of transactionsSnapshot.docs) {
          const transactionData = transactionDoc.data();
          
          // Add to new subcollection structure
          const newTransactionRef = db.collection(`users/${userId}/transactions`).doc(transactionDoc.id);
          
          // Enhance with denormalized data
          const enhancedTransaction = {
            ...transactionData,
            categoryName: transactionData.categoryName || 'Unknown',
            categoryIcon: transactionData.categoryIcon || '📝',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          batch.set(newTransactionRef, enhancedTransaction);
          transactionCount++;
          
          // Execute batch every 500 operations
          if (transactionCount % 500 === 0) {
            await batch.commit();
            console.log(`✅ Migrated ${transactionCount} transactions for user ${userId}`);
          }
        }
        
        // Commit remaining transactions
        if (transactionCount % 500 !== 0) {
          await batch.commit();
        }
        
        // Migrate categories
        const categoriesSnapshot = await db.collection('categories')
          .where('userId', '==', userId)
          .get();
        
        const categoryBatch = db.batch();
        let categoryCount = 0;
        
        for (const categoryDoc of categoriesSnapshot.docs) {
          const categoryData = categoryDoc.data();
          const newCategoryRef = db.collection(`users/${userId}/categories`).doc(categoryDoc.id);
          
          const enhancedCategory = {
            ...categoryData,
            transactionCount: 0, // Will be calculated
            totalAmount: 0, // Will be calculated
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          categoryBatch.set(newCategoryRef, enhancedCategory);
          categoryCount++;
        }
        
        if (categoryCount > 0) {
          await categoryBatch.commit();
        }
        
        // Generate monthly analytics
        await generateMonthlyAnalytics(userId);
        
        migrationResults.push({
          userId,
          transactionCount,
          categoryCount,
          status: 'success'
        });
        
        console.log(`✅ Successfully migrated user ${userId}: ${transactionCount} transactions, ${categoryCount} categories`);
        
      } catch (userError) {
        console.error(`❌ Error migrating user ${userId}:`, userError);
        migrationResults.push({
          userId,
          status: 'error',
          error: userError.message
        });
      }
    }
    
    console.log('🎉 Migration completed!');
    res.json({
      success: true,
      message: 'Migration completed successfully',
      results: migrationResults
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to generate monthly analytics
async function generateMonthlyAnalytics(userId) {
  const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get();
  const monthlyData = {};
  
  transactionsSnapshot.docs.forEach(doc => {
    const transaction = doc.data();
    const date = transaction.date.toDate();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[month]) {
      monthlyData[month] = {
        userId,
        month,
        totalExpenses: 0,
        totalIncome: 0,
        netAmount: 0,
        categoryBreakdown: {},
        transactionCount: 0,
        avgTransactionAmount: 0,
        topCategories: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };
    }
    
    const monthData = monthlyData[month];
    
    if (transaction.type === 'expense') {
      monthData.totalExpenses += transaction.amount;
    } else {
      monthData.totalIncome += transaction.amount;
    }
    
    monthData.transactionCount += 1;
    
    // Category breakdown
    const categoryId = transaction.categoryId;
    if (!monthData.categoryBreakdown[categoryId]) {
      monthData.categoryBreakdown[categoryId] = {
        amount: 0,
        count: 0,
        percentage: 0
      };
    }
    
    monthData.categoryBreakdown[categoryId].amount += transaction.amount;
    monthData.categoryBreakdown[categoryId].count += 1;
  });
  
  // Save monthly analytics
  const batch = db.batch();
  Object.entries(monthlyData).forEach(([month, data]) => {
    data.netAmount = data.totalIncome - data.totalExpenses;
    data.avgTransactionAmount = data.transactionCount > 0 ? 
      (data.totalExpenses + data.totalIncome) / data.transactionCount : 0;
    
    // Calculate percentages
    const total = data.totalExpenses + data.totalIncome;
    Object.keys(data.categoryBreakdown).forEach(categoryId => {
      data.categoryBreakdown[categoryId].percentage = total > 0 ? 
        (data.categoryBreakdown[categoryId].amount / total) * 100 : 0;
    });
    
    const analyticsRef = db.collection(`users/${userId}/analytics`).doc(month);
    batch.set(analyticsRef, data);
  });
  
  await batch.commit();
  console.log(`📊 Generated analytics for ${Object.keys(monthlyData).length} months for user ${userId}`);
}

// Test function to verify migration
exports.verifyMigration = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }
    
    // Check old structure
    const oldTransactions = await db.collection('transactions').where('userId', '==', userId).get();
    const oldCategories = await db.collection('categories').where('userId', '==', userId).get();
    
    // Check new structure
    const newTransactions = await db.collection(`users/${userId}/transactions`).get();
    const newCategories = await db.collection(`users/${userId}/categories`).get();
    const analytics = await db.collection(`users/${userId}/analytics`).get();
    
    res.json({
      userId,
      oldStructure: {
        transactions: oldTransactions.size,
        categories: oldCategories.size
      },
      newStructure: {
        transactions: newTransactions.size,
        categories: newCategories.size,
        analyticsMonths: analytics.size
      },
      migrationComplete: newTransactions.size === oldTransactions.size && 
                         newCategories.size === oldCategories.size
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
EOF

# Deploy the migration function
echo -e "${BLUE}🚀 Deploying migration Cloud Function...${NC}"
firebase deploy --only functions --project "$PROJECT_ID"

cd ..

echo -e "${GREEN}✅ Migration setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Run the migration function: https://your-project.cloudfunctions.net/migrateToOptimizedStructure"
echo "2. Verify migration: https://your-project.cloudfunctions.net/verifyMigration?userId=USER_ID"
echo "3. Update your app to use the new optimized services in lib/firebaseOptimized.ts"
echo "4. Test the app thoroughly with the new structure"
echo "5. Remove old flat collections after verification"
echo ""
echo -e "${YELLOW}⚠️  Important: Test thoroughly before removing old data!${NC}"
echo -e "${GREEN}🎉 Database optimization deployment completed!${NC}"
