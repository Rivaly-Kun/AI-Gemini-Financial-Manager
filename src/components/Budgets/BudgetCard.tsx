import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";

type Budget = {
  id?: number;
  key?: string;
  category: string;
  budget: number;
  spent: number;
  period: string;
  color: string;
};

type BudgetCardProps = {
  budget: Budget;
  status: { color: string; label: string };
  recommendation: string;
};

export function BudgetCard({ budget, status, recommendation }: BudgetCardProps) {
  const percentage = (budget.spent / budget.budget) * 100;
  const remaining = budget.budget - budget.spent;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{budget.category}</h3>
          <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
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
          <span className="text-2xl font-bold text-gray-900">₱{budget.spent.toLocaleString()}</span>
          <span className="text-sm text-gray-500">of ₱{budget.budget.toLocaleString()}</span>
        </div>

        <Progress value={Math.min(percentage, 100)} className="h-3" />

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{percentage.toFixed(1)}% used</span>
          <span className={`font-medium ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
            {remaining >= 0 ? (
              <span className="flex items-center gap-1">
                <TrendingDown size={14} />₱{remaining.toLocaleString()} left
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />₱{Math.abs(remaining).toLocaleString()} over
              </span>
            )}
          </span>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-blue-900 mb-1">💡 AI Recommendation</p>
          <p className="text-sm text-blue-800">{recommendation}</p>
        </div>
      </div>
    </Card>
  );
}
