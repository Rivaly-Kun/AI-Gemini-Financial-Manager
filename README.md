# AI Gemini Assisted Financial Manager

A comprehensive AI-powered financial management system built with React, TypeScript, Tailwind CSS, Google Gemini AI, and Firebase. This application helps users manage their finances, track spending, set budgets, monitor investments, and receive AI-driven financial coaching.

---

## System Overview

The **AI Gemini Assisted Financial Manager** is a full-featured personal finance dashboard that integrates artificial intelligence to provide smart financial insights and recommendations. The system combines real-time financial data, user account management via Firebase authentication, and Google's Gemini AI for intelligent financial advice.

### Key Features:
- **Real-time financial tracking** with transaction monitoring
- **AI-powered financial coaching** and spending analysis
- **Budget management** with goal tracking
- **Investment portfolio tracking** with market data
- **Bill reminders** and expense categorization
- **Interactive AI chat** for financial questions
- **Secure authentication** with Firebase

---

## Tabs Overview

Each tab in the left sidebar provides a specific financial management function:

### 1. **Dashboard**
- **What it does:** Central hub displaying your financial health at a glance
- **How it works:**
  - Shows summary cards with account balance, total spending, and financial goals
  - Displays charts and graphs for spending trends and budget progress
  - Provides quick overview of upcoming bills and financial milestones
  - Links to other modules for detailed management
- **Use case:** Check your overall financial status when you log in

### 2. **Transactions**
- **What it does:** Complete transaction history and expense tracking
- **How it works:**
  - Lists all income and expense transactions with dates and amounts
  - Supports filtering by date range, category, or transaction type
  - Searchable for finding specific transactions
  - Shows transaction details including descriptions and payment methods
  - Allows manual transaction entry or importing from connected accounts
- **Use case:** Review past spending, categorize expenses, and analyze spending patterns

### 3. **Bills**
- **What it does:** Tracks recurring and one-time bills with payment reminders
- **How it works:**
  - Displays upcoming bills with due dates and amounts
  - Shows payment status (paid, pending, overdue)
  - Sends notifications for upcoming due dates
  - Allows scheduling bills and marking them as paid
  - Tracks bill payment history for budgeting reference
- **Use case:** Never miss a bill payment; stay on top of recurring expenses

### 4. **Budgets**
- **What it does:** Create and manage spending budgets by category
- **How it works:**
  - Set budget limits for categories (groceries, entertainment, utilities, etc.)
  - System tracks actual spending against budget
  - Visual progress bars show how much of each budget is used
  - Alerts when spending approaches or exceeds budget limits
  - Compare budgeted vs. actual spending for analysis
- **Use case:** Control spending and stick to financial goals

### 5. **Goals**
- **What it does:** Set and track long-term financial objectives
- **How it works:**
  - Create savings goals with target amounts and deadlines
  - Track progress toward each goal (savings accumulation)
  - System calculates required monthly contributions to meet goals
  - Shows multiple goal status simultaneously (emergency fund, vacation, down payment, etc.)
  - Provides milestones and achievement notifications
- **Use case:** Plan for major purchases, emergencies, and life events

### 6. **Investments**
- **What it does:** Monitor investment portfolio and market performance
- **How it works:**
  - Track stocks, bonds, and other investment holdings
  - Real-time market data via Stock Market API integration
  - Shows current value, gains/losses, and portfolio allocation
  - Displays price movements and historical performance
  - Supports portfolio rebalancing recommendations
- **Use case:** Monitor investment growth and make informed trading decisions

### 7. **Spending Coach**
- **What it does:** AI-powered analysis and spending recommendations
- **How it works:**
  - Analyzes your transaction history and spending patterns
  - Identifies unusual expenses and spending trends
  - Provides personalized recommendations for budget optimization
  - Suggests areas where you might reduce spending
  - Learns from your financial habits over time
- **Use case:** Get intelligent suggestions to improve budgeting and reduce unnecessary spending

### 8. **AI Chat**
- **What it does:** Interactive financial assistant powered by Google Gemini AI
- **How it works:**
  - Ask questions about personal finance, investing, budgeting, etc.
  - AI analyzes your account data to provide personalized advice
  - Supports natural language questions like "How much did I spend on groceries last month?"
  - Provides explanations for financial concepts and best practices
  - Maintains conversation history for context-aware responses
- **Use case:** Get instant answers to financial questions without navigating multiple screens

---

## How the System Functions

### Architecture Flow:

1. **Authentication (Login)**
   - Users authenticate via Firebase
   - Session persists across app navigation
   - Secure token-based access to user data

2. **Data Management**
   - Firebase Firestore stores user profile, transactions, budgets, goals
   - Real-time sync ensures data is current across devices
   - Stock market data fetched via API for investments

3. **AI Integration**
   - Google Gemini AI processes user queries and financial data
   - Models in `src/utils/ai.ts` handle prompt engineering
   - Responses are context-aware based on user's financial situation

4. **Sidebar Navigation**
   - Persistent left navigation provides access to all modules
   - Current tab is highlighted for user orientation
   - Quick access to all financial management features

### Data Flow:

```
User Action → Component → Firebase/AI Service → Data Update → UI Refresh
```

---

## Setup & Development

### Environment Configuration

1) Copy `.env.example` to `.env.local` and fill with your keys:
- `VITE_GOOGLE_AI_API_KEY` - Google Gemini API key for AI features
- `VITE_FIREBASE_API_KEY` - Firebase project API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

2) Do not commit `.env.local` or real keys; env files are gitignored.

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Runs the app in development mode with hot module reloading.

### Build for Production

```bash
npm run build
```

Creates optimized production build in the `dist/` folder.

### Linting

```bash
npm run lint
```

Checks code quality and formatting.

---

## Technology Stack

- **Frontend:** React 18 + TypeScript
- **UI Framework:** Tailwind CSS
- **Build Tool:** Vite
- **Backend Services:** Firebase (Auth, Firestore, Analytics)
- **AI:** Google Gemini API
- **Market Data:** Stock Market API (via `src/utils/stockmark.ts`)
- **Component Library:** Custom UI components in `src/components/ui/`

---

## Project Structure

```
src/
├── components/
│   ├── AIChat.tsx           # AI chat interface
│   ├── Dashboard.tsx        # Main financial dashboard
│   ├── Transactions.tsx     # Transaction tracking
│   ├── Bills.tsx            # Bill management
│   ├── Budgets.tsx          # Budget management
│   ├── Goals.tsx            # Financial goals
│   ├── Investments.tsx      # Investment portfolio
│   ├── SpendingCoach.tsx    # AI spending analysis
│   ├── Login.tsx            # Authentication
│   ├── Sidebar.tsx          # Navigation menu
│   └── ui/                  # Reusable UI components
├── utils/
│   ├── ai.ts                # Google Gemini AI utilities
│   ├── firebase.ts          # Firebase configuration
│   └── stockmark.ts         # Stock market API integration
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

---

## Firebase Utilities

Firebase is initialized in `src/utils/firebase.ts`. It exports the configured `app` and an `analyticsPromise`:

```ts
import { app, analyticsPromise } from './utils/firebase'

analyticsPromise.then((analytics) => {
  if (!analytics) return
  // use analytics instance for event tracking
})
```

---

## Support

For issues or questions, refer to Firebase and Google AI documentation.

# npm install -g wscat
# npm install --save '@massive.com/client-js'