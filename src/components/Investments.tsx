import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { get, onValue, push, ref, set } from "firebase/database";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { database } from "../utils/firebase";
import { fetchLastStocksQuote, getStockMarketApiKey } from "../utils/stockmark";
import { googleAiApiKey } from "../utils/ai";

type Investment = {
  id?: number;
  key?: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  returns: number;
  risk: "low" | "medium" | "high";
};

type MarketTrend = {
  key?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
};

type Suggestion = {
  id?: number;
  key?: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  potentialReturn: string;
};

type InvestmentsProps = {
  uid: string;
};

const marketSymbols = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
];

const fallbackMarketTrends: MarketTrend[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 248.04,
    change: -0.3,
    changePercent: -0.12,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 465.95,
    change: 14.77,
    changePercent: 3.28,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 239.16,
    change: 4.83,
    changePercent: 2.06,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 327.93,
    change: -2.6,
    changePercent: -0.79,
  },
];

export function Investments({ uid }: InvestmentsProps) {
  const userPath = `users/${uid}`;
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<Date | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: "",
    type: "Stock",
    amount: "",
    currentValue: "",
    risk: "medium" as "low" | "medium" | "high",
  });
  const hasMarketApiKey = Boolean(getStockMarketApiKey());

  const getMarketPriceForInvestment = (investment: Investment) => {
    const normalized = `${investment.name} ${investment.type}`.toUpperCase();
    const directSymbol = investment.name.toUpperCase();
    const match = marketTrends.find(
      (trend) =>
        trend.symbol.toUpperCase() === directSymbol ||
        normalized.includes(trend.symbol.toUpperCase()),
    );
    return match?.price ?? investment.currentValue;
  };

  const handleSymbolSelect = (symbol: string) => {
    const price =
      marketTrends.find((trend) => trend.symbol === symbol)?.price ??
      fallbackMarketTrends.find((trend) => trend.symbol === symbol)?.price ??
      0;
    setNewInvestment((prev) => ({
      ...prev,
      name: symbol,
      type: "Stock",
      currentValue: price ? price.toFixed(2) : prev.currentValue,
    }));
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + getMarketPriceForInvestment(inv),
    0,
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercent =
    totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const portfolioAllocations = useMemo(() => {
    if (totalInvested <= 0) return [];

    const grouped = new Map<string, number>();
    investments.forEach((investment) => {
      const label = investment.name?.trim() || investment.type;
      grouped.set(label, (grouped.get(label) ?? 0) + investment.amount);
    });

    return Array.from(grouped.entries())
      .map(([label, amount]) => ({
        label,
        amount,
        percentage: (amount / totalInvested) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [investments, totalInvested]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>
        );
      case "high":
        return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  useEffect(() => {
    const holdingsRef = ref(database, `${userPath}/investments/holdings`);
    const suggestionsRef = ref(database, `${userPath}/investments/suggestions`);
    const marketRef = ref(database, `${userPath}/investments/marketTrends`);

    const unsubscribeHoldings = onValue(holdingsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Investment> | null;
      if (!data) {
        setInvestments([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setInvestments(items);
    });

    const unsubscribeSuggestions = onValue(suggestionsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Suggestion> | null;
      if (!data) {
        setSuggestions([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setSuggestions(items);
    });

    setMarketTrends(fallbackMarketTrends);
    void set(marketRef, fallbackMarketTrends);

    return () => {
      unsubscribeHoldings();
      unsubscribeSuggestions();
    };
  }, [userPath]);

  const loadFinanceContext = async () => {
    const [txSnap, budgetsSnap, billsSnap, goalsSnap, investmentsSnap] =
      await Promise.all([
        get(ref(database, `${userPath}/transactions`)),
        get(ref(database, `${userPath}/budgets`)),
        get(ref(database, `${userPath}/bills`)),
        get(ref(database, `${userPath}/goals`)),
        get(ref(database, `${userPath}/investments/holdings`)),
      ]);

    const transactions = Object.values(
      (txSnap.val() as Record<
        string,
        { amount?: number; category?: string }
      > | null) ?? {},
    );
    const budgets = Object.values(
      (budgetsSnap.val() as Record<
        string,
        { category?: string; budget?: number; spent?: number }
      > | null) ?? {},
    );
    const bills = Object.values(
      (billsSnap.val() as Record<
        string,
        { name?: string; amount?: number; dueDate?: string; status?: string }
      > | null) ?? {},
    );
    const goals = Object.values(
      (goalsSnap.val() as Record<
        string,
        { name?: string; targetAmount?: number; currentAmount?: number }
      > | null) ?? {},
    );
    const investmentHoldings = Object.values(
      (investmentsSnap.val() as Record<
        string,
        { name?: string; type?: string; amount?: number; currentValue?: number }
      > | null) ?? {},
    );

    const income = transactions
      .filter((t) => (t.amount ?? 0) > 0)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const expenses = transactions
      .filter((t) => (t.amount ?? 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

    const budgetSummary = budgets.map(
      (b) =>
        `${b.category ?? "Uncategorized"}: ₱${b.budget ?? 0} (spent ₱${b.spent ?? 0})`,
    );
    const billSummary = bills
      .slice(0, 5)
      .map(
        (b) =>
          `${b.name ?? "Bill"} ₱${b.amount ?? 0} due ${b.dueDate ?? ""} (${b.status ?? "pending"})`,
      );
    const goalSummary = goals.map(
      (g) =>
        `${g.name ?? "Goal"}: ₱${g.currentAmount ?? 0}/₱${g.targetAmount ?? 0}`,
    );
    const investmentSummary = investmentHoldings.map(
      (i) =>
        `${i.name ?? i.type ?? "Investment"}: invested ₱${i.amount ?? 0}, current ₱${i.currentValue ?? i.amount ?? 0}`,
    );

    return {
      income,
      expenses,
      budgetSummary,
      billSummary,
      goalSummary,
      investmentSummary,
    };
  };

  const requestAISuggestions = async (): Promise<Suggestion[]> => {
    if (!googleAiApiKey) {
      throw new Error(
        "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart the dev server.",
      );
    }

    const context = await loadFinanceContext();
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a financial assistant. Create 4 concise investment suggestions based ONLY on the current marketTrends list provided below. Do not mention any stocks or assets outside this list. Each suggestion must include a clear disclaimer that it is outside the app and only a suggestion. Return ONLY valid JSON array with fields: title, description, risk (low|medium|high), potentialReturn.\n\nUser summary:\n- Income: ${context.income}\n- Expenses: ${context.expenses}\n- Budgets: ${context.budgetSummary.join(" | ") || "None"}\n- Bills: ${context.billSummary.join(" | ") || "None"}\n- Goals: ${context.goalSummary.join(" | ") || "None"}\n- Investments: ${context.investmentSummary.join(" | ") || "None"}\n- Market trends list (ONLY use these): ${marketTrends.map((trend) => `${trend.symbol} ${trend.name} ₱${trend.price} (${trend.changePercent}%)`).join(" | ") || fallbackMarketTrends.map((trend) => `${trend.symbol} ${trend.name} ₱${trend.price} (${trend.changePercent}%)`).join(" | ")}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`AI request failed (${response.status}).`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: Array<Omit<Suggestion, "id" | "key">> = [];
    try {
      parsed = JSON.parse(cleanedText) as Array<Omit<Suggestion, "id" | "key">>;
    } catch {
      const fallbackMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (fallbackMatch) {
        parsed = JSON.parse(fallbackMatch[0]) as Array<
          Omit<Suggestion, "id" | "key">
        >;
      }
    }
    return parsed.slice(0, 4).map((item, index) => ({
      id: Date.now() + index,
      title: item.title,
      description: item.description,
      risk: item.risk,
      potentialReturn: item.potentialReturn,
    }));
  };

  const handleRefreshSuggestions = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const aiSuggestions = await requestAISuggestions();
      setSuggestions(aiSuggestions);
      await set(
        ref(database, `${userPath}/investments/suggestions`),
        aiSuggestions,
      );
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to load AI suggestions.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const apiKey = getStockMarketApiKey();
    if (!apiKey) {
      const marketRef = ref(database, `${userPath}/investments/marketTrends`);
      const unsubscribeMarket = onValue(marketRef, (snapshot) => {
        const data = snapshot.val() as Record<string, MarketTrend> | null;
        if (!data) {
          setMarketTrends([]);
          return;
        }
        const items = Object.entries(data).map(([key, value]) => ({
          ...value,
          key,
        }));
        setMarketTrends(items);
      });

      return () => {
        unsubscribeMarket();
      };
    }

    let cancelled = false;

    const fetchMarket = async () => {
      setIsMarketLoading(true);
      setMarketError(null);
      try {
        const quotes = await Promise.all(
          marketSymbols.map(async (symbolInfo) => {
            const quote = await fetchLastStocksQuote(symbolInfo.symbol, apiKey);
            return {
              symbol: quote.symbol,
              name: symbolInfo.name,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
            } as MarketTrend;
          }),
        );

        if (!cancelled) {
          setMarketTrends(quotes);
          setMarketUpdatedAt(new Date());
        }
      } catch (error) {
        if (!cancelled) {
          setMarketError(
            error instanceof Error
              ? error.message
              : "Failed to load market data.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsMarketLoading(false);
        }
      }
    };

    void fetchMarket();
    return () => {
      cancelled = true;
    };
  }, [userPath]);

  const handleAddInvestment = async () => {
    if (!newInvestment.name || !newInvestment.type || !newInvestment.amount) {
      return;
    }

    const amountValue = Number(newInvestment.amount);
    const currentValue = newInvestment.currentValue
      ? Number(newInvestment.currentValue)
      : amountValue;
    if (!Number.isFinite(amountValue) || amountValue <= 0) return;

    const returnsPercent =
      amountValue > 0 ? ((currentValue - amountValue) / amountValue) * 100 : 0;

    const investment: Investment = {
      id: Date.now(),
      name: newInvestment.name,
      type: newInvestment.type,
      amount: amountValue,
      currentValue,
      returns: returnsPercent,
      risk: newInvestment.risk,
    };

    setIsSubmitting(true);
    try {
      await push(ref(database, `${userPath}/investments/holdings`), investment);
    } finally {
      setIsSubmitting(false);
    }

    setIsAddDialogOpen(false);
    setNewInvestment({
      name: "",
      type: "Stock",
      amount: "",
      currentValue: "",
      risk: "medium",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-500 mt-1">
            Track your portfolio and discover new opportunities
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <DollarSign size={20} className="mr-2" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Investment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="investmentName">Stock Symbol</Label>
                <Select
                  value={newInvestment.name}
                  onValueChange={handleSymbolSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketSymbols.map((symbol) => (
                      <SelectItem key={symbol.symbol} value={symbol.symbol}>
                        {symbol.symbol} · {symbol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="investmentType">Type</Label>
                <Input
                  id="investmentType"
                  placeholder="Stock"
                  value={newInvestment.type}
                  readOnly
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="amount">Amount Invested (₱)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newInvestment.amount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewInvestment({
                        ...newInvestment,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="currentValue">Current Value (₱)</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    placeholder="0.00"
                    value={newInvestment.currentValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewInvestment({
                        ...newInvestment,
                        currentValue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="risk">Risk Level</Label>
                <Select
                  value={newInvestment.risk}
                  onValueChange={(value: string) =>
                    setNewInvestment({
                      ...newInvestment,
                      risk: value as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddInvestment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Add Investment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total Invested</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            ₱
            {totalInvested.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Current Value</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-2">
            ₱
            {totalCurrentValue.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total Returns</p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              totalReturns >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {totalReturns >= 0 ? "+" : ""}₱
            {totalReturns.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Return Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <h3
              className={`text-2xl font-bold ${
                totalReturnsPercent >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalReturnsPercent >= 0 ? "+" : ""}
              {totalReturnsPercent.toFixed(2)}%
            </h3>
            {totalReturnsPercent >= 0 ? (
              <TrendingUp className="text-green-600" size={24} />
            ) : (
              <TrendingDown className="text-red-600" size={24} />
            )}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market Trends</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-6 space-y-4">
          {/* Portfolio Allocation */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Portfolio Allocation
              </h2>
            </div>
            <div className="space-y-4">
              {portfolioAllocations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Add an investment to see your portfolio allocation.
                </p>
              ) : (
                portfolioAllocations.map((allocation) => (
                  <div key={allocation.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-900">
                        {allocation.label}
                      </p>
                      <span className="text-sm font-semibold text-gray-900">
                        ₱
                        {allocation.amount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{allocation.percentage.toFixed(1)}%</span>
                      <span>of portfolio</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(allocation.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Investment List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.map((inv) => {
              const returnAmount = inv.currentValue - inv.amount;
              return (
                <Card key={inv.key ?? inv.id ?? inv.name} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {inv.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{inv.type}</p>
                    </div>
                    {getRiskBadge(inv.risk)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Invested</span>
                      <span className="font-medium text-gray-900">
                        ₱{inv.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Current Value
                      </span>
                      <span className="font-semibold text-blue-600">
                        ₱{getMarketPriceForInvestment(inv).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-sm font-medium text-gray-700">
                        Returns
                      </span>
                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            inv.returns >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {inv.returns >= 0 ? "+" : ""}
                          {inv.returns.toFixed(2)}%
                        </div>
                        <div
                          className={`text-sm ${
                            returnAmount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {returnAmount >= 0 ? "+" : ""}₱
                          {returnAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="market" className="mt-6 space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Philippine Stock Market
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 mb-4">
              <span>
                {hasMarketApiKey
                  ? "Massive REST quotes"
                  : "Massive API key not configured. Showing saved trends."}
                {marketUpdatedAt
                  ? ` • Updated ${marketUpdatedAt.toLocaleTimeString("en-PH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </span>
              {isMarketLoading ? <span>Refreshing…</span> : null}
            </div>
            {marketError ? (
              <div className="text-sm text-red-600 mb-3">{marketError}</div>
            ) : null}
            <div className="space-y-3">
              {marketTrends.map((trend) => (
                <div
                  key={trend.key ?? trend.symbol}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {trend.symbol}
                        </p>
                        <p className="text-sm text-gray-500">{trend.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₱{trend.price.toFixed(2)}
                    </p>
                    <div
                      className={`flex items-center gap-1 justify-end ${
                        trend.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {trend.change >= 0 ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {trend.change >= 0 ? "+" : ""}
                        {trend.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Market Analysis
                </h3>
                <p className="text-sm text-blue-800">
                  The Philippine stock market is showing moderate growth with
                  the PSE Composite Index up 0.67% today. Banking and real
                  estate sectors are performing well, while tech stocks are
                  experiencing volatility.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6 space-y-4">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Powered Investment Insights
                </h2>
                <p className="text-sm text-gray-600">
                  Based on your risk profile and financial goals, here are
                  personalized investment recommendations.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Generate fresh suggestions using your latest financial data.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleRefreshSuggestions}
              disabled={isAiLoading}
            >
              {isAiLoading ? "Generating..." : "Refresh AI Suggestions"}
            </Button>
          </div>

          {aiError ? (
            <div className="text-sm text-red-600">{aiError}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.key ?? suggestion.id ?? suggestion.title}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {suggestion.title}
                  </h3>
                  {getRiskBadge(suggestion.risk)}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {suggestion.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Potential Return</span>
                    <span className="font-medium text-green-600">
                      {suggestion.potentialReturn}
                    </span>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                    Learn More
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Risk Assessment */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Portfolio Risk Assessment
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Risk Level
                  </span>
                  <span className="text-sm font-medium text-yellow-600">
                    Medium
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Your portfolio has a balanced risk profile with a mix of low,
                medium, and high-risk investments. Consider rebalancing to align
                with your long-term financial goals.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {investments.filter((i) => i.risk === "low").length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Low Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {investments.filter((i) => i.risk === "medium").length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Medium Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {investments.filter((i) => i.risk === "high").length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">High Risk</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
