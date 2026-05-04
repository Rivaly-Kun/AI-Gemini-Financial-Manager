import type { Transaction } from "../../types";
import { formatPeso } from "../../utils/formatters";

type TransactionStatsProps = {
  totals: { income: number; expenses: number; net: number };
};

export function TransactionStats({ totals }: TransactionStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total Income</p>
        <p className="text-2xl font-semibold text-emerald-600">
          {formatPeso(totals.income)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total Expenses</p>
        <p className="text-2xl font-semibold text-rose-600">
          {formatPeso(totals.expenses)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Net Balance</p>
        <p
          className={`text-2xl font-semibold ${totals.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {formatPeso(totals.net)}
        </p>
      </div>
    </div>
  );
}
