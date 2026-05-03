import { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../utils/firebase";
import { googleAiApiKey } from "../utils/ai";

type Transaction = {
  amount?: number;
  date?: string;
  type?: "income" | "expense";
  category?: string;
  name?: string;
  createdAt?: string;
  paymentMethod?: string;
};

type CoachMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  html?: string;
};

type SpendingCoachProps = { uid: string };

type SlashCmd = {
  cmd: string;
  icon: string;
  label: string;
  desc: string;
};

const COMMANDS: SlashCmd[] = [
  {
    cmd: "/report",
    icon: "📊",
    label: "Report",
    desc: "Full transaction table with export",
  },
  {
    cmd: "/summary",
    icon: "📋",
    label: "Summary",
    desc: "Quick income/expense overview",
  },
  {
    cmd: "/top",
    icon: "🔥",
    label: "Top Expenses",
    desc: "Your 5 biggest expenses",
  },
  {
    cmd: "/trends",
    icon: "📈",
    label: "Trends",
    desc: "AI spending trend analysis",
  },
  {
    cmd: "/tips",
    icon: "💡",
    label: "Tips",
    desc: "AI personalized saving tips",
  },
  { cmd: "/clear", icon: "🗑️", label: "Clear", desc: "Reset chat history" },
];

const currency = (v: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    v,
  );

type ViewMode = "minimized" | "normal" | "expanded";

