const currency = (v: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);

type Transaction = {
  amount?: number;
  date?: string;
  category?: string;
  name?: string;
};

type ReportModalProps = {
  merged: Transaction[];
  income: number;
  expenses: number;
  net: number;
  getSortedReport: () => Transaction[];
  toggleSort: (col: string) => void;
  sortArrow: (col: string) => string;
  exportCSV: () => void;
  onClose: () => void;
};

export function ReportModal({
  merged,
  income,
  expenses,
  net,
  getSortedReport,
  toggleSort,
  sortArrow,
  exportCSV,
  onClose,
}: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-8">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">📊 Spending Report</h2>
            <p className="text-xs text-slate-500">
              {merged.length} transactions · Generated {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              ⬇️ Export CSV
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
              ✕ Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 py-3">
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Income</p>
            <p className="text-sm font-bold text-emerald-700">{currency(income)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Expenses</p>
            <p className="text-sm font-bold text-rose-700">{currency(expenses)}</p>
          </div>
          <div className={`rounded-xl px-3 py-2 text-center ${net >= 0 ? "bg-blue-50" : "bg-amber-50"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${net >= 0 ? "text-blue-600" : "text-amber-600"}`}>Net</p>
            <p className={`text-sm font-bold ${net >= 0 ? "text-blue-700" : "text-amber-700"}`}>{currency(net)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="cursor-pointer px-2 py-2 hover:text-slate-900" onClick={() => toggleSort("date")}>Date{sortArrow("date")}</th>
                <th className="cursor-pointer px-2 py-2 hover:text-slate-900" onClick={() => toggleSort("name")}>Name{sortArrow("name")}</th>
                <th className="cursor-pointer px-2 py-2 hover:text-slate-900" onClick={() => toggleSort("category")}>Category{sortArrow("category")}</th>
                <th className="px-2 py-2">Type</th>
                <th className="cursor-pointer px-2 py-2 text-right hover:text-slate-900" onClick={() => toggleSort("amount")}>Amount{sortArrow("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {getSortedReport().map((t, i) => (
                <tr key={i} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                  <td className="px-2 py-2 text-slate-600">
                    {t.date ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-2 py-2 font-medium text-slate-900">{t.name || t.category || "Transaction"}</td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.category || "N/A"}</span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(t.amount ?? 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {(t.amount ?? 0) > 0 ? "Income" : "Expense"}
                    </span>
                  </td>
                  <td className={`px-2 py-2 text-right font-semibold ${(t.amount ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {currency(Math.abs(t.amount ?? 0))}
                  </td>
                </tr>
              ))}
              {merged.length === 0 && (
                <tr><td colSpan={5} className="px-2 py-8 text-center text-slate-400">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
