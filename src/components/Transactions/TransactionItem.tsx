import type { Transaction } from "../../types";
import { CATEGORY_ICONS } from "../../constants";
import { formatPeso } from "../../utils/formatters";

type TransactionItemProps = {
  transaction: Transaction;
};

export function TransactionItem({ transaction: t }: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
          {CATEGORY_ICONS[t.category.toLowerCase()] ?? CATEGORY_ICONS.default}
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
          {formatPeso(Math.abs(t.amount))}
        </p>
      </div>
    </div>
  );
}
