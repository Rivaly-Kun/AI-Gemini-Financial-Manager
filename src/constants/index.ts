import type { SlashCmd } from "../types";

// ── Category Icons ───────────────────────────
export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔",
  transportation: "🚗",
  entertainment: "🎬",
  utilities: "💡",
  shopping: "🛍️",
  income: "💰",
  default: "💳",
};

// ── Transaction Categories ───────────────────
export const TRANSACTION_CATEGORIES = [
  "all",
  "food",
  "transportation",
  "entertainment",
  "utilities",
  "shopping",
  "income",
] as const;

// ── Budget Colors (Dashboard) ────────────────
export const BUDGET_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
] as const;

// ── Market Symbols ───────────────────────────
export const MARKET_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
] as const;

// ── Fallback Market Trends ───────────────────
export const FALLBACK_MARKET_TRENDS = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 248.04,
    change: -0.3,
    changePercent: -0.12,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 465.95,
    change: 14.77,
    changePercent: 3.28,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 239.16,
    change: 4.83,
    changePercent: 2.06,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 327.93,
    change: -2.6,
    changePercent: -0.79,
  },
] as const;

// ── Budget Epsilon (floating-point threshold) ─
export const BUDGET_EPSILON = 0.0001;

// ── Spending Coach Slash Commands ────────────
export const SLASH_COMMANDS: SlashCmd[] = [
  {
    cmd: "/report",
    icon: "📊",
    label: "Report",
    desc: "Full transaction table with export",
  },
  {
    cmd: "/summary",
    icon: "📋",
    label: "Summary",
    desc: "Quick income/expense overview",
  },
  {
    cmd: "/top",
    icon: "🔥",
    label: "Top Expenses",
    desc: "Your 5 biggest expenses",
  },
  {
    cmd: "/trends",
    icon: "📈",
    label: "Trends",
    desc: "AI spending trend analysis",
  },
  {
    cmd: "/tips",
    icon: "💡",
    label: "Tips",
    desc: "AI personalized saving tips",
  },
  { cmd: "/clear", icon: "🗑️", label: "Clear", desc: "Reset chat history" },
];

// ── Sidebar Navigation Items ─────────────────
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "💠" },
  { key: "transactions", label: "Transactions", icon: "🔄" },
  { key: "budgets", label: "Budgets", icon: "🧭" },
  { key: "investments", label: "Investments", icon: "📈" },
  { key: "bills", label: "Bills", icon: "🧾" },
  { key: "goals", label: "Goals", icon: "🎯" },
  { key: "ai-chat", label: "AI Chat", icon: "💬" },
] as const;
