import { AlertCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { useBudgetData } from "./useBudgetData";
import { BudgetCard } from "./BudgetCard";
import { BudgetInsights } from "./BudgetInsights";
import { AddBudgetModal } from "./AddBudgetModal";

type BudgetsProps = { uid: string };

export function Budgets({ uid }: BudgetsProps) {
  const {
    budgetsWithSpend, totalBudget, totalSpent, overBudgetCategories,
    getBudgetStatus, getRecommendation, addBudget, budgetExists,
  } = useBudgetData(uid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 mt-1">Create and manage your spending budgets</p>
        </div>
        <AddBudgetModal onAdd={addBudget} existsCheck={budgetExists} />
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
          <h3 className={`text-2xl font-bold mt-2 ${totalBudget - totalSpent > 0 ? "text-green-600" : "text-red-600"}`}>
            ₱{(totalBudget - totalSpent).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </h3>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Budget Alert:</strong> You're close to or over budget in{" "}
            {overBudgetCategories.length} category{overBudgetCategories.length > 1 ? "ies" : ""}:{" "}
            {overBudgetCategories.map((b) => b.category).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
        {budgetsWithSpend.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            status={getBudgetStatus(budget.spent, budget.budget)}
            recommendation={getRecommendation(budget)}
          />
        ))}
      </div>

      <BudgetInsights />
    </div>
  );
}
