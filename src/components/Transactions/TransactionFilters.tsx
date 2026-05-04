import { TRANSACTION_CATEGORIES } from "../../constants";

type TransactionFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
};

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        <span className="text-slate-400" aria-hidden>
          🔍
        </span>
        <input
          className="w-full bg-transparent outline-none"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-48"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>
      </div>
    </div>
  );
}
