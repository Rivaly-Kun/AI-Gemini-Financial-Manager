import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card } from "../ui/card";

type PortfolioStatsProps = {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  totalReturnsPercent: number;
};

export function PortfolioStats({ totalInvested, totalCurrentValue, totalReturns, totalReturnsPercent }: PortfolioStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6">
        <p className="text-sm text-gray-500">Total Invested</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">₱{totalInvested.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</h3>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-gray-500">Current Value</p>
        <h3 className="text-2xl font-bold text-blue-600 mt-2">₱{totalCurrentValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</h3>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-gray-500">Total Returns</p>
        <h3 className={`text-2xl font-bold mt-2 ${totalReturns >= 0 ? "text-green-600" : "text-red-600"}`}>
          {totalReturns >= 0 ? "+" : ""}₱{totalReturns.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </h3>
      </Card>
      <Card className="p-6">
        <p className="text-sm text-gray-500">Return Rate</p>
        <div className="flex items-center gap-2 mt-2">
          <h3 className={`text-2xl font-bold ${totalReturnsPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalReturnsPercent >= 0 ? "+" : ""}{totalReturnsPercent.toFixed(2)}%
          </h3>
          {totalReturnsPercent >= 0 ? <TrendingUp className="text-green-600" size={24} /> : <TrendingDown className="text-red-600" size={24} />}
        </div>
      </Card>
    </div>
  );
}
