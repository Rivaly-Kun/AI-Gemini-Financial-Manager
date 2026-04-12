import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { database } from "../utils/firebase";
import { googleAiApiKey } from "../utils/ai";

type Transaction = {
  amount?: number;
  date?: string;
  type?: "income" | "expense";
  category?: string;
  createdAt?: string;
};

type CoachMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type SpendingCoachProps = {
  uid: string;
};

export function SpendingCoach({ uid }: SpendingCoachProps) {
  const userPath = `users/${uid}`;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardTransactions, setDashboardTransactions] = useState<
    Transaction[]
  >([]);
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I’ll keep an eye on your cash flow and spending.",
    },
  ]);

  useEffect(() => {
    const txRef = ref(database, `${userPath}/transactions`);
    const dashRef = ref(database, `${userPath}/dashboard/transactions`);
    const unsubscribeTx = onValue(txRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setTransactions([]);
        return;
      }
      setTransactions(Object.values(data));
    });

    const unsubscribeDash = onValue(dashRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setDashboardTransactions([]);
        return;
      }
      setDashboardTransactions(Object.values(data));
    });

    return () => {
      unsubscribeTx();
      unsubscribeDash();
    };
  }, [userPath]);

  const mergedTransactions = useMemo(() => {
    const combined = [...transactions, ...dashboardTransactions];
    const unique = new Map<string, Transaction>();
    combined.forEach((tx) => {
      const key = `${tx.amount ?? 0}|${tx.category ?? ""}|${tx.date ?? ""}|${tx.type ?? ""}|${tx.createdAt ?? ""}`;
      if (!unique.has(key)) {
        unique.set(key, tx);
      }
    });
    return Array.from(unique.values());
  }, [transactions, dashboardTransactions]);

  const coachInsight = useMemo(() => {
    const income = mergedTransactions
      .filter((t) => (t.amount ?? 0) > 0)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const expenses = mergedTransactions
      .filter((t) => (t.amount ?? 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);
    const net = income - expenses;

    const content =
      net < 0
        ? `You’re spending ₱${Math.abs(net).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })} more than you earn. Consider trimming non-essentials or delaying large expenses.`
        : `Your net balance is ₱${net.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
          })}. Keep it up and consider allocating extra to goals or savings.`;

    return content;
  }, [mergedTransactions]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const userMessage: CoachMessage = {
      id: Date.now(),
      role: "user",
      content: inputValue.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    if (!googleAiApiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Missing VITE_GOOGLE_AI_API_KEY. Add it to .env and restart the dev server.",
        },
      ]);
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a short, helpful spending coach. Use this net balance insight: ${coachInsight}. Answer the user's question concisely with actionable tips.\n\nUser: ${userMessage.content}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
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
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "I couldn't generate a response. Try again.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "assistant", content: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Failed to get a response.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 max-w-[calc(100%-3rem)] z-50">
      <Card className="shadow-lg border border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Spending Coach</p>
            <h3 className="text-sm font-semibold text-slate-900">
              Finance Assistant
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
              Live
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? "Hide" : "Open"}
            </Button>
          </div>
        </div>

        {isOpen ? (
          <div className="p-4 space-y-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
              {coachInsight}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    message.role === "assistant"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about spending..."
              />
              <Button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSending}
              >
                {isSending ? "..." : "Send"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
