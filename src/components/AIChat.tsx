import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { get, push, ref, onValue, set, update } from "firebase/database";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { database } from "../utils/firebase";
import { googleAiApiKey } from "../utils/ai";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI financial assistant powered by Gemini 2.5 Flash Lite. I can help you with budgeting advice, investment suggestions, expense analysis, and answer any financial questions you have. How can I assist you today?",
  timestamp: Date.now(),
};

type Transaction = {
  name?: string;
  title?: string;
  category?: string;
  date?: string;
  amount?: number;
  type?: "income" | "expense";
  paymentMethod?: string;
};

type Budget = {
  category?: string;
  budget?: number;
  spent?: number;
};

type Bill = {
  name?: string;
  dueDate?: string;
  amount?: number;
  status?: "paid" | "pending" | "overdue";
};

type Goal = {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
};

type Investment = {
  name?: string;
  type?: string;
  amount?: number;
  currentValue?: number;
  risk?: "low" | "medium" | "high";
};

type AIChatProps = {
  uid: string;
};

export function AIChat({ uid }: AIChatProps) {
  const userPath = `users/${uid}`;
  const sessionsPath = `${userPath}/aiChat/sessions`;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const sessionsRef = ref(database, sessionsPath);

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (!snapshot.exists()) {
        const newSessionRef = push(sessionsRef);
        const now = Date.now();
        void set(newSessionRef, {
          title: "New chat",
          createdAt: now,
          updatedAt: now,
        });
        setActiveSessionId(newSessionRef.key);
        return;
      }

      const data = snapshot.val() as Record<
        string,
        { title: string; createdAt: number; updatedAt: number }
      >;

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          title: value.title,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      setSessions(loaded);
      if (!activeSessionId && loaded.length > 0) {
        setActiveSessionId(loaded[0].id);
      }
    });

    return () => unsubscribe();
  }, [sessionsPath, activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) return;

    const messagesRef = ref(
      database,
      `${sessionsPath}/${activeSessionId}/messages`,
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        const welcomeRef = push(messagesRef);
        void set(welcomeRef, {
          role: welcomeMessage.role,
          content: welcomeMessage.content,
          timestamp: welcomeMessage.timestamp,
        });
        return;
      }

      const data = snapshot.val() as Record<
        string,
        { role: "user" | "assistant"; content: string; timestamp: number }
      >;

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          role: value.role,
          content: value.content,
          timestamp: value.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(loaded);
    });

    return () => unsubscribe();
  }, [activeSessionId, sessionsPath]);

  const createNewSession = async () => {
    const sessionsRef = ref(database, sessionsPath);
    const newSessionRef = push(sessionsRef);
    const now = Date.now();
    await set(newSessionRef, {
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    });
    setActiveSessionId(newSessionRef.key);
  };

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
      (txSnap.val() as Record<string, Transaction> | null) ?? {},
    );
    const budgets = Object.values(
      (budgetsSnap.val() as Record<string, Budget> | null) ?? {},
    );
    const bills = Object.values(
      (billsSnap.val() as Record<string, Bill> | null) ?? {},
    );
    const goals = Object.values(
      (goalsSnap.val() as Record<string, Goal> | null) ?? {},
    );
    const investments = Object.values(
      (investmentsSnap.val() as Record<string, Investment> | null) ?? {},
    );

    const income = transactions
      .filter((t) => (t.amount ?? 0) > 0)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const expenses = transactions
      .filter((t) => (t.amount ?? 0) < 0)
      .reduce((sum, t) => sum + Math.abs  (t.amount ?? 0), 0);
    const net = income - expenses;

    const pendingBills = bills.filter((b) => b.status !== "paid");
    const pendingTotal = pendingBills.reduce(
      (sum, b) => sum + (b.amount ?? 0),
      0,
    );

    const totalInvested = investments.reduce(
      (sum, i) => sum + (i.amount ?? 0),
      0,
    );
    const currentValue = investments.reduce(
      (sum, i) => sum + (i.currentValue ?? i.amount ?? 0),
      0,
    );
    const returnsPct =
      totalInvested > 0
        ? ((currentValue - totalInvested) / totalInvested) * 100
        : 0;

    const totalGoalTarget = goals.reduce(
      (sum, g) => sum + (g.targetAmount ?? 0),
      0,
    );
    const totalGoalCurrent = goals.reduce(
      (sum, g) => sum + (g.currentAmount ?? 0),
      0,
    );
    const goalProgress =
      totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

    const recentTransactions = [...transactions]
      .filter((t) => t.date)
      .sort(
        (a, b) =>
          new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime(),
      )
      .slice(0, 6)
      .map(
        (t) =>
          `${t.date}: ${t.name ?? t.title ?? "Transaction"} (${t.category ?? "Uncategorized"}) ${t.amount ?? 0}`,
      );

    const budgetSummary = budgets.map(
      (b) =>
        `${b.category ?? "Uncategorized"}: budget ${b.budget ?? 0}, spent ${b.spent ?? 0}`,
    );

    const billSummary = pendingBills
      .slice(0, 5)
      .map(
        (b) =>
          `${b.name ?? "Bill"} - ${b.amount ?? 0} due ${b.dueDate ?? ""} (${b.status ?? "pending"})`,
      );

    const goalSummary = goals.map(
      (g) =>
        `${g.name ?? "Goal"}: ${g.currentAmount ?? 0}/${g.targetAmount ?? 0} by ${g.deadline ?? ""}`,
    );

    const investmentSummary = investments.map(
      (i) =>
        `${i.name ?? i.type ?? "Investment"}: invested ${i.amount ?? 0}, current ${i.currentValue ?? i.amount ?? 0}, risk ${i.risk ?? "unknown"}`,
    );

    return {
      totals: { income, expenses, net, pendingBills: pendingTotal },
      portfolio: { totalInvested, currentValue, returnsPct },
      goals: { totalGoalTarget, totalGoalCurrent, goalProgress },
      recentTransactions,
      budgetSummary,
      billSummary,
      goalSummary,
      investmentSummary,
    };
  };

  const formatPeso = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);

  const requestAIResponse = async (userMessage: string) => {
    if (!googleAiApiKey) {
      return "Missing VITE_GOOGLE_AI_API_KEY. Add it to your .env file, restart the dev server, and try again.";
    }

    const context = await loadFinanceContext();
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a financial assistant. Use the following realtime database summary to answer the user's question. Be concise and actionable. All currency is in Philippine Peso (PHP).\n\nSummary:\n- Income: ${formatPeso(context.totals.income)}\n- Expenses: ${formatPeso(context.totals.expenses)}\n- Net: ${formatPeso(context.totals.net)}\n- Pending bills total: ${formatPeso(context.totals.pendingBills)}\n- Portfolio: invested ${formatPeso(context.portfolio.totalInvested)}, current ${formatPeso(context.portfolio.currentValue)}, returns ${context.portfolio.returnsPct.toFixed(2)}%\n- Goals: ${formatPeso(context.goals.totalGoalCurrent)}/${formatPeso(context.goals.totalGoalTarget)} (${context.goals.goalProgress.toFixed(1)}%)\n- Recent transactions: ${context.recentTransactions.join(" | ") || "None"}\n- Budgets: ${context.budgetSummary.join(" | ") || "None"}\n- Bills due: ${context.billSummary.join(" | ") || "None"}\n- Goals: ${context.goalSummary.join(" | ") || "None"}\n- Investments: ${context.investmentSummary.join(" | ") || "None"}\n\nUser question: ${userMessage}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
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
      return `AI request failed (${response.status}). Check your API key and quota.`;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "I couldn't generate a response. Please try again."
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!activeSessionId) return;

    // Add user message
    const messagesPath = `${sessionsPath}/${activeSessionId}/messages`;
    const userMessageRef = push(ref(database, messagesPath));
    const userMessageId = userMessageRef.key ?? `${Date.now()}-user`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    await set(userMessageRef, {
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.timestamp,
    });

    const activeSession = sessions.find(
      (session) => session.id === activeSessionId,
    );
    const shouldUpdateTitle = activeSession?.title === "New chat";
    const nextTitle = shouldUpdateTitle
      ? userMessage.content.split(" ").slice(0, 6).join(" ")
      : (activeSession?.title ?? "New chat");

    await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
      title: nextTitle,
      updatedAt: Date.now(),
    });

    try {
      const responseText = await requestAIResponse(userMessage.content);
      const aiMessageRef = push(ref(database, messagesPath));
      const aiMessageId = aiMessageRef.key ?? `${Date.now()}-assistant`;
      const aiResponse: Message = {
        id: aiMessageId,
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      await set(aiMessageRef, {
        role: aiResponse.role,
        content: aiResponse.content,
        timestamp: aiResponse.timestamp,
      });
      await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
        updatedAt: Date.now(),
      });
    } catch {
      const aiMessageRef = push(ref(database, messagesPath));
      const aiMessageId = aiMessageRef.key ?? `${Date.now()}-assistant`;
      const aiResponse: Message = {
        id: aiMessageId,
        role: "assistant",
        content:
          "Sorry, I hit an error while analyzing your data. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      await set(aiMessageRef, {
        role: aiResponse.role,
        content: aiResponse.content,
        timestamp: aiResponse.timestamp,
      });
      await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
        updatedAt: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: "Analyze my spending", icon: TrendingUp },
    { label: "Budget recommendations", icon: DollarSign },
    { label: "Investment advice", icon: Sparkles },
    { label: "Bill reminders", icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Financial Assistant
          </h1>
          <p className="text-gray-500 mt-1">Powered by Gemini 2.5 Flash Lite</p>
        </div>
      </div>

      {/* Chat Container */}
      <Card
        className="flex-1 flex min-h-0"
        style={{ height: "calc(100vh - 280px)" }}
      >
        <div className="w-56 border-r bg-slate-50/80 flex flex-col">
          <div className="p-4 border-b">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={createNewSession}
            >
              New chat
            </Button>
          </div>
          <div className="px-4 pt-3 text-xs font-semibold text-slate-500">
            History
          </div>
          <ScrollArea className="flex-1 px-3 pb-3">
            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                    session.id === activeSessionId
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="truncate font-semibold">{session.title}</div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {new Date(session.updatedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-600"
                        : "bg-gradient-to-br from-blue-500 to-purple-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="text-white" size={20} />
                    ) : (
                      <Bot className="text-white" size={20} />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 prose prose-sm max-w-none prose-blue"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {new Date(message.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="text-white" size={20} />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputValue(action.label)}
                      className="justify-start"
                    >
                      <Icon size={16} className="mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your finances..."
                value={inputValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setInputValue(e.target.value)
                }
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send size={20} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 This chat analyzes your Realtime Database data in context.
            </p>
          </div>
        </div>
      </Card>

  
    </div>
  );
}
