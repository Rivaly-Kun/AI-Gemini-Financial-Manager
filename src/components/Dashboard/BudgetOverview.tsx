import type { DashBudget } from "./useDashboardData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

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

export function BudgetOverview({ items }: { items: DashBudget[] }) {
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
        <div className="space-y-4 text-sm max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
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
