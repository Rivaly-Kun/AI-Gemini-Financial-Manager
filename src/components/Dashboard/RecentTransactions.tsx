import type { DashTransaction } from "./useDashboardData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

export function RecentTransactions({ items }: { items: DashTransaction[] }) {
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
        <ul className="space-y-3 text-sm max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
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
