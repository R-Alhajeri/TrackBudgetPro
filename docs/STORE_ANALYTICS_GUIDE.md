# Store Analytics Guide - No Backend Required

## Quick Access to Your Subscription Data

Since you're deploying only to the App Store and Google Play Store, you can use their built-in analytics without needing a separate backend server.

## Apple App Store Analytics

### Step 1: Access App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Sign in with your developer account
3. Select **My Apps** → **TrackBudgetPro**

### Step 2: View Subscription Analytics

**📊 App Analytics (Overview)**

- Click **App Analytics** in the left sidebar
- View active subscribers, new subscribers, revenue
- Filter by date range (last 7 days, 30 days, etc.)

**💰 Sales and Trends (Detailed Revenue)**

- Go to **Sales and Trends** from the main menu
- Filter by **Subscriptions** in the product type
- Export data as CSV for detailed analysis
- View revenue by country, subscription tier, time period

**🔄 Subscriptions Dashboard (Management)**

- Click **Subscriptions** in the left sidebar
- See all your subscription products
- View subscriber lifecycle metrics
- Monitor retention and churn rates

### Step 3: Key Metrics to Monitor

- **Active Subscribers**: Current paying users
- **New Subscribers**: Growth rate
- **Cancelled Subscribers**: Churn analysis
- **Revenue**: Monthly/yearly earnings
- **Conversion Rate**: Trial to paid conversion

## Google Play Console Analytics

### Step 1: Access Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Sign in with your developer account
3. Select **TrackBudgetPro** from your app list

### Step 2: View Subscription Analytics

**📊 Subscriptions Dashboard**

- Go to **Monetization** → **Subscriptions**
- View active subscriber count
- Monitor subscription events timeline
- Analyze revenue trends

**💰 Financial Reports**

- Click **Financial reports** in the left menu
- View detailed revenue breakdowns
- Export data for accounting/analysis
- See tax and fee calculations

**📈 User Acquisition**

- Go to **User acquisition** → **Subscription acquisition**
- View conversion funnels
- Analyze user retention cohorts
- Calculate lifetime value metrics

### Step 3: Key Metrics to Monitor

- **Active Subscriptions**: Current subscriber count
- **Monthly Recurring Revenue (MRR)**: Predictable revenue
- **Churn Rate**: Percentage of users cancelling
- **Average Revenue Per User (ARPU)**: Revenue efficiency

## Setting Up Alerts & Reports

### Apple App Store Connect

1. **Custom Reports**: Create scheduled reports in Sales and Trends
2. **Email Notifications**: Set up alerts for significant changes
3. **Export Automation**: Schedule CSV exports for regular analysis

### Google Play Console

1. **Performance Alerts**: Set up notifications for metric changes
2. **Scheduled Reports**: Create recurring financial reports
3. **Dashboard Widgets**: Customize your console homepage

## What You Get Without a Backend

✅ **Real-time data** from payment processing  
✅ **Official metrics** used for payouts  
✅ **No server costs** or maintenance  
✅ **Built-in export tools** for analysis  
✅ **Historical data** retention  
✅ **Multi-currency support** automatically  
✅ **Tax and fee calculations** included  
✅ **Fraud detection** by the stores

## When You Might Need a Custom Backend

Consider implementing webhooks (Option 2) only if you need:

- **Real-time notifications** in your own app
- **Custom analytics** not provided by stores
- **Integration** with other business tools
- **User-specific data** beyond subscriptions
- **Advanced automation** based on subscription events

## Recommendation

For most apps, **use the built-in store analytics**. They provide comprehensive subscription tracking without the complexity and cost of maintaining your own backend infrastructure.

The store analytics are the same data used for your payouts and tax reporting, so they're guaranteed to be accurate and up-to-date.