export function SpendingCoach({ uid }: SpendingCoachProps) {
  const userPath = `users/${uid}`;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<
    Transaction[]
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
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
    return () => {
      unsub1();
      unsub2();
    };
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
    () =>
      merged
        .filter((t) => (t.amount ?? 0) > 0)
        .reduce((s, t) => s + (t.amount ?? 0), 0),
    [merged],
  );
  const expenses = useMemo(
    () =>
      merged
        .filter((t) => (t.amount ?? 0) < 0)
        .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0),
    [merged],
  );
  const net = income - expenses;

  const coachInsight =
    net < 0
      ? `You're spending ${currency(Math.abs(net))} more than you earn. Consider trimming non-essentials.`
      : `Your net balance is ${currency(net)}. Keep it up!`;

  const filteredCmds = COMMANDS.filter((c) =>
    !inputValue.startsWith("/")
      ? true
      : c.cmd.startsWith(inputValue.toLowerCase()),
  );

  const addMsg = (
    role: "assistant" | "user",
    content: string,
    html?: string,
  ) => {
    setMessages((p) => [
      ...p,
      { id: Date.now() + Math.random(), role, content, html },
    ]);
  };

  const handleSlashCommand = async (cmd: string) => {
    setShowPalette(false);
    setInputValue("");
    addMsg("user", cmd);

    if (cmd === "/clear") {
      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: "Chat cleared. Type / for commands.",
        },
      ]);
      return;
    }

    if (cmd === "/summary") {
      const cats = new Map<string, number>();
      merged
        .filter((t) => (t.amount ?? 0) < 0)
        .forEach((t) => {
          const c = t.category || "Uncategorized";
          cats.set(c, (cats.get(c) ?? 0) + Math.abs(t.amount ?? 0));
        });
      let topCat = "N/A";
      let topAmt = 0;
      cats.forEach((v, k) => {
        if (v > topAmt) {
          topAmt = v;
          topCat = k;
        }
      });
      addMsg(
        "assistant",
        `📋 **Financial Summary**\n\n💰 Income: ${currency(income)}\n💸 Expenses: ${currency(expenses)}\n📊 Net: ${currency(net)}\n📝 Transactions: ${merged.length}\n🏷️ Top Category: ${topCat} (${currency(topAmt)})`,
      );
      return;
    }

    if (cmd === "/top") {
      const top5 = [...merged]
        .filter((t) => (t.amount ?? 0) < 0)
        .sort((a, b) => Math.abs(b.amount ?? 0) - Math.abs(a.amount ?? 0))
        .slice(0, 5);
      if (top5.length === 0) {
        addMsg("assistant", "No expenses found yet.");
        return;
      }
      const lines = top5.map(
        (t, i) =>
          `${i + 1}. ${t.name || t.category || "Expense"} — ${currency(Math.abs(t.amount ?? 0))} (${t.category || "N/A"})`,
      );
      addMsg(
        "assistant",
        `🔥 **Top ${top5.length} Expenses**\n\n${lines.join("\n")}`,
      );
      return;
    }

    if (cmd === "/report") {
      setShowReport(true);
      addMsg(
        "assistant",
        "📊 Report opened! You can view and export your full transaction history.",
      );
      return;
    }

    // AI commands: /trends, /tips
    if (!googleAiApiKey) {
      addMsg(
        "assistant",
        "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart.",
      );
      return;
    }

    setIsSending(true);
    try {
      const catBreakdown = new Map<string, number>();
      merged
        .filter((t) => (t.amount ?? 0) < 0)
        .forEach((t) => {
          const c = t.category || "Uncategorized";
          catBreakdown.set(
            c,
            (catBreakdown.get(c) ?? 0) + Math.abs(t.amount ?? 0),
          );
        });
      const breakdown = Array.from(catBreakdown.entries())
        .map(([k, v]) => `${k}: ${currency(v)}`)
        .join(", ");

      let prompt = "";
      if (cmd === "/trends") {
        prompt = `You are a concise financial analyst. Given this spending breakdown: ${breakdown}. Total income: ${currency(income)}, total expenses: ${currency(expenses)}, net: ${currency(net)}. Identify 3-4 key spending trends or anomalies. Be specific and actionable. Keep under 150 words.`;
      } else if (cmd === "/tips") {
        prompt = `You are a friendly financial coach. Given spending: ${breakdown}. Income: ${currency(income)}, expenses: ${currency(expenses)}. Give exactly 3 specific, actionable money-saving tips personalized to these categories. Number them. Keep under 120 words.`;
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
          }),
        },
      );
      if (!res.ok) throw new Error(`AI request failed (${res.status})`);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Couldn't generate a response.";
      addMsg("assistant", `${cmd === "/trends" ? "📈" : "💡"} ${reply}`);
    } catch (e) {
      addMsg(
        "assistant",
        e instanceof Error ? e.message : "Failed to get response.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const val = inputValue.trim();

    // Check if it's a slash command
    const matchedCmd = COMMANDS.find((c) => c.cmd === val.toLowerCase());
    if (matchedCmd) {
      await handleSlashCommand(matchedCmd.cmd);
      return;
    }

    addMsg("user", val);
    setInputValue("");

    if (!googleAiApiKey) {
      addMsg(
        "assistant",
        "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart.",
      );
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${googleAiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are a short, helpful spending coach. Use this insight: ${coachInsight}. Answer concisely.\n\nUser: ${val}`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
          }),
        },
      );
      if (!res.ok) throw new Error(`AI request failed (${res.status})`);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Couldn't generate a response.";
      addMsg("assistant", reply);
    } catch (e) {
      addMsg(
        "assistant",
        e instanceof Error ? e.message : "Failed to get response.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setShowPalette(val.startsWith("/"));
  };

  const exportCSV = () => {
    const sorted = getSortedReport();
    const rows = [
      ["Date", "Name", "Category", "Type", "Amount"].join(","),
      ...sorted.map((t) =>
        [
          t.date || "",
          `"${(t.name || t.category || "Transaction").replace(/"/g, '""')}"`,
          `"${(t.category || "N/A").replace(/"/g, '""')}"`,
          (t.amount ?? 0) > 0 ? "Income" : "Expense",
          (t.amount ?? 0).toFixed(2),
        ].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spending_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSortedReport = () => {
    return [...merged].sort((a, b) => {
      const dir = reportSort.asc ? 1 : -1;
      if (reportSort.col === "date") {
        return (
          dir *
          ((new Date(a.date || "").getTime() || 0) -
            (new Date(b.date || "").getTime() || 0))
        );
      }
      if (reportSort.col === "amount") {
        return dir * ((a.amount ?? 0) - (b.amount ?? 0));
      }
      if (reportSort.col === "name") {
        return dir * (a.name || "").localeCompare(b.name || "");
      }
      if (reportSort.col === "category") {
        return dir * (a.category || "").localeCompare(b.category || "");
      }
      return 0;
    });
  };

  const toggleSort = (col: string) => {
    setReportSort((p) =>
      p.col === col ? { col, asc: !p.asc } : { col, asc: true },
    );
  };

  const sortArrow = (col: string) =>
    reportSort.col === col ? (reportSort.asc ? " ↑" : " ↓") : "";

  // Simple markdown-ish rendering for bold
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i}>{p.slice(2, -2)}</strong>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  // ─── MINIMIZED ───
  if (viewMode === "minimized") {
    return (
      <button
        onClick={() => setViewMode("normal")}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
        }}
      >
        <span className="text-lg">💬</span>
        <span>Coach</span>
        {merged.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
            {merged.length}
          </span>
        )}
      </button>
    );
  }
  /* ─── isExpanded SVG HOLDER ─── */
  const isExpanded = viewMode === "expanded";
  const widthClass = isExpanded ? "w-[480px]" : "w-80";
  const chatHeight = isExpanded ? "max-h-[400px]" : "max-h-40";

  return (
    <>
      {/* ─── REPORT MODAL ─── */}
      {showReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-8">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  📊 Spending Report
                </h2>
                <p className="text-xs text-slate-500">
                  {merged.length} transactions · Generated{" "}
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  ⬇️ Export CSV
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 px-6 py-3">
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Income
                </p>
                <p className="text-sm font-bold text-emerald-700">
                  {currency(income)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                  Expenses
                </p>
                <p className="text-sm font-bold text-rose-700">
                  {currency(expenses)}
                </p>
              </div>
              <div
                className={`rounded-xl px-3 py-2 text-center ${net >= 0 ? "bg-blue-50" : "bg-amber-50"}`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wide ${net >= 0 ? "text-blue-600" : "text-amber-600"}`}
                >
                  Net
                </p>
                <p
                  className={`text-sm font-bold ${net >= 0 ? "text-blue-700" : "text-amber-700"}`}
                >
                  {currency(net)}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 py-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th
                      className="cursor-pointer px-2 py-2 hover:text-slate-900"
                      onClick={() => toggleSort("date")}
                    >
                      Date{sortArrow("date")}
                    </th>
                    <th
                      className="cursor-pointer px-2 py-2 hover:text-slate-900"
                      onClick={() => toggleSort("name")}
                    >
                      Name{sortArrow("name")}
                    </th>
                    <th
                      className="cursor-pointer px-2 py-2 hover:text-slate-900"
                      onClick={() => toggleSort("category")}
                    >
                      Category{sortArrow("category")}
                    </th>
                    <th className="px-2 py-2">Type</th>
                    <th
                      className="cursor-pointer px-2 py-2 text-right hover:text-slate-900"
                      onClick={() => toggleSort("amount")}
                    >
                      Amount{sortArrow("amount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedReport().map((t, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 transition hover:bg-slate-50/50"
                    >
                      <td className="px-2 py-2 text-slate-600">
                        {t.date
                          ? new Date(t.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-2 py-2 font-medium text-slate-900">
                        {t.name || t.category || "Transaction"}
                      </td>
                      <td className="px-2 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {t.category || "N/A"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(t.amount ?? 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {(t.amount ?? 0) > 0 ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold ${(t.amount ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {currency(Math.abs(t.amount ?? 0))}
                      </td>
                    </tr>
                  ))}
                  {merged.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-8 text-center text-slate-400"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── COACH WIDGET ─── */}
      <div
        className={`fixed bottom-6 right-6 ${widthClass} max-w-[calc(100%-3rem)] z-50 transition-all duration-300 ease-in-out`}
      >
        <div
          className="rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                }}
              >
                <span className="text-white text-xs">💬</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Spending Coach
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  Finance Assistant
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                Live
              </span>
              <button
                onClick={() => setViewMode(isExpanded ? "normal" : "expanded")}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title={isExpanded ? "Shrink" : "Expand"}
              >
                {isExpanded ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4.71 3.29 3.29 4.71l3 3L4 10h6V4L7.71 6.29zm11.58 3L14 4v6h6l-2.29-2.29 3-3-1.42-1.42zM20 14h-6v6l2.29-2.29 3 3 1.42-1.42-3-3zM6.29 16.29l-3 3 1.42 1.42 3-3L10 20v-6H4z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="m15.71 14.29-1.42 1.42 3 3L15 21h6v-6l-2.29 2.29zM8.29 9.71l1.42-1.42-3-3L9 3H3v6l2.29-2.29zm9-4.42-3 3 1.42 1.42 3-3L21 9V3h-6zM6.71 18.71l3-3-1.42-1.42-3 3L3 15v6h6z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={() => setViewMode("minimized")}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Minimize"
              >
                ⌄
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-3 space-y-2">
            {/* Insight Banner */}
            <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
              {coachInsight}
            </div>

            {/* Chat Messages */}
            <div
              className={`space-y-2 ${chatHeight} overflow-y-auto pr-1 no-scrollbar transition-all duration-300`}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === "assistant"
                      ? "bg-slate-50 text-slate-700 border border-slate-100"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-6"
                  }`}
                >
                  {renderContent(m.content)}
                </div>
              ))}
              {isSending && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-400">
                  <span className="inline-flex gap-1">
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    >
                      ●
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    >
                      ●
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    >
                      ●
                    </span>
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Slash Command Palette */}
            {showPalette && filteredCmds.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {filteredCmds.map((c) => (
                  <button
                    key={c.cmd}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-blue-50 border-b border-slate-50 last:border-0"
                    onClick={() => handleSlashCommand(c.cmd)}
                  >
                    <span className="text-sm">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900">
                        {c.cmd}
                      </span>
                      <span className="ml-1 text-slate-400">— {c.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                    if (e.key === "Escape") setShowPalette(false);
                  }}
                  placeholder="Type / for commands..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={isSending || !inputValue.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs shadow-sm transition disabled:opacity-40 hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
