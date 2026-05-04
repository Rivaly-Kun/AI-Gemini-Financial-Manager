import { useEffect, useState } from "react";
import { onValue, push, ref, update } from "firebase/database";
import { database } from "../utils/firebase";
import type { Goal } from "../types";

export function useGoals(uid: string) {
  const userPath = `users/${uid}`;
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const goalsRef = ref(database, `${userPath}/goals`);
    const unsubscribe = onValue(goalsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Goal> | null;
      if (!data) {
        setGoals([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setGoals(items);
    });

    return () => unsubscribe();
  }, [userPath]);

  const addGoal = async (goal: Goal) => {
    await push(ref(database, `${userPath}/goals`), goal);
  };

  const addContribution = async (goal: Goal, amount: number) => {
    if (!goal.key || amount <= 0) return;
    const nextAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    await update(ref(database, `${userPath}/goals/${goal.key}`), {
      currentAmount: nextAmount,
    });

    const transaction = {
      name: `${goal.name} Contribution`,
      category: goal.category,
      date: new Date().toISOString().split("T")[0],
      amount: -Math.abs(amount),
      type: "expense" as const,
      paymentMethod: "Goal Transfer",
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      push(ref(database, `${userPath}/transactions`), transaction),
      push(ref(database, `${userPath}/dashboard/transactions`), transaction),
    ]);
  };

  const getMotivationalMessage = (percentage: number, goal: Goal): string => {
    if (percentage >= 100) {
      return "🎉 Congratulations! You've reached your goal!";
    } else if (percentage >= 75) {
      return `You're almost there! Just ₱${(goal.targetAmount - goal.currentAmount).toLocaleString()} more to go!`;
    } else if (percentage >= 50) {
      return "Great progress! You're halfway to your goal. Keep it up!";
    } else if (percentage >= 25) {
      return "Good start! Stay consistent with your contributions.";
    } else {
      return "Every journey begins with a single step. You've got this!";
    }
  };

  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalProgress =
    totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
  const completedGoals = goals.filter(
    (g) => (g.currentAmount / g.targetAmount) * 100 >= 100,
  ).length;

  return {
    goals,
    totalTargetAmount,
    totalCurrentAmount,
    totalProgress,
    completedGoals,
    addGoal,
    addContribution,
    getMotivationalMessage,
  };
}
