import { useState, type ChangeEvent, type FormEvent } from "react";
import type { DashTransaction } from "./useDashboardData";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type AddExpenseModalProps = {
  onAdd: (tx: DashTransaction) => Promise<void>;
};

export function AddExpenseModal({ onAdd }: AddExpenseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    date: "",
    amount: "",
    type: "expense" as "income" | "expense",
    paymentMethod: "",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.title ||
      !form.category ||
      !form.date ||
      !form.amount ||
      !form.paymentMethod
    )
      return;

    const amountValue = Math.abs(Number(form.amount));
    if (Number.isNaN(amountValue) || amountValue <= 0) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: form.title.trim(),
        category: form.category.trim(),
        date: form.date,
        amount: form.type === "expense" ? -amountValue : amountValue,
        type: form.type,
        paymentMethod: form.paymentMethod,
        createdAt: new Date().toISOString(),
      });
      setForm({
        title: "",
        category: "",
        date: "",
        amount: "",
        type: "expense",
        paymentMethod: "",
      });
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-blue-600 px-5 py-3 text-sm hover:bg-blue-700">
          <span className="text-lg" aria-hidden>+</span>
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="txTitle">Transaction Name</Label>
            <Input
              id="txTitle"
              placeholder="e.g., Grocery Shopping"
              value={form.title}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("title", event.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="txCategory">Category</Label>
            <Input
              id="txCategory"
              placeholder="Food, Bills, Salary"
              value={form.category}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("category", event.target.value)
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="txDate">Date</Label>
              <Input
                id="txDate"
                type="date"
                value={form.date}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleChange("date", event.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="txAmount">Amount</Label>
              <Input
                id="txAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleChange("amount", event.target.value)
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="txType">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: string) =>
                handleChange("type", value as "income" | "expense")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="txPayment">Payment Method</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value: string) =>
                handleChange("paymentMethod", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="GCash">GCash</SelectItem>
                <SelectItem value="PayMaya">PayMaya</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
