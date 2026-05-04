import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref } from "firebase/database";
import { database } from "../utils/firebase";
import { normalizeCategory } from "../utils/formatters";
import { BUDGET_EPSILON } from "../constants";
import type { Budget, Transaction } from "../types";

const mapTransaction = (value: unknown): Transaction => {
  const tx = value as Partial<Transaction>;
  const amount = Number(tx.amount ?? 0);
  const type: "income" | "expense" = tx.type
    ? tx.type
    : amount >= 0
      ? "income"
      : "expense";

  return {
    name: tx.name ?? "Transaction",
    date: tx.date ?? "",
    paymentMethod: tx.paymentMethod ?? "",
    category: tx.category ?? "Uncategorized",
    amount,
    type,
  };
};

export function useBudgets(uid: string) {
  const userPath = `users/${uid}`;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<
    Transaction[]
  >([]);

  useEffect(() => {
    const budgetsRef = ref(database, `${userPath}/budgets`);
    const unsubscribe = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Budget> | null;
      if (!data) {
        setBudgets([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
        color: value.color || "blue",
      }));
      setBudgets(items);
    });

    return () => unsubscribe();
  }, [userPath]);

  useEffect(() => {
    const txRef = ref(database, `${userPath}/transactions`);
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const unsubscribe = onValue(txRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setTransactions([]);
        return;
      }
      setTransactions(Object.values(data).map(mapTransaction));
    });

    const unsubscribeDash = onValue(dashRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setDashboardTransactions([]);
        return;
      }
      setDashboardTransactions(Object.values(data).map(mapTransaction));
    });

    return () => {
      unsubscribe();
      unsubscribeDash();
    };
  }, [userPath]);

  const mergedTransactions = useMemo(() => {
    const combined = [...transactions, ...dashboardTransactions];
    const uniqueBySignature = new Map<string, Transaction>();

    combined.forEach((transaction) => {
      const signature = [
        transaction.type,
        normalizeCategory(transaction.category),
        Number(transaction.amount).toFixed(2),
        (transaction.date ?? "").trim(),
        (transaction.name ?? "").trim().toLowerCase(),
        (transaction.paymentMethod ?? "").trim().toLowerCase(),
      ].join("|");

      if (!uniqueBySignature.has(signature)) {
        uniqueBySignature.set(signature, transaction);
      }
    });

    return Array.from(uniqueBySignature.values());
  }, [transactions, dashboardTransactions]);

  const groupedBudgets = useMemo(() => {
    const grouped = new Map<string, Budget>();

    budgets.forEach((budget) => {
      const groupKey = `${normalizeCategory(budget.category)}|${budget.period}`;
      const existing = grouped.get(groupKey);

      if (!existing) {
        grouped.set(groupKey, {
          ...budget,
          key: groupKey,
          id: budget.id,
          spent: 0,
        });
        return;
      }

      existing.budget += budget.budget;
      if (!existing.id && budget.id) {
        existing.id = budget.id;
      }
    });

    return Array.from(grouped.values());
  }, [budgets]);

  const budgetsWithSpend = useMemo(() => {
    return groupedBudgets.map((budget) => {
      const spentFromTx = mergedTransactions
        .filter((t) => t.type === "expense")
        .filter(
          (t) =>
            normalizeCategory(t.category) ===
            normalizeCategory(budget.category),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { ...budget, spent: spentFromTx };
    });
  }, [groupedBudgets, mergedTransactions]);

  const totalBudget = budgetsWithSpend.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgetsWithSpend.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCategories = budgetsWithSpend.filter(
    (b) => (b.spent / b.budget) * 100 > 90,
  );

  const addBudget = async (budget: Budget) => {
    await push(ref(database, `${userPath}/budgets`), budget);
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100 + BUDGET_EPSILON) {
      return { color: "red", label: "Over Budget" };
    }
    if (Math.abs(percentage - 100) <= BUDGET_EPSILON) {
      return { color: "yellow", label: "At Limit" };
    }
    if (percentage >= 90) return { color: "orange", label: "Nearly Over" };
    if (percentage >= 70) return { color: "yellow", label: "On Track" };
    return { color: "green", label: "Good" };
  };

  const getRecommendation = (budget: Budget) => {
    const percentage = (budget.spent / budget.budget) * 100;
    if (percentage > 100 + BUDGET_EPSILON) {
      return `You've exceeded your ${budget.category} budget. Consider reducing spending or adjusting your budget.`;
    }
    if (Math.abs(percentage - 100) <= BUDGET_EPSILON) {
      return `You've fully used your ${budget.category} budget. Any additional spending will put you over budget.`;
    }
    if (percentage >= 90) {
      return `You're close to your ${budget.category} budget limit. Try to limit spending for the rest of the period.`;
    }
    if (percentage >= 70) {
      return `You're on track with your ${budget.category} budget. Keep monitoring your spending.`;
    }
    return `Great job! You have ₱${(budget.budget - budget.spent).toLocaleString()} remaining in your ${budget.category} budget.`;
  };

  return {
    budgets,
    budgetsWithSpend,
    totalBudget,
    totalSpent,
    overBudgetCategories,
    addBudget,
    getBudgetStatus,
    getRecommendation,
  };
}
