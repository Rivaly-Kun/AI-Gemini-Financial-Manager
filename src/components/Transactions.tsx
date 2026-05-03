import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref } from "firebase/database";
import { database } from "../utils/firebase";

const categoryIcons: Record<string, string> = {
  food: "🍔",
  transportation: "🚗",
  entertainment: "🎬",
  utilities: "💡",
  shopping: "🛍️",
  income: "💰",
  default: "💳",
};

type Transaction = {
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

const categories = [
  "all",
  "food",
  "transportation",
  "entertainment",
  "utilities",
  "shopping",
  "income",
];

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

type TransactionsProps = {
  uid: string;
};

export default function Transactions({ uid }: TransactionsProps) {
  const userPath = `users/${uid}`;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    date: "",
    amount: "",
    type: "expense" as "income" | "expense",
    paymentMethod: "",
  });

  useEffect(() => {
    const transactionsRef = ref(database, `${userPath}/transactions`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setTransactions([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setTransactions(items);
    });

    return () => unsubscribe();
  }, [userPath]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((t) =>
        categoryFilter === "all"
          ? true
          : t.category.toLowerCase() === categoryFilter,
      )
      .sort((a, b) => {
        if (sortBy === "date") {
          const aTime = new Date(a.createdAt ?? a.date).getTime();
          const bTime = new Date(b.createdAt ?? b.date).getTime();
          return bTime - aTime;
        }
        return Math.abs(b.amount) - Math.abs(a.amount);
      });
  }, [transactions, searchTerm, categoryFilter, sortBy]);

  const handleAdd = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.date ||
      !form.amount ||
      !form.paymentMethod
    )
      return;
    const amt = Math.abs(parseFloat(form.amount || "0"));
    const entry: Transaction = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      date: form.date,
      amount: form.type === "expense" ? -amt : amt,
      type: form.type,
      paymentMethod: form.paymentMethod,
      createdAt: new Date().toISOString(),
    };
    setIsSubmitting(true);
    try {
      await push(ref(database, `${userPath}/transactions`), entry);
    } finally {
      setIsSubmitting(false);
    }
    setForm({
      name: "",
      category: "",
      date: "",
      amount: "",
      type: "expense",
      paymentMethod: "",
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-500">Transactions</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Track and manage your activity
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span aria-hidden>＋</span>
            Add Transaction
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Transaction
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Transaction Name</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Grocery Shopping"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Type</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as "income" | "expense",
                    })
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Category</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Income">Income</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Amount (₱)</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Date</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Payment Method</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                >
                  <option value="">Select payment</option>
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                  <option value="PayMaya">PayMaya</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                {isSubmitting ? "Saving..." : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Income</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {currency(totals.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Expenses</p>
          <p className="text-2xl font-semibold text-rose-600">
            {currency(totals.expenses)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Net Balance</p>
          <p
            className={`text-2xl font-semibold ${totals.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {currency(totals.net)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <span className="text-slate-400" aria-hidden>
              🔍
            </span>
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
          {filtered.map((t) => (
            <div
              key={t.key ?? t.id ?? t.name}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                  {categoryIcons[t.category.toLowerCase()] ||
                    categoryIcons.default}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {t.category} •{" "}
                    {new Date(t.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    • {t.paymentMethod}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {t.amount >= 0 ? "+" : "-"}
                  {currency(Math.abs(t.amount))}
                </p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm font-semibold text-slate-500">
              No transactions match your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
