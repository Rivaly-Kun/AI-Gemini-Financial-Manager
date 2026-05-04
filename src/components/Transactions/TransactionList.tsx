import type { Transaction } from "../../types";
import { TransactionItem } from "./TransactionItem";

type TransactionListProps = {
  transactions: Transaction[];
};

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="mt-5 space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
      {transactions.map((t) => (
        <TransactionItem
          key={t.key ?? t.id ?? t.name}
          transaction={t}
        />
      ))}
      {transactions.length === 0 && (
        <p className="py-6 text-center text-sm font-semibold text-slate-500">
          No transactions match your filters.
        </p>
      )}
    </div>
  );
}
