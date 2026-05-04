import { useEffect, useMemo, useState } from "react";
import { get, onValue, push, ref, set } from "firebase/database";
import { database } from "../../utils/firebase";
import { fetchLastStocksQuote, getStockMarketApiKey } from "../../utils/stockmark";
import { googleAiApiKey } from "../../utils/ai";
import type { Investment, MarketTrend, Suggestion } from "../../types";

const marketSymbols = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
];

const fallbackMarketTrends: MarketTrend[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 248.04, change: -0.3, changePercent: -0.12 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 465.95, change: 14.77, changePercent: 3.28 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 239.16, change: 4.83, changePercent: 2.06 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 327.93, change: -2.6, changePercent: -0.79 },
];

export { marketSymbols, fallbackMarketTrends };

export function useInvestmentData(uid: string) {
  const userPath = `users/${uid}`;
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<Date | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasMarketApiKey = Boolean(getStockMarketApiKey());

  // Firebase listeners
  useEffect(() => {
    const holdingsRef = ref(database, `${userPath}/investments/holdings`);
    const suggestionsRef = ref(database, `${userPath}/investments/suggestions`);
    const marketRef = ref(database, `${userPath}/investments/marketTrends`);

    const unsubH = onValue(holdingsRef, (s) => {
      const d = s.val() as Record<string, Investment> | null;
      if (!d) { setInvestments([]); return; }
      setInvestments(Object.entries(d).map(([key, v]) => ({ ...v, key, id: v.id ?? Date.now() })));
    });
    const unsubS = onValue(suggestionsRef, (s) => {
      const d = s.val() as Record<string, Suggestion> | null;
      if (!d) { setSuggestions([]); return; }
      setSuggestions(Object.entries(d).map(([key, v]) => ({ ...v, key, id: v.id ?? Date.now() })));
    });

    setMarketTrends(fallbackMarketTrends);
    void set(marketRef, fallbackMarketTrends);

    return () => { unsubH(); unsubS(); };
  }, [userPath]);

  // Live market data
  useEffect(() => {
    const apiKey = getStockMarketApiKey();
    if (!apiKey) {
      const marketRef = ref(database, `${userPath}/investments/marketTrends`);
      const unsub = onValue(marketRef, (s) => {
        const d = s.val() as Record<string, MarketTrend> | null;
        if (!d) { setMarketTrends([]); return; }
        setMarketTrends(Object.entries(d).map(([key, v]) => ({ ...v, key })));
      });
      return () => unsub();
    }
    let cancelled = false;
    const fetchMarket = async () => {
      setIsMarketLoading(true); setMarketError(null);
      try {
        const quotes = await Promise.all(marketSymbols.map(async (si) => {
          const q = await fetchLastStocksQuote(si.symbol, apiKey);
          return { symbol: q.symbol, name: si.name, price: q.price, change: q.change, changePercent: q.changePercent } as MarketTrend;
        }));
        if (!cancelled) { setMarketTrends(quotes); setMarketUpdatedAt(new Date()); }
      } catch (e) {
        if (!cancelled) setMarketError(e instanceof Error ? e.message : "Failed to load market data.");
      } finally { if (!cancelled) setIsMarketLoading(false); }
    };
    void fetchMarket();
    return () => { cancelled = true; };
  }, [userPath]);

  const getMarketPrice = (inv: Investment) => {
    const norm = `${inv.name} ${inv.type}`.toUpperCase();
    const direct = inv.name.toUpperCase();
    const match = marketTrends.find((t) => t.symbol.toUpperCase() === direct || norm.includes(t.symbol.toUpperCase()));
    return match?.price ?? inv.currentValue;
  };

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + getMarketPrice(i), 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const portfolioAllocations = useMemo(() => {
    if (totalInvested <= 0) return [];
    const grouped = new Map<string, number>();
    investments.forEach((i) => { const l = i.name?.trim() || i.type; grouped.set(l, (grouped.get(l) ?? 0) + i.amount); });
    return Array.from(grouped.entries()).map(([label, amount]) => ({ label, amount, percentage: (amount / totalInvested) * 100 })).sort((a, b) => b.amount - a.amount);
  }, [investments, totalInvested]);

  const addInvestment = async (data: { name: string; type: string; amount: number; currentValue: number; risk: "low" | "medium" | "high" }) => {
    const returnsPercent = data.amount > 0 ? ((data.currentValue - data.amount) / data.amount) * 100 : 0;
    const investment: Investment = { id: Date.now(), ...data, returns: returnsPercent };
    setIsSubmitting(true);
    try { await push(ref(database, `${userPath}/investments/holdings`), investment); }
    finally { setIsSubmitting(false); }
  };

  const handleSymbolSelect = (symbol: string) => {
    const price = marketTrends.find((t) => t.symbol === symbol)?.price ?? fallbackMarketTrends.find((t) => t.symbol === symbol)?.price ?? 0;
    return { name: symbol, type: "Stock", currentValue: price ? price.toFixed(2) : "" };
  };

  // AI suggestions
  const loadFinanceContext = async () => {
    const [txSnap, budgetsSnap, billsSnap, goalsSnap, invSnap] = await Promise.all([
      get(ref(database, `${userPath}/transactions`)), get(ref(database, `${userPath}/budgets`)),
      get(ref(database, `${userPath}/bills`)), get(ref(database, `${userPath}/goals`)),
      get(ref(database, `${userPath}/investments/holdings`)),
    ]);
    const tx = Object.values((txSnap.val() as Record<string, { amount?: number; category?: string }> | null) ?? {});
    const budgets = Object.values((budgetsSnap.val() as Record<string, { category?: string; budget?: number; spent?: number }> | null) ?? {});
    const bills = Object.values((billsSnap.val() as Record<string, { name?: string; amount?: number; dueDate?: string; status?: string }> | null) ?? {});
    const goals = Object.values((goalsSnap.val() as Record<string, { name?: string; targetAmount?: number; currentAmount?: number }> | null) ?? {});
    const inv = Object.values((invSnap.val() as Record<string, { name?: string; type?: string; amount?: number; currentValue?: number }> | null) ?? {});
    const income = tx.filter((t) => (t.amount ?? 0) > 0).reduce((s, t) => s + (t.amount ?? 0), 0);
    const expenses = tx.filter((t) => (t.amount ?? 0) < 0).reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);
    return {
      income, expenses,
      budgetSummary: budgets.map((b) => `${b.category ?? "Uncategorized"}: ₱${b.budget ?? 0} (spent ₱${b.spent ?? 0})`),
      billSummary: bills.slice(0, 5).map((b) => `${b.name ?? "Bill"} ₱${b.amount ?? 0} due ${b.dueDate ?? ""} (${b.status ?? "pending"})`),
      goalSummary: goals.map((g) => `${g.name ?? "Goal"}: ₱${g.currentAmount ?? 0}/₱${g.targetAmount ?? 0}`),
      investmentSummary: inv.map((i) => `${i.name ?? i.type ?? "Investment"}: invested ₱${i.amount ?? 0}, current ₱${i.currentValue ?? i.amount ?? 0}`),
    };
  };

  const refreshSuggestions = async () => {
    if (!googleAiApiKey) throw new Error("Missing VITE_GOOGLE_AI_API_KEY.");
    setIsAiLoading(true); setAiError(null);
    try {
      const ctx = await loadFinanceContext();
      const trendsStr = (marketTrends.length ? marketTrends : fallbackMarketTrends).map((t) => `${t.symbol} ${t.name} ₱${t.price} (${t.changePercent}%)`).join(" | ");
      const payload = { contents: [{ role: "user", parts: [{ text: `You are a financial assistant. Create 4 concise investment suggestions based ONLY on the current marketTrends list provided below. Do not mention any stocks or assets outside this list. Each suggestion must include a clear disclaimer that it is outside the app and only a suggestion. Return ONLY valid JSON array with fields: title, description, risk (low|medium|high), potentialReturn.\n\nUser summary:\n- Income: ${ctx.income}\n- Expenses: ${ctx.expenses}\n- Budgets: ${ctx.budgetSummary.join(" | ") || "None"}\n- Bills: ${ctx.billSummary.join(" | ") || "None"}\n- Goals: ${ctx.goalSummary.join(" | ") || "None"}\n- Investments: ${ctx.investmentSummary.join(" | ") || "None"}\n- Market trends list (ONLY use these): ${trendsStr}` }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 512 } };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`AI request failed (${res.status}).`);
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      let parsed: Array<Omit<Suggestion, "id" | "key">> = [];
      try { parsed = JSON.parse(cleaned); } catch { const m = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/); if (m) parsed = JSON.parse(m[0]); }
      const items = parsed.slice(0, 4).map((item, i) => ({ id: Date.now() + i, title: item.title, description: item.description, risk: item.risk, potentialReturn: item.potentialReturn }));
      setSuggestions(items);
      await set(ref(database, `${userPath}/investments/suggestions`), items);
    } catch (e) { setAiError(e instanceof Error ? e.message : "Failed to load AI suggestions."); }
    finally { setIsAiLoading(false); }
  };

  return {
    investments, marketTrends, suggestions, marketError, isMarketLoading, marketUpdatedAt,
    isAiLoading, aiError, isSubmitting, hasMarketApiKey,
    getMarketPrice, totalInvested, totalCurrentValue, totalReturns, totalReturnsPercent,
    portfolioAllocations, addInvestment, handleSymbolSelect, refreshSuggestions,
  };
}
