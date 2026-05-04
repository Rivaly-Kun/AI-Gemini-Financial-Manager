import type { DashBill } from "./useDashboardData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value,
  );

export function UpcomingBills({
  items,
  onPay,
}: {
  items: DashBill[];
  onPay?: (bill: DashBill) => void;
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
        <ul className="space-y-3 text-sm max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
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
