import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, update } from "firebase/database";
import { database } from "../../utils/firebase";

// Dashboard uses lightweight local types — it only needs a subset of fields
// from each entity. The full centralized types in src/types require fields
// (e.g. Bill.category, Goal.priority) the Dashboard never displays.
// We export them so sub-components in this folder use the SAME types.

export type DashTransaction = {
  key?: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  paymentMethod?: string;
  createdAt?: string;
};

export type DashBill = {
  key?: string;
  name: string;
  dueDate: string;
  amount: number;
  status?: "paid" | "pending" | "overdue";
};

export type DashBudget = {
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period?: string;
  color: string;
};

type DashGoal = {
  key?: string;
  targetAmount: number;
  currentAmount: number;
};

type DashInvestment = {
  key?: string;
  amount: number;
  currentValue: number;
};

export type DashStat = {
  label: string;
  value: number;
  change: number;
  valueType: "currency" | "percent";
  iconBg: string;
  iconColor: string;
  icon: string;
};

const budgetColors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
];

const normalizeFromRecord = <T,>(
  value?: Record<string, T> | null,
  mapFn?: (item: T, key: string) => T,
) => {
  if (!value) return [] as T[];
  return Object.entries(value).map(([key, item]) =>
    mapFn ? mapFn(item, key) : ({ ...(item as object), key } as T),
  );
};

const toTransaction = (item: unknown, key?: string): DashTransaction => {
  const tx = item as Partial<DashTransaction> & { title?: string };
  const amount = Number(tx.amount ?? 0);
  const type: "income" | "expense" = tx.type
    ? tx.type
    : amount >= 0
      ? "income"
      : "expense";

  return {
    key,
    name: tx.name ?? tx.title ?? "Transaction",
    category: tx.category ?? "Uncategorized",
    date: tx.date ?? "",
    amount,
    type,
    paymentMethod: tx.paymentMethod ?? "",
  };
};

const toBill = (item: unknown, key?: string): DashBill => {
  const bill = item as Partial<DashBill> & { due?: string };
  return {
    key,
    name: bill.name ?? "Bill",
    dueDate: bill.dueDate ?? bill.due ?? "",
    amount: Number(bill.amount ?? 0),
    status: bill.status ?? "pending",
  };
};

const toBudget = (item: unknown, key?: string): DashBudget => {
  const budget = item as Partial<DashBudget> & { total?: number };
  return {
    key,
    category: budget.category ?? "Uncategorized",
    budget: Number(budget.budget ?? budget.total ?? 0),
    spent: Number(budget.spent ?? 0),
    period: budget.period,
    color: budget.color ?? "blue",
  };
};

const toGoal = (item: unknown, key?: string): DashGoal => {
  const goal = item as Partial<DashGoal>;
  return {
    key,
    targetAmount: Number(goal.targetAmount ?? 0),
    currentAmount: Number(goal.currentAmount ?? 0),
  };
};

const toInvestment = (item: unknown, key?: string): DashInvestment => {
  const inv = item as Partial<DashInvestment>;
  const amount = Number(inv.amount ?? 0);
  return {
    key,
    amount,
    currentValue: Number(inv.currentValue ?? amount),
  };
};

