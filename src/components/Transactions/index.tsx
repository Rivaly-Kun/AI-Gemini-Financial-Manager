import { useMemo, useState } from "react";
import { useTransactions } from "../../hooks/useTransactions";
import type { Transaction } from "../../types";
import { TransactionStats } from "./TransactionStats";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionList } from "./TransactionList";
import { AddTransactionModal } from "./AddTransactionModal";

type TransactionsProps = {
  uid: string;
};

export default function Transactions({ uid }: TransactionsProps) {
  const { transactions, totals, addTransaction } = useTransactions(uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showAdd, setShowAdd] = useState(false);

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

  const handleAdd = async (form: {
    name: string;
    category: string;
    date: string;
    amount: string;
    type: "income" | "expense";
    paymentMethod: string;
  }) => {
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
    await addTransaction(entry);
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

      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />

      <TransactionStats totals={totals} />

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        <TransactionList transactions={filtered} />
      </div>
    </div>
  );
}
