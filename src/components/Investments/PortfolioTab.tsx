import { PieChart } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Investment } from "../../types";

type PortfolioTabProps = {
  investments: Investment[];
  portfolioAllocations: Array<{ label: string; amount: number; percentage: number }>;
  getMarketPrice: (inv: Investment) => number;
};

function getRiskBadge(risk: string) {
  switch (risk) {
    case "low": return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
    case "medium": return <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>;
    case "high": return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
    default: return <Badge>Unknown</Badge>;
  }
}

export function PortfolioTab({ investments, portfolioAllocations, getMarketPrice }: PortfolioTabProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* Allocation */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Portfolio Allocation</h2>
        </div>
        <div className="space-y-4">
          {portfolioAllocations.length === 0 ? (
            <p className="text-sm text-gray-500">Add an investment to see your portfolio allocation.</p>
          ) : (
            portfolioAllocations.map((a) => (
              <div key={a.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">{a.label}</p>
                  <span className="text-sm font-semibold text-gray-900">₱{a.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{a.percentage.toFixed(1)}%</span><span>of portfolio</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(a.percentage, 100)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
        {investments.map((inv) => {
          const returnAmount = inv.currentValue - inv.amount;
          return (
            <Card key={inv.key ?? inv.id ?? inv.name} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{inv.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{inv.type}</p>
                </div>
                {getRiskBadge(inv.risk)}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invested</span>
                  <span className="font-medium text-gray-900">₱{inv.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Value</span>
                  <span className="font-semibold text-blue-600">₱{getMarketPrice(inv).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm font-medium text-gray-700">Returns</span>
                  <div className="text-right">
                    <div className={`font-bold ${inv.returns >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {inv.returns >= 0 ? "+" : ""}{inv.returns.toFixed(2)}%
                    </div>
                    <div className={`text-sm ${returnAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {returnAmount >= 0 ? "+" : ""}₱{returnAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
