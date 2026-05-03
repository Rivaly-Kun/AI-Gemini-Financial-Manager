import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { onValue, push, ref } from "firebase/database";
import { Plus, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { database } from "../utils/firebase";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";

type Budget = {
  id?: number;
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period: "daily" | "weekly" | "monthly";
  color: string;
};

type Transaction = {
  name?: string;
  date?: string;
  paymentMethod?: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

const mapTransaction = (value: unknown): Transaction => {
  const tx = value as Partial<Transaction>;
  const amount = Number(tx.amount ?? 0);
  const type: "income" | "expense" = tx.type
    ? tx.type
    : amount >= 0
      ? "income"
      : "expense";

  return {
    name: tx.name,
    date: tx.date,
    paymentMethod: tx.paymentMethod,
    category: tx.category ?? "Uncategorized",
    amount,
    type,
  };
};

const normalizeCategory = (category: string) => category.trim().toLowerCase();
const BUDGET_EPSILON = 0.0001;

type BudgetsProps = {
  uid: string;
};

export function Budgets({ uid }: BudgetsProps) {
  const userPath = `users/${uid}`;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<
    Transaction[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const [newBudget, setNewBudget] = useState({
    category: "",
    budget: "",
    period: "monthly" as "daily" | "weekly" | "monthly",
  });

  useEffect(() => {
    const budgetsRef = ref(database, `${userPath}/budgets`);
    const unsubscribe = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Budget> | null;
      if (!data) {
        setBudgets([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
        color: value.color || "blue",
      }));
      setBudgets(items);
    });

    return () => unsubscribe();
  }, [userPath]);

  useEffect(() => {
    const txRef = ref(database, `${userPath}/transactions`);
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const unsubscribe = onValue(txRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setTransactions([]);
        return;
      }
      const items = Object.values(data).map((value) => mapTransaction(value));
      setTransactions(items);
    });

    const unsubscribeDash = onValue(dashRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setDashboardTransactions([]);
        return;
      }
      const items = Object.values(data).map((value) => mapTransaction(value));
      setDashboardTransactions(items);
    });

    return () => {
      unsubscribe();
      unsubscribeDash();
    };
  }, [userPath]);

  const mergedTransactions = useMemo(() => {
    const combined = [...transactions, ...dashboardTransactions];
    const uniqueBySignature = new Map<string, Transaction>();

    combined.forEach((transaction) => {
      const signature = [
        transaction.type,
        normalizeCategory(transaction.category),
        Number(transaction.amount).toFixed(2),
        (transaction.date ?? "").trim(),
        (transaction.name ?? "").trim().toLowerCase(),
        (transaction.paymentMethod ?? "").trim().toLowerCase(),
      ].join("|");

      if (!uniqueBySignature.has(signature)) {
        uniqueBySignature.set(signature, transaction);
      }
    });

    return Array.from(uniqueBySignature.values());
  }, [transactions, dashboardTransactions]);

  const groupedBudgets = useMemo(() => {
    const grouped = new Map<string, Budget>();

    budgets.forEach((budget) => {
      const groupKey = `${normalizeCategory(budget.category)}|${budget.period}`;
      const existing = grouped.get(groupKey);

      if (!existing) {
        grouped.set(groupKey, {
          ...budget,
          key: groupKey,
          id: budget.id,
          spent: 0,
        });
        return;
      }

      existing.budget += budget.budget;
      if (!existing.id && budget.id) {
        existing.id = budget.id;
      }
    });

    return Array.from(grouped.values());
  }, [budgets]);

  const budgetsWithSpend = useMemo(() => {
    return groupedBudgets.map((budget) => {
      const spentFromTx = mergedTransactions
        .filter((t) => t.type === "expense")
        .filter(
          (t) =>
            normalizeCategory(t.category) ===
            normalizeCategory(budget.category),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { ...budget, spent: spentFromTx };
    });
  }, [groupedBudgets, mergedTransactions]);

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.budget) {
      setFormError("Please select a category and enter a budget amount.");
      return;
    }

    const parsedBudget = Number.parseFloat(newBudget.budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setFormError("Budget amount must be greater than 0.");
      return;
    }

    const alreadyExists = budgets.some(
      (budget) =>
        normalizeCategory(budget.category) ===
          normalizeCategory(newBudget.category) &&
        budget.period === newBudget.period,
    );

    if (alreadyExists) {
      setFormError(
        `A ${newBudget.period} budget for ${newBudget.category} already exists.`,
      );
      return;
    }

    const budget: Budget = {
      id: Date.now(),
      category: newBudget.category,
      budget: parsedBudget,
      spent: 0,
      period: newBudget.period,
      color: "blue",
    };

    setFormError("");
    setIsSubmitting(true);
    try {
      await push(ref(database, `${userPath}/budgets`), budget);
    } finally {
      setIsSubmitting(false);
    }
    setIsAddDialogOpen(false);
    setNewBudget({
      category: "",
      budget: "",
      period: "monthly",
    });
  };

  const totalBudget = budgetsWithSpend.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgetsWithSpend.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCategories = budgetsWithSpend.filter(
    (b) => (b.spent / b.budget) * 100 > 90,
  );

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100 + BUDGET_EPSILON) {
      return { color: "red", label: "Over Budget" };
    }
    if (Math.abs(percentage - 100) <= BUDGET_EPSILON) {
      return { color: "yellow", label: "At Limit" };
    }
    if (percentage >= 90) return { color: "orange", label: "Nearly Over" };
    if (percentage >= 70) return { color: "yellow", label: "On Track" };
    return { color: "green", label: "Good" };
  };

  const getRecommendation = (budget: Budget) => {
    const percentage = (budget.spent / budget.budget) * 100;
    if (percentage > 100 + BUDGET_EPSILON) {
      return `You've exceeded your ${budget.category} budget. Consider reducing spending or adjusting your budget.`;
    }
    if (Math.abs(percentage - 100) <= BUDGET_EPSILON) {
      return `You've fully used your ${budget.category} budget. Any additional spending will put you over budget.`;
    }
    if (percentage >= 90) {
      return `You're close to your ${budget.category} budget limit. Try to limit spending for the rest of the period.`;
    }
    if (percentage >= 70) {
      return `You're on track with your ${budget.category} budget. Keep monitoring your spending.`;
    }
    return `Great job! You have ₱${(budget.budget - budget.spent).toLocaleString()} remaining in your ${budget.category} budget.`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your spending budgets
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value: string) =>
                    setNewBudget({ ...newBudget, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Transportation">
                      Transportation
                    </SelectItem>
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
                <Input
                  id="budget"
                  type="number"
                  placeholder="0.00"
                  value={newBudget.budget}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBudget({ ...newBudget, budget: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: string) =>
                    setNewBudget({
                      ...newBudget,
                      period: value as "daily" | "weekly" | "monthly",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddBudget}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create Budget"}
              </Button>
              {formError ? (
                <p className="text-sm text-red-600">{formError}</p>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total Budget</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            ₱{totalBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total Spent</p>
          <h3 className="text-2xl font-bold text-orange-600 mt-2">
            ₱{totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Remaining</p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              totalBudget - totalSpent > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₱
            {(totalBudget - totalSpent).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Budget Alert:</strong> You're close to or over budget in{" "}
            {overBudgetCategories.length} category
            {overBudgetCategories.length > 1 ? "ies" : ""}:{" "}
            {overBudgetCategories.map((b) => b.category).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
        {budgetsWithSpend.map((budget) => {
          const percentage = (budget.spent / budget.budget) * 100;
          const status = getBudgetStatus(budget.spent, budget.budget);
          const remaining = budget.budget - budget.spent;

          return (
            <Card key={budget.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {budget.category}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {budget.period}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    status.color === "red"
                      ? "bg-red-100 text-red-700"
                      : status.color === "orange"
                        ? "bg-orange-100 text-orange-700"
                        : status.color === "yellow"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                  }`}
                >
                  {status.label}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    ₱{budget.spent.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    of ₱{budget.budget.toLocaleString()}
                  </span>
                </div>

                <Progress value={Math.min(percentage, 100)} className="h-3" />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {percentage.toFixed(1)}% used
                  </span>
                  <span
                    className={`font-medium ${
                      remaining >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {remaining >= 0 ? (
                      <span className="flex items-center gap-1">
                        <TrendingDown size={14} />₱{remaining.toLocaleString()}{" "}
                        left
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <TrendingUp size={14} />₱
                        {Math.abs(remaining).toLocaleString()} over
                      </span>
                    )}
                  </span>
                </div>

                {/* AI Recommendation */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-900 mb-1">
                    💡 AI Recommendation
                  </p>
                  <p className="text-sm text-blue-800">
                    {getRecommendation(budget)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Budget Insights */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Budget Insights
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingDown className="text-green-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-green-900">Great Progress!</p>
              <p className="text-sm text-green-700 mt-1">
                You're spending 15% less on transportation this month compared
                to last month.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-blue-900">Budget Suggestion</p>
              <p className="text-sm text-blue-700 mt-1">
                Based on your spending patterns, consider increasing your food
                budget to ₱18,000 for better flexibility.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
