import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { Suggestion } from "../../types";

type SuggestionsTabProps = {
  suggestions: Suggestion[];
  isAiLoading: boolean;
  aiError: string | null;
  onRefresh: () => void;
};

function getRiskBadge(risk: string) {
  switch (risk) {
    case "low": return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
    case "medium": return <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>;
    case "high": return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
    default: return <Badge>Unknown</Badge>;
  }
}

export function SuggestionsTab({ suggestions, isAiLoading, aiError, onRefresh }: SuggestionsTabProps) {
  return (
    <div className="mt-6 space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AI Investment Suggestions</h2>
          <Button onClick={onRefresh} disabled={isAiLoading} className="bg-blue-600 hover:bg-blue-700">
            {isAiLoading ? "Generating..." : "Refresh Suggestions"}
          </Button>
        </div>
        {aiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{aiError}</div>
        )}
        {suggestions.length === 0 && !isAiLoading && (
          <p className="text-sm text-gray-500">Click "Refresh Suggestions" to get AI-powered investment ideas based on your portfolio and market data.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
          {suggestions.map((s) => (
            <Card key={s.key ?? s.id ?? s.title} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                {getRiskBadge(s.risk)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{s.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Potential Return:</span>
                <span className="text-sm font-bold text-green-600">{s.potentialReturn}</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
