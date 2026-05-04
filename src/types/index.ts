// ──────────────────────────────────────────────
// Shared TypeScript types for the entire app
// ──────────────────────────────────────────────

// ── Transactions ─────────────────────────────
export type Transaction = {
  id?: number;
  key?: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  paymentMethod: string;
  createdAt?: string;
};

// ── Budgets ──────────────────────────────────
export type Budget = {
  id?: number;
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period: "daily" | "weekly" | "monthly";
  color: string;
};

// ── Bills ────────────────────────────────────
export type Bill = {
  id?: number;
  key?: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  category: string;
  recurring: boolean;
  paymentMethod?: string;
};

// ── Goals ────────────────────────────────────
export type Goal = {
  id?: number;
  key?: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  monthlyContribution: number;
};

// ── Investments ──────────────────────────────
export type Investment = {
  id?: number;
  key?: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  returns: number;
  risk: "low" | "medium" | "high";
};

export type MarketTrend = {
  key?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
};

export type Suggestion = {
  id?: number;
  key?: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  potentialReturn: string;
};

// ── AI Chat ──────────────────────────────────
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

// ── Spending Coach ───────────────────────────
export type CoachMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  html?: string;
};

export type SlashCmd = {
  cmd: string;
  icon: string;
  label: string;
  desc: string;
};

// ── Dashboard (stat cards) ───────────────────
export type Stat = {
  label: string;
  value: number;
  change: number;
  valueType: "currency" | "percent";
  iconBg: string;
  iconColor: string;
  icon: string;
};
