import { useState } from "react";

type AddTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (form: {
    name: string;
    category: string;
    date: string;
    amount: string;
    type: "income" | "expense";
    paymentMethod: string;
  }) => Promise<void>;
};

export function AddTransactionModal({
  open,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    date: "",
    amount: "",
    type: "expense" as "income" | "expense",
    paymentMethod: "",
  });

  if (!open) return null;

  const handleAdd = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.date ||
      !form.amount ||
      !form.paymentMethod
    )
      return;

    setIsSubmitting(true);
    try {
      await onAdd(form);
      setForm({
        name: "",
        category: "",
        date: "",
        amount: "",
        type: "expense",
        paymentMethod: "",
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Transaction
          </h2>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Transaction Name</span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Grocery Shopping"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Type</span>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "income" | "expense",
                })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Category</span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select category</option>
              <option value="Food">Food</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Shopping">Shopping</option>
              <option value="Income">Income</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Amount (₱)</span>
            <input
              className={inputClass}
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Date</span>
            <input
              className={inputClass}
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Payment Method</span>
            <select
              className={inputClass}
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option value="">Select payment</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="PayMaya">PayMaya</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {isSubmitting ? "Saving..." : "Add Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
