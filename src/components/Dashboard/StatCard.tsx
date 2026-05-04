import type { DashStat } from "./useDashboardData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

const percentage = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export function StatCard({
  label,
  value,
  change,
  valueType,
  icon,
  iconBg,
  iconColor,
}: DashStat) {
  const isPositive = change >= 0;
  const hasMeaningfulChange = Math.abs(change) >= 0.05;
  const displayValue =
    valueType === "percent" ? `${value.toFixed(2)}%` : currency(value);

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
        <p className="text-3xl font-semibold text-slate-900">{displayValue}</p>
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
