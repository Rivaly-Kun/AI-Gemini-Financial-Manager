import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { onValue, push, ref, update } from "firebase/database";
import { database } from "../utils/firebase";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Stat = {
  label: string;
  value: number;
  change: number;
  valueType: "currency" | "percent";
  iconBg: string;
  iconColor: string;
  icon: string;
};

type Transaction = {
  key?: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  paymentMethod?: string;
  createdAt?: string;
};

type Bill = {
  key?: string;
  name: string;
  dueDate: string;
  amount: number;
  status?: "paid" | "pending" | "overdue";
};

type Budget = {
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period?: string;
  color: string;
};

type Goal = {
  key?: string;
  targetAmount: number;
  currentAmount: number;
};

type Investment = {
  key?: string;
  amount: number;
  currentValue: number;
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

const toTransaction = (item: unknown, key?: string): Transaction => {
  const tx = item as Partial<Transaction> & { title?: string };
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

const toBill = (item: unknown, key?: string): Bill => {
  const bill = item as Partial<Bill> & { due?: string };
  return {
    key,
    name: bill.name ?? "Bill",
    dueDate: bill.dueDate ?? bill.due ?? "",
    amount: Number(bill.amount ?? 0),
    status: bill.status ?? "pending",
  };
};

const toBudget = (item: unknown, key?: string): Budget => {
  const budget = item as Partial<Budget> & { total?: number };
  return {
    key,
    category: budget.category ?? "Uncategorized",
    budget: Number(budget.budget ?? budget.total ?? 0),
    spent: Number(budget.spent ?? 0),
    period: budget.period,
    color: budget.color ?? "blue",
  };
};

const toGoal = (item: unknown, key?: string): Goal => {
  const goal = item as Partial<Goal>;
  return {
    key,
    targetAmount: Number(goal.targetAmount ?? 0),
    currentAmount: Number(goal.currentAmount ?? 0),
  };
};

const toInvestment = (item: unknown, key?: string): Investment => {
  const inv = item as Partial<Investment>;
  const amount = Number(inv.amount ?? 0);
  return {
    key,
    amount,
    currentValue: Number(inv.currentValue ?? amount),
  };
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

const percentage = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const metricValue = (value: number, valueType: Stat["valueType"]) =>
  valueType === "percent" ? `${value.toFixed(2)}%` : currency(value);

function ProgressBar({
  spent,
  total,
  color,
}: {
  spent: number;
  total: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  valueType,
  icon,
  iconBg,
  iconColor,
}: Stat) {
  const isPositive = change >= 0;
  const hasMeaningfulChange = Math.abs(change) >= 0.05;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
          aria-hidden
        >
          {icon}
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-semibold text-slate-900">
          {metricValue(value, valueType)}
        </p>
        {hasMeaningfulChange ? (
          <p
            className={`text-sm font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
          >
            {percentage(change)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Transactions
        </h3>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No transactions yet.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {items.map((tx, index) => (
            <li
              key={`${tx.name}-${tx.date}-${index}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{tx.name}</p>
                <p className="text-xs text-slate-500">
                  {tx.category} · {tx.date}
                </p>
              </div>
              <p
                className={
                  tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                }
              >
                {currency(tx.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UpcomingBills({
  items,
  onPay,
}: {
  items: Bill[];
  onPay?: (bill: Bill) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Upcoming Bills</h3>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No bills due.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {items.map((bill, index) => (
            <li
              key={`${bill.name}-${bill.dueDate}-${index}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{bill.name}</p>
                <p className="text-xs text-slate-500">Due: {bill.dueDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-900">
                  {currency(bill.amount)}
                </p>
                <button
                  onClick={() => onPay?.(bill)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-50"
                >
                  Pay Now
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BudgetOverview({ items }: { items: Budget[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Budget Overview
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No budgets created.</p>
      ) : (
        <div className="space-y-4 text-sm">
          {items.map((budget, index) => (
            <div key={`${budget.category}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between text-slate-900">
                <p className="font-semibold">{budget.category}</p>
                <p className="text-xs text-slate-600">
                  {currency(budget.spent)} / {currency(budget.budget)}
                </p>
              </div>
              <ProgressBar
                spent={budget.spent}
                total={budget.budget}
                color={budget.color}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DashboardProps = {
  uid: string;
};

export default function Dashboard({ uid }: DashboardProps) {
  const userPath = `users/${uid}`;
  const [rootTransactions, setRootTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<
    Transaction[]
  >([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "",
    date: "",
    amount: "",
    type: "expense" as "income" | "expense",
    paymentMethod: "",
  });

  useEffect(() => {
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const txRef = ref(database, `${userPath}/transactions`);
    const billsRef = ref(database, `${userPath}/bills`);
    const budgetsRef = ref(database, `${userPath}/budgets`);
    const goalsRef = ref(database, `${userPath}/goals`);
    const investmentsRef = ref(database, `${userPath}/investments/holdings`);

    const unsubDash = onValue(dashRef, (snapshot) => {
      const data = normalizeFromRecord<Transaction>(snapshot.val(), (item) =>
        toTransaction(item),
      );
      setDashboardTransactions(data);
    });

    const unsubTx = onValue(txRef, (snapshot) => {
      const data = normalizeFromRecord<Transaction>(
        snapshot.val(),
        (item, key) => toTransaction(item, key),
      );
      setRootTransactions(data);
    });

    const unsubBills = onValue(billsRef, (snapshot) => {
      const data = normalizeFromRecord<Bill>(snapshot.val(), (item, key) =>
        toBill(item, key),
      );
      setBills(data);
    });

    const unsubBudgets = onValue(budgetsRef, (snapshot) => {
      const data = normalizeFromRecord<Budget>(snapshot.val(), (item, key) =>
        toBudget(item, key),
      );
      setBudgets(data);
    });

    const unsubGoals = onValue(goalsRef, (snapshot) => {
      const data = normalizeFromRecord<Goal>(snapshot.val(), (item, key) =>
        toGoal(item, key),
      );
      setGoals(data);
    });

    const unsubInvestments = onValue(investmentsRef, (snapshot) => {
      const data = normalizeFromRecord<Investment>(
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
    const unique = new Map<string, Transaction>();
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
        color: budget.color || budgetColors[index % budgetColors.length],
      };
    });
  }, [budgets, mergedTransactions]);

  const statsFromData = useMemo(() => {
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

    const derivedStats: Stat[] = [
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
    return derivedStats;
  }, [bills, goals, investments, rootTransactions]);

  const hasStats = useMemo(() => statsFromData.length > 0, [statsFromData]);

  const handleChange = (field: keyof typeof newExpense, value: string) => {
    setNewExpense((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !newExpense.title ||
      !newExpense.category ||
      !newExpense.date ||
      !newExpense.amount ||
      !newExpense.paymentMethod
    ) {
      return;
    }

    const amountValue = Math.abs(Number(newExpense.amount));
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const transaction: Transaction = {
        name: newExpense.title.trim(),
        category: newExpense.category.trim(),
        date: newExpense.date,
        amount: newExpense.type === "expense" ? -amountValue : amountValue,
        type: newExpense.type,
        paymentMethod: newExpense.paymentMethod,
        createdAt: new Date().toISOString(),
      };

      await push(ref(database, `${userPath}/transactions`), transaction);

      setNewExpense({
        title: "",
        category: "",
        date: "",
        amount: "",
        type: "expense",
        paymentMethod: "",
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayBill = async (bill: Bill) => {
    if (!bill.key) return;
    await update(ref(database, `${userPath}/bills/${bill.key}`), {
      status: "paid",
      paymentMethod: "Paid via Dashboard",
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
            Welcome back! Here’s your financial overview.
          </h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 px-5 py-3 text-sm hover:bg-blue-700">
              <span className="text-lg" aria-hidden>
                ＋
              </span>
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form className="mt-4 space-y-4" onSubmit={handleAddExpense}>
              <div>
                <Label htmlFor="txTitle">Transaction Name</Label>
                <Input
                  id="txTitle"
                  placeholder="e.g., Grocery Shopping"
                  value={newExpense.title}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleChange("title", event.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="txCategory">Category</Label>
                <Input
                  id="txCategory"
                  placeholder="Food, Bills, Salary"
                  value={newExpense.category}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleChange("category", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="txDate">Date</Label>
                  <Input
                    id="txDate"
                    type="date"
                    value={newExpense.date}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("date", event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="txAmount">Amount</Label>
                  <Input
                    id="txAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("amount", event.target.value)
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="txType">Type</Label>
                <Select
                  value={newExpense.type}
                  onValueChange={(value: string) =>
                    handleChange("type", value as "income" | "expense")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="txPayment">Payment Method</Label>
                <Select
                  value={newExpense.paymentMethod}
                  onValueChange={(value: string) =>
                    handleChange("paymentMethod", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="PayMaya">PayMaya</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {loading && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow-sm">
            Loading dashboard data...
          </div>
        )}
        {!loading && !hasStats && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500 shadow-sm">
            No stats yet. Add transactions, bills, budgets, goals, or
            investments to see your overview.
          </div>
        )}
        {statsFromData.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionList items={mergedTransactions} />
        </div>
        <UpcomingBills items={bills} onPay={handlePayBill} />
      </section>

      <BudgetOverview items={budgetsWithSpend} />
    </div>
  );
}
