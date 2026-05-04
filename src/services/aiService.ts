import { get, ref } from "firebase/database";
import { database } from "../utils/firebase";
import { googleAiApiKey } from "../utils/ai";
import { formatPeso } from "../utils/formatters";

type FinanceContext = {
  totals: {
    income: number;
    expenses: number;
    net: number;
    pendingBills: number;
  };
  portfolio: {
    totalInvested: number;
    currentValue: number;
    returnsPct: number;
  };
  goals: {
    totalGoalTarget: number;
    totalGoalCurrent: number;
    goalProgress: number;
  };
  recentTransactions: string[];
  budgetSummary: string[];
  billSummary: string[];
  goalSummary: string[];
  investmentSummary: string[];
};

type RawTransaction = {
  name?: string;
  title?: string;
  category?: string;
  date?: string;
  amount?: number;
  type?: "income" | "expense";
  paymentMethod?: string;
};
type RawBudget = { category?: string; budget?: number; spent?: number };
type RawBill = {
  name?: string;
  dueDate?: string;
  amount?: number;
  status?: string;
};
type RawGoal = {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
};
type RawInvestment = {
  name?: string;
  type?: string;
  amount?: number;
  currentValue?: number;
  risk?: string;
};

/** Load the user's full financial context from Firebase for AI prompts. */
export async function loadFinanceContext(
  userPath: string,
): Promise<FinanceContext> {
  const [txSnap, budgetsSnap, billsSnap, goalsSnap, investmentsSnap] =
    await Promise.all([
      get(ref(database, `${userPath}/transactions`)),
      get(ref(database, `${userPath}/budgets`)),
      get(ref(database, `${userPath}/bills`)),
      get(ref(database, `${userPath}/goals`)),
      get(ref(database, `${userPath}/investments/holdings`)),
    ]);

  const transactions = Object.values(
    (txSnap.val() as Record<string, RawTransaction> | null) ?? {},
  );
  const budgets = Object.values(
    (budgetsSnap.val() as Record<string, RawBudget> | null) ?? {},
  );
  const bills = Object.values(
    (billsSnap.val() as Record<string, RawBill> | null) ?? {},
  );
  const goals = Object.values(
    (goalsSnap.val() as Record<string, RawGoal> | null) ?? {},
  );
  const investments = Object.values(
    (investmentsSnap.val() as Record<string, RawInvestment> | null) ?? {},
  );

  const income = transactions
    .filter((t) => (t.amount ?? 0) > 0)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const expenses = transactions
    .filter((t) => (t.amount ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);
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
}

/** Send a user message to Gemini with the financial context. */
export async function requestAIResponse(
  userMessage: string,
  userPath: string,
): Promise<string> {
  if (!googleAiApiKey) {
    return "Missing VITE_GOOGLE_AI_API_KEY. Add it to your .env file, restart the dev server, and try again.";
  }

  const context = await loadFinanceContext(userPath);
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
}
