import { useState } from "react";
import { useInvestmentData } from "./useInvestmentData";
import { PortfolioStats } from "./PortfolioStats";
import { PortfolioTab } from "./PortfolioTab";
import { MarketTab } from "./MarketTab";
import { SuggestionsTab } from "./SuggestionsTab";
import { AddInvestmentModal } from "./AddInvestmentModal";

type InvestmentsProps = { uid: string };
type TabValue = "portfolio" | "market" | "suggestions";

export function Investments({ uid }: InvestmentsProps) {
  const {
    investments, marketTrends, suggestions, marketError, isMarketLoading, marketUpdatedAt,
    isAiLoading, aiError, isSubmitting, hasMarketApiKey,
    getMarketPrice, totalInvested, totalCurrentValue, totalReturns, totalReturnsPercent,
    portfolioAllocations, addInvestment, handleSymbolSelect, refreshSuggestions,
  } = useInvestmentData(uid);

  const [activeTab, setActiveTab] = useState<TabValue>("portfolio");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-500 mt-1">Track your portfolio and get AI-powered insights</p>
        </div>
        <AddInvestmentModal
          onAdd={addInvestment}
          onSymbolSelect={handleSymbolSelect}
          isSubmitting={isSubmitting}
        />
      </div>

      <PortfolioStats
        totalInvested={totalInvested}
        totalCurrentValue={totalCurrentValue}
        totalReturns={totalReturns}
        totalReturnsPercent={totalReturnsPercent}
      />

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "portfolio" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Portfolio
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "market" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Market Trends
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "suggestions" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          AI Suggestions
        </button>
      </div>

      {activeTab === "portfolio" && (
        <PortfolioTab
          investments={investments}
          portfolioAllocations={portfolioAllocations}
          getMarketPrice={getMarketPrice}
        />
      )}
      {activeTab === "market" && (
        <MarketTab
          marketTrends={marketTrends}
          hasMarketApiKey={hasMarketApiKey}
          isMarketLoading={isMarketLoading}
          marketError={marketError}
          marketUpdatedAt={marketUpdatedAt}
        />
      )}
      {activeTab === "suggestions" && (
        <SuggestionsTab
          suggestions={suggestions}
          isAiLoading={isAiLoading}
          aiError={aiError}
          onRefresh={refreshSuggestions}
        />
      )}
    </div>
  );
}
