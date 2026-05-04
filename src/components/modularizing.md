# Comprehensive Modularization Plan

This document outlines the strategy for refactoring the `src/components` directory. Currently, components like `AIChat`, `Goals`, `Transactions`, `Bills`, and `Investments` are monolithic. They mix data fetching (Firebase), complex business logic, AI prompt generation, and UI rendering into massive single files (often 400-600 lines long).

The goal of this plan is to separate concerns, improve readability, encourage code reuse, and make future updates significantly easier.

---

## 🛑 The Current Problems
1. **No Separation of Concerns:** UI rendering, database reads/writes, and complex logic (like aggregating financial data for the AI) are all tangled together.
2. **Duplicated Types:** Types like `Transaction`, `Goal`, `Budget`, and `Bill` are repeatedly defined inline at the top of different files.
3. **Massive Files:** High cognitive load to read, navigate, and debug.
4. **Hardcoded Configurations:** Items like `categoryIcons` and form constants are hardcoded into specific files, reducing reusability.

---

## 🛠️ Phase 1: Shared Infrastructure (Types & Constants)

Before touching the React components, we need a solid foundation.

- **Create `src/types/index.ts`**
  Move all TypeScript interfaces and types here:
  - `User`, `Transaction`, `Budget`, `Bill`, `Goal`, `Investment`, `Message`, `ChatSession`
- **Create `src/constants/index.ts`**
  Move hardcoded data arrays and mappings here:
  - `CATEGORY_ICONS` (food, transportation, etc.)
  - `TRANSACTION_CATEGORIES`
  - Priority levels, Risk levels, etc.
- **Create `src/utils/formatters.ts`**
  Move currency, date, and percentage formatting utility functions here (e.g., `formatPeso()`, `getTimeRemaining()`).

---

## 🧠 Phase 2: Extract Data & Logic (Custom Hooks)

We need to extract Firebase logic and state management out of the UI components. The UI should only care about *displaying* data and *triggering* actions, not how the data is fetched.

- **Create `src/hooks/useTransactions.ts`**
  - Handles fetching transactions, adding new ones, and calculating `totals` (income, expenses, net).
- **Create `src/hooks/useGoals.ts`**
  - Handles fetching goals, adding goals, and adding contributions.
- **Create `src/hooks/useFirebaseData.ts`** (or specific hooks for Bills, Budgets, Investments)
  - Generic/specific hooks for CRUD operations on user paths.
- **Create `src/services/aiService.ts`**
  - Move the massive `loadFinanceContext()` and `requestAIResponse()` out of `AIChat.tsx` into a dedicated service that just takes the user's data and returns the AI string.

---

## 🧩 Phase 3: Feature-Based Directory Structure & Component Breakdown

To drastically increase human readability, **every major feature will be moved into its own dedicated folder**. Instead of having massive single files (e.g., `Transactions.tsx`), we will have a `Transactions/` directory containing smaller, focused sub-components.

We will convert large component files into component directories (folders) containing smaller, focused sub-components.

### 1. `AIChat/`
- **`index.tsx`**: The main wrapper.
- **`ChatSidebar.tsx`**: The left panel showing past session history.
- **`MessageList.tsx`**: The main scroll area mapping over `MessageBubble`.
- **`MessageBubble.tsx`**: The individual chat bubble (handles markdown rendering, user vs bot styling).
- **`ChatInput.tsx`**: The text input, send button, and typing indicator.
- **`QuickActions.tsx`**: The quick action buttons at the bottom.

### 2. `Transactions/`
- **`index.tsx`**: Main wrapper.
- **`TransactionStats.tsx`**: The top 3 boxes (Total Income, Expenses, Net Balance).
- **`TransactionFilters.tsx`**: The search bar and dropdown filters.
- **`TransactionList.tsx`**: Maps over transactions.
- **`TransactionItem.tsx`**: Single row UI.
- **`AddTransactionModal.tsx`**: The dialog/form for adding a new record.

### 3. `Goals/`
- **`index.tsx`**: Main wrapper.
- **`GoalsOverview.tsx`**: The top stats (Active Goals, Completed, Overall Progress).
- **`GoalCard.tsx`**: The individual card showing progress bars, remaining amounts, and "Add Contribution" buttons.
- **`AddGoalModal.tsx`**: The creation form.
- **`GoalAIInsights.tsx`**: The AI insights card at the bottom.

### 4. `Bills/` & `Budgets/`
Follow the exact same pattern:
- **`[Feature]Overview.tsx`** for summary stats.
- **`[Feature]Card.tsx`** or **`[Feature]List.tsx`** for rendering lists.
- **`Add[Feature]Modal.tsx`** for forms.

### 5. `Dashboard/` & `Investments/` & `SpendingCoach/`
- Break out massive dashboard sections into standalone widget components (e.g., `DashboardRecentTransactions.tsx`, `DashboardCharts.tsx`).

---

## 🎨 Phase 4: UI Refinement

- Ensure all buttons, inputs, and modals strictly use the shared `src/components/ui/` components (e.g., shadcn/ui components).
- Clean up any leftover inline Tailwind strings that are getting too long by using `cva` (Class Variance Authority) or standardizing them in the `ui/` components.

---

## 🚀 Recommended Execution Order

If you approve this plan, we should tackle it in this order to prevent breaking the app:
1. Implement Phase 1 (Types & Constants).
2. Create Custom Hooks (Phase 2) and swap them into the existing monolithic components to verify they still work.
3. Choose **one component** at a time (e.g., `Transactions` first) to execute Phase 3 (Component Breakdown).
4. Rinse and repeat for the other components.
