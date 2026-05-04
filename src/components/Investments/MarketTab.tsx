import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import type { MarketTrend } from "../../types";

type MarketTabProps = {
  marketTrends: MarketTrend[];
  hasMarketApiKey: boolean;
  isMarketLoading: boolean;
  marketError: string | null;
  marketUpdatedAt: Date | null;
};

export function MarketTab({ marketTrends, hasMarketApiKey, isMarketLoading, marketError, marketUpdatedAt }: MarketTabProps) {
  return (
    <div className="mt-6 space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Philippine Stock Market</h2>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 mb-4">
          <span>
            {hasMarketApiKey ? "Massive REST quotes" : "Massive API key not configured. Showing saved trends."}
            {marketUpdatedAt && ` · Updated ${marketUpdatedAt.toLocaleTimeString()}`}
          </span>
          {isMarketLoading && <span className="text-blue-600 animate-pulse">Loading...</span>}
        </div>
        {marketError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{marketError}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
          {marketTrends.map((trend) => (
            <Card key={trend.symbol} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{trend.symbol}</h3>
                  <p className="text-sm text-gray-500">{trend.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₱{trend.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                  <div className={`flex items-center gap-1 text-sm ${trend.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {trend.change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{trend.change >= 0 ? "+" : ""}{trend.change.toFixed(2)} ({trend.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