export function useDashboardData(uid: string) {
  const userPath = `users/${uid}`;
  const [rootTransactions, setRootTransactions] = useState<DashTransaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<DashTransaction[]>([]);
  const [bills, setBills] = useState<DashBill[]>([]);
  const [budgets, setBudgets] = useState<DashBudget[]>([]);
  const [goals, setGoals] = useState<DashGoal[]>([]);
  const [investments, setInvestments] = useState<DashInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const txRef = ref(database, `${userPath}/transactions`);
    const billsRef = ref(database, `${userPath}/bills`);
    const budgetsRef = ref(database, `${userPath}/budgets`);
    const goalsRef = ref(database, `${userPath}/goals`);
    const investmentsRef = ref(database, `${userPath}/investments/holdings`);

    const unsubDash = onValue(dashRef, (snapshot) => {
      const data = normalizeFromRecord<DashTransaction>(snapshot.val(), (item) =>
        toTransaction(item),
      );
      setDashboardTransactions(data);
    });

    const unsubTx = onValue(txRef, (snapshot) => {
      const data = normalizeFromRecord<DashTransaction>(
        snapshot.val(),
        (item, key) => toTransaction(item, key),
      );
      setRootTransactions(data);
    });

    const unsubBills = onValue(billsRef, (snapshot) => {
      const data = normalizeFromRecord<DashBill>(snapshot.val(), (item, key) =>
        toBill(item, key),
      );
      setBills(data);
    });

    const unsubBudgets = onValue(budgetsRef, (snapshot) => {
      const data = normalizeFromRecord<DashBudget>(snapshot.val(), (item, key) =>
        toBudget(item, key),
      );
      setBudgets(data);
    });

    const unsubGoals = onValue(goalsRef, (snapshot) => {
      const data = normalizeFromRecord<DashGoal>(snapshot.val(), (item, key) =>
        toGoal(item, key),
      );
      setGoals(data);
    });

    const unsubInvestments = onValue(investmentsRef, (snapshot) => {
      const data = normalizeFromRecord<DashInvestment>(
        snapshot.val(),
        (item, key) => toInvestment(item, key),
      );
      setInvestments(data);
      setLoading(false);
    });

    return () => {
      unsubDash();
      unsubTx();
      unsubBills();
      unsubBudgets();
      unsubGoals();
      unsubInvestments();
    };
  }, [userPath]);

  const mergedTransactions = useMemo(() => {
    const combined = [...dashboardTransactions, ...rootTransactions];
    const unique = new Map<string, DashTransaction>();
    combined.forEach((tx) => {
      const key =
        tx.key ??
        `${tx.name}|${tx.category}|${tx.amount}|${tx.date}|${tx.type}`;
      if (!unique.has(key)) {
        unique.set(key, tx);
      }
    });
    return Array.from(unique.values())
      .filter((t) => t.date)
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? b.date).getTime() -
          new Date(a.createdAt ?? a.date).getTime(),
      );
  }, [dashboardTransactions, rootTransactions]);

  const budgetsWithSpend = useMemo(() => {
    return budgets.map((budget, index) => {
      const spentFromTx = mergedTransactions
        .filter((t) => t.type === "expense")
        .filter(
          (t) => t.category.toLowerCase() === budget.category.toLowerCase(),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        ...budget,
        spent: spentFromTx,
        color: budgetColors[index % budgetColors.length],
      };
    });
  }, [budgets, mergedTransactions]);

  const stats = useMemo((): DashStat[] => {
    const income = rootTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = rootTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const net = income - expenses;

    const pendingBills = bills.filter((b) => b.status !== "paid");
    const pendingTotal = pendingBills.reduce((sum, b) => sum + b.amount, 0);

    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const currentValue = investments.reduce(
      (sum, i) => sum + i.currentValue,
      0,
    );
    const returnsPct =
      totalInvested > 0
        ? ((currentValue - totalInvested) / totalInvested) * 100
        : 0;

    const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalGoalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const goalProgress =
      totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

    return [
      {
        label: "Net Cash Flow",
        value: net,
        change: 0,
        valueType: "currency",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-700",
        icon: "₱",
      },
      {
        label: "Bills Due",
        value: pendingTotal,
        change: 0,
        valueType: "currency",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-700",
        icon: "🧾",
      },
      {
        label: "Portfolio Return %",
        value: returnsPct,
        change: 0,
        valueType: "percent",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-700",
        icon: "📈",
      },
      {
        label: "Goal Progress %",
        value: goalProgress,
        change: 0,
        valueType: "percent",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
        icon: "🎯",
      },
    ];
  }, [bills, goals, investments, rootTransactions]);

  const addTransaction = async (tx: DashTransaction) => {
    await push(ref(database, `${userPath}/transactions`), tx);
  };

  const payBill = async (bill: DashBill) => {
    if (!bill.key) return;
    await update(ref(database, `${userPath}/bills/${bill.key}`), {
      status: "paid",
      paymentMethod: "Paid via Dashboard",
    });
  };

  return {
    loading,
    stats,
    mergedTransactions,
    budgetsWithSpend,
    bills,
    addTransaction,
    payBill,
  };
}
