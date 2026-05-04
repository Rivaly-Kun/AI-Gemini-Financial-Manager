import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref } from "firebase/database";
import { database } from "../../utils/firebase";

type Budget = {
  id?: number;
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period: "daily" | "weekly" | "monthly";
  color: string;
};

type Transaction = {
  name?: string;
  date?: string;
  paymentMethod?: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

const mapTransaction = (value: unknown): Transaction => {
  const tx = value as Partial<Transaction>;
  const amount = Number(tx.amount ?? 0);
  const type: "income" | "expense" = tx.type ? tx.type : amount >= 0 ? "income" : "expense";
  return {
    name: tx.name, date: tx.date, paymentMethod: tx.paymentMethod,
    category: tx.category ?? "Uncategorized", amount, type,
  };
};

const normalizeCategory = (category: string) => category.trim().toLowerCase();
const BUDGET_EPSILON = 0.0001;

export function useBudgetData(uid: string) {
  const userPath = `users/${uid}`;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const budgetsRef = ref(database, `${userPath}/budgets`);
    const unsub = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Budget> | null;
      if (!data) { setBudgets([]); return; }
      setBudgets(Object.entries(data).map(([key, value]) => ({
        ...value, key, id: value.id ?? Date.now(), color: value.color || "blue",
      })));
    });
    return () => unsub();
  }, [userPath]);

  useEffect(() => {
    const txRef = ref(database, `${userPath}/transactions`);
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const unsub1 = onValue(txRef, (s) => {
      const d = s.val() as Record<string, Transaction> | null;
      setTransactions(d ? Object.values(d).map(mapTransaction) : []);
    });
    const unsub2 = onValue(dashRef, (s) => {
      const d = s.val() as Record<string, Transaction> | null;
      setDashboardTransactions(d ? Object.values(d).map(mapTransaction) : []);
    });
    return () => { unsub1(); unsub2(); };
  }, [userPath]);

  const mergedTransactions = useMemo(() => {
    const combined = [...transactions, ...dashboardTransactions];
    const uniqueBySignature = new Map<string, Transaction>();
    combined.forEach((t) => {
      const sig = [t.type, normalizeCategory(t.category), Number(t.amount).toFixed(2),
        (t.date ?? "").trim(), (t.name ?? "").trim().toLowerCase(), (t.paymentMethod ?? "").trim().toLowerCase()].join("|");
      if (!uniqueBySignature.has(sig)) uniqueBySignature.set(sig, t);
    });
    return Array.from(uniqueBySignature.values());
  }, [transactions, dashboardTransactions]);

  const groupedBudgets = useMemo(() => {
    const grouped = new Map<string, Budget>();
    budgets.forEach((b) => {
      const gk = `${normalizeCategory(b.category)}|${b.period}`;
      const existing = grouped.get(gk);
      if (!existing) { grouped.set(gk, { ...b, key: gk, spent: 0 }); return; }
      existing.budget += b.budget;
      if (!existing.id && b.id) existing.id = b.id;
    });
    return Array.from(grouped.values());
  }, [budgets]);

  const budgetsWithSpend = useMemo(() => {
    return groupedBudgets.map((b) => {
      const spentFromTx = mergedTransactions
        .filter((t) => t.type === "expense")
        .filter((t) => normalizeCategory(t.category) === normalizeCategory(b.category))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { ...b, spent: spentFromTx };
    });
  }, [groupedBudgets, mergedTransactions]);

  const totalBudget = budgetsWithSpend.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgetsWithSpend.reduce((s, b) => s + b.spent, 0);
  const overBudgetCategories = budgetsWithSpend.filter((b) => (b.spent / b.budget) * 100 > 90);

  const getBudgetStatus = (spent: number, budget: number) => {
    const pct = (spent / budget) * 100;
    if (pct > 100 + BUDGET_EPSILON) return { color: "red", label: "Over Budget" };
    if (Math.abs(pct - 100) <= BUDGET_EPSILON) return { color: "yellow", label: "At Limit" };
    if (pct >= 90) return { color: "orange", label: "Nearly Over" };
    if (pct >= 70) return { color: "yellow", label: "On Track" };
    return { color: "green", label: "Good" };
  };

  const getRecommendation = (b: Budget) => {
    const pct = (b.spent / b.budget) * 100;
    if (pct > 100 + BUDGET_EPSILON) return `You've exceeded your ${b.category} budget. Consider reducing spending or adjusting your budget.`;
    if (Math.abs(pct - 100) <= BUDGET_EPSILON) return `You've fully used your ${b.category} budget. Any additional spending will put you over budget.`;
    if (pct >= 90) return `You're close to your ${b.category} budget limit. Try to limit spending for the rest of the period.`;
    if (pct >= 70) return `You're on track with your ${b.category} budget. Keep monitoring your spending.`;
    return `Great job! You have ₱${(b.budget - b.spent).toLocaleString()} remaining in your ${b.category} budget.`;
  };

  const addBudget = async (data: { category: string; budget: number; period: "daily" | "weekly" | "monthly" }) => {
    const budget: Budget = { id: Date.now(), category: data.category, budget: data.budget, spent: 0, period: data.period, color: "blue" };
    await push(ref(database, `${userPath}/budgets`), budget);
  };

  const budgetExists = (category: string, period: string) =>
    budgets.some((b) => normalizeCategory(b.category) === normalizeCategory(category) && b.period === period);

  return {
    budgetsWithSpend, totalBudget, totalSpent, overBudgetCategories,
    getBudgetStatus, getRecommendation, addBudget, budgetExists,
  };
}
