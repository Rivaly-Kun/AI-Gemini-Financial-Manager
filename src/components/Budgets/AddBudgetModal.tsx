import { useState, type ChangeEvent } from "react";
import { Button } from "../ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Plus } from "lucide-react";

type AddBudgetModalProps = {
  onAdd: (budget: {
    category: string;
    budget: number;
    period: "daily" | "weekly" | "monthly";
  }) => Promise<void>;
  existsCheck: (category: string, period: string) => boolean;
};

export function AddBudgetModal({ onAdd, existsCheck }: AddBudgetModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    category: "",
    budget: "",
    period: "monthly" as "daily" | "weekly" | "monthly",
  });

  const handleAdd = async () => {
    if (!form.category || !form.budget) {
      setFormError("Please select a category and enter a budget amount.");
      return;
    }
    const parsedBudget = Number.parseFloat(form.budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setFormError("Budget amount must be greater than 0.");
      return;
    }
    if (existsCheck(form.category, form.period)) {
      setFormError(`A ${form.period} budget for ${form.category} already exists.`);
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    try {
      await onAdd({ category: form.category, budget: parsedBudget, period: form.period });
    } finally {
      setIsSubmitting(false);
    }
    setIsOpen(false);
    setForm({ category: "", budget: "", period: "monthly" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={20} className="mr-2" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Budget</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={form.category} onValueChange={(v: string) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget">Budget Amount (₱)</Label>
            <Input id="budget" type="number" placeholder="0.00" value={form.budget}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="period">Period</Label>
            <Select value={form.period} onValueChange={(v: string) => setForm({ ...form, period: v as "daily" | "weekly" | "monthly" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Budget"}
          </Button>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
