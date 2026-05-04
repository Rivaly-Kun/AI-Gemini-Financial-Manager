import { useDashboardData } from "./useDashboardData";
import { StatCard } from "./StatCard";
import { BudgetOverview } from "./BudgetOverview";
import { RecentTransactions } from "./RecentTransactions";
import { UpcomingBills } from "./UpcomingBills";
import { AddExpenseModal } from "./AddExpenseModal";

type DashboardProps = { uid: string };

export default function Dashboard({ uid }: DashboardProps) {
  const {
    loading,
    stats,
    mergedTransactions,
    budgetsWithSpend,
    bills,
    addTransaction,
    payBill,
  } = useDashboardData(uid);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
            Welcome back! Here's your financial overview.
          </h1>
        </div>
        <AddExpenseModal onAdd={addTransaction} />
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {loading && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow-sm">
            Loading dashboard data...
          </div>
        )}
        {!loading && stats.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500 shadow-sm">
            No stats yet. Add transactions, bills, budgets, goals, or
            investments to see your overview.
          </div>
        )}
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <BudgetOverview items={budgetsWithSpend} />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions items={mergedTransactions} />
        </div>
        <UpcomingBills items={bills} onPay={payBill} />
      </section>
    </div>
  );
}
