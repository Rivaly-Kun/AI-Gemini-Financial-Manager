import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../../utils/firebase";
import { googleAiApiKey } from "../../utils/ai";
import type { CoachMessage } from "../../types";
import { SLASH_COMMANDS } from "../../constants";

type Transaction = {
  amount?: number;
  date?: string;
  type?: "income" | "expense";
  category?: string;
  name?: string;
  createdAt?: string;
  paymentMethod?: string;
};

const currency = (v: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);

export function useSpendingCoach(uid: string) {
  const userPath = `users/${uid}`;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<Transaction[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSort, setReportSort] = useState<{ col: string; asc: boolean }>({
    col: "date",
    asc: false,
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'll keep an eye on your cash flow and spending. Type / to see available commands.",
    },
  ]);

  useEffect(() => {
    const txRef = ref(database, `${userPath}/transactions`);
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const unsub1 = onValue(txRef, (s) => {
      const d = s.val() as Record<string, Transaction> | null;
      setTransactions(d ? Object.values(d) : []);
    });
    const unsub2 = onValue(dashRef, (s) => {
      const d = s.val() as Record<string, Transaction> | null;
      setDashboardTransactions(d ? Object.values(d) : []);
    });
    return () => { unsub1(); unsub2(); };
  }, [userPath]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const merged = useMemo(() => {
    const all = [...transactions, ...dashboardTransactions];
    const unique = new Map<string, Transaction>();
    all.forEach((tx) => {
      const k = `${tx.amount ?? 0}|${tx.category ?? ""}|${tx.date ?? ""}|${tx.type ?? ""}|${tx.createdAt ?? ""}`;
      if (!unique.has(k)) unique.set(k, tx);
    });
    return Array.from(unique.values());
  }, [transactions, dashboardTransactions]);

  const income = useMemo(
    () => merged.filter((t) => (t.amount ?? 0) > 0).reduce((s, t) => s + (t.amount ?? 0), 0),
    [merged],
  );
  const expenses = useMemo(
    () => merged.filter((t) => (t.amount ?? 0) < 0).reduce((s, t) => s + Math.abs(t.amount ?? 0), 0),
    [merged],
  );
  const net = income - expenses;

  const coachInsight =
    net < 0
      ? `You're spending ${currency(Math.abs(net))} more than you earn. Consider trimming non-essentials.`
      : `Your net balance is ${currency(net)}. Keep it up!`;

  const filteredCmds = SLASH_COMMANDS.filter((c) =>
    !inputValue.startsWith("/")
      ? true
      : c.cmd.startsWith(inputValue.toLowerCase()),
  );

  const addMsg = (role: "assistant" | "user", content: string) => {
    setMessages((p) => [...p, { id: Date.now() + Math.random(), role, content }]);
  };

  const handleSlashCommand = async (cmd: string) => {
    setShowPalette(false);
    setInputValue("");
    addMsg("user", cmd);

    if (cmd === "/clear") {
      setMessages([{ id: Date.now(), role: "assistant", content: "Chat cleared. Type / for commands." }]);
      return;
    }
    if (cmd === "/summary") {
      const cats = new Map<string, number>();
      merged.filter((t) => (t.amount ?? 0) < 0).forEach((t) => {
        const c = t.category || "Uncategorized";
        cats.set(c, (cats.get(c) ?? 0) + Math.abs(t.amount ?? 0));
      });
      let topCat = "N/A"; let topAmt = 0;
      cats.forEach((v, k) => { if (v > topAmt) { topAmt = v; topCat = k; } });
      addMsg("assistant", `📋 **Financial Summary**\n\n💰 Income: ${currency(income)}\n💸 Expenses: ${currency(expenses)}\n📊 Net: ${currency(net)}\n📝 Transactions: ${merged.length}\n🏷️ Top Category: ${topCat} (${currency(topAmt)})`);
      return;
    }
    if (cmd === "/top") {
      const top5 = [...merged].filter((t) => (t.amount ?? 0) < 0).sort((a, b) => Math.abs(b.amount ?? 0) - Math.abs(a.amount ?? 0)).slice(0, 5);
      if (top5.length === 0) { addMsg("assistant", "No expenses found yet."); return; }
      const lines = top5.map((t, i) => `${i + 1}. ${t.name || t.category || "Expense"} — ${currency(Math.abs(t.amount ?? 0))} (${t.category || "N/A"})`);
      addMsg("assistant", `🔥 **Top ${top5.length} Expenses**\n\n${lines.join("\n")}`);
      return;
    }
    if (cmd === "/report") {
      setShowReport(true);
      addMsg("assistant", "📊 Report opened! You can view and export your full transaction history.");
      return;
    }

    if (!googleAiApiKey) { addMsg("assistant", "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart."); return; }
    setIsSending(true);
    try {
      const catBreakdown = new Map<string, number>();
      merged.filter((t) => (t.amount ?? 0) < 0).forEach((t) => {
        const c = t.category || "Uncategorized";
        catBreakdown.set(c, (catBreakdown.get(c) ?? 0) + Math.abs(t.amount ?? 0));
      });
      const breakdown = Array.from(catBreakdown.entries()).map(([k, v]) => `${k}: ${currency(v)}`).join(", ");
      let prompt = "";
      if (cmd === "/trends") prompt = `You are a concise financial analyst. Given this spending breakdown: ${breakdown}. Total income: ${currency(income)}, total expenses: ${currency(expenses)}, net: ${currency(net)}. Identify 3-4 key spending trends or anomalies. Be specific and actionable. Keep under 150 words.`;
      else if (cmd === "/tips") prompt = `You are a friendly financial coach. Given spending: ${breakdown}. Income: ${currency(income)}, expenses: ${currency(expenses)}. Give exactly 3 specific, actionable money-saving tips personalized to these categories. Number them. Keep under 120 words.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 300 } }),
      });
      if (!res.ok) throw new Error(`AI request failed (${res.status})`);
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Couldn't generate a response.";
      addMsg("assistant", `${cmd === "/trends" ? "📈" : "💡"} ${reply}`);
    } catch (e) {
      addMsg("assistant", e instanceof Error ? e.message : "Failed to get response.");
    } finally { setIsSending(false); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const val = inputValue.trim();
    const matchedCmd = SLASH_COMMANDS.find((c) => c.cmd === val.toLowerCase());
    if (matchedCmd) { await handleSlashCommand(matchedCmd.cmd); return; }
    addMsg("user", val);
    setInputValue("");
    if (!googleAiApiKey) { addMsg("assistant", "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart."); return; }
    setIsSending(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `You are a short, helpful spending coach. Use this insight: ${coachInsight}. Answer concisely.\n\nUser: ${val}` }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 200 } }),
      });
      if (!res.ok) throw new Error(`AI request failed (${res.status})`);
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Couldn't generate a response.";
      addMsg("assistant", reply);
    } catch (e) { addMsg("assistant", e instanceof Error ? e.message : "Failed to get response."); }
    finally { setIsSending(false); }
  };

  const handleInputChange = (val: string) => { setInputValue(val); setShowPalette(val.startsWith("/")); };

  const getSortedReport = () => [...merged].sort((a, b) => {
    const dir = reportSort.asc ? 1 : -1;
    if (reportSort.col === "date") return dir * ((new Date(a.date || "").getTime() || 0) - (new Date(b.date || "").getTime() || 0));
    if (reportSort.col === "amount") return dir * ((a.amount ?? 0) - (b.amount ?? 0));
    if (reportSort.col === "name") return dir * (a.name || "").localeCompare(b.name || "");
    if (reportSort.col === "category") return dir * (a.category || "").localeCompare(b.category || "");
    return 0;
  });

  const toggleSort = (col: string) => setReportSort((p) => p.col === col ? { col, asc: !p.asc } : { col, asc: true });
  const sortArrow = (col: string) => reportSort.col === col ? (reportSort.asc ? " ↑" : " ↓") : "";

  const exportCSV = () => {
    const sorted = getSortedReport();
    const rows = [["Date", "Name", "Category", "Type", "Amount"].join(","),
      ...sorted.map((t) => [t.date || "", `"${(t.name || t.category || "Transaction").replace(/"/g, '""')}"`, `"${(t.category || "N/A").replace(/"/g, '""')}"`, (t.amount ?? 0) > 0 ? "Income" : "Expense", (t.amount ?? 0).toFixed(2)].join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `spending_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return {
    messages, inputValue, isSending, showPalette, showReport, setShowReport,
    merged, income, expenses, net, coachInsight, filteredCmds,
    handleSlashCommand, handleSend, handleInputChange,
    getSortedReport, toggleSort, sortArrow, exportCSV,
    chatEndRef, inputRef,
  };
}
