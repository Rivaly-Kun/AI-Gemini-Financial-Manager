import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "../ui/card";

export function BudgetInsights() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Insights</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="p-2 bg-green-100 rounded-full">
            <TrendingDown className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-green-900">Great Progress!</p>
            <p className="text-sm text-green-700 mt-1">
              You're spending 15% less on transportation this month compared to last month.
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
              Based on your spending patterns, consider increasing your food budget to ₱18,000 for better flexibility.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
