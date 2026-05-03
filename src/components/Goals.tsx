import { useEffect, useState, type ChangeEvent } from "react";
import { onValue, push, ref, update } from "firebase/database";
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { database } from "../utils/firebase";

type Goal = {
  id?: number;
  key?: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  monthlyContribution: number;
};

type GoalsProps = {
  uid: string;
};

export function Goals({ uid }: GoalsProps) {
  const userPath = `users/${uid}`;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: "",
    category: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    priority: "medium" as "low" | "medium" | "high",
    monthlyContribution: "",
  });

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

  const handleAddGoal = async () => {
    if (
      !newGoal.name ||
      !newGoal.category ||
      !newGoal.targetAmount ||
      !newGoal.deadline
    ) {
      return;
    }

    const goal: Goal = {
      id: Date.now(),
      name: newGoal.name,
      category: newGoal.category,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline,
      priority: newGoal.priority,
      monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0,
    };

    setIsSubmitting(true);
    try {
      await push(ref(database, `${userPath}/goals`), goal);
    } finally {
      setIsSubmitting(false);
    }
    setIsAddDialogOpen(false);
    setNewGoal({
      name: "",
      category: "",
      targetAmount: "",
      currentAmount: "",
      deadline: "",
      priority: "medium",
      monthlyContribution: "",
    });
  };

  const handleAddContribution = async (goal: Goal, amount: number) => {
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-700">High Priority</Badge>;
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            Medium Priority
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-700">Low Priority</Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths > 12) {
      const years = Math.floor(diffMonths / 12);
      return `${years} year${years > 1 ? "s" : ""}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    }
  };

  const getMotivationalMessage = (percentage: number, goal: Goal) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500 mt-1">
            Track your financial goals and stay motivated
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value: string) =>
                    setNewGoal({ ...newGoal, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Debt">Debt Repayment</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount (₱)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="0.00"
                  value={newGoal.targetAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({ ...newGoal, targetAmount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="currentAmount">Current Amount (₱)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  placeholder="0.00"
                  value={newGoal.currentAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({ ...newGoal, currentAmount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="deadline">Target Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({ ...newGoal, deadline: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="monthlyContribution">
                  Monthly Contribution (₱)
                </Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  placeholder="0.00"
                  value={newGoal.monthlyContribution}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({
                      ...newGoal,
                      monthlyContribution: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newGoal.priority}
                  onValueChange={(value: string) =>
                    setNewGoal({
                      ...newGoal,
                      priority: value as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddGoal}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {goals.length}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Goals</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {completedGoals}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overall Progress</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">
                {totalProgress.toFixed(1)}%
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
        {goals.map((goal) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          const isCompleted = percentage >= 100;

          return (
            <Card
              key={goal.id}
              className={`p-6 ${isCompleted ? "border-green-500 border-2" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {goal.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{goal.category}</p>
                </div>
                {getPriorityBadge(goal.priority)}
              </div>

              {isCompleted && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">
                    Goal Completed! 🎉
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₱{goal.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      of ₱{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-3" />
                  <p className="text-xs text-gray-600 mt-1">
                    {percentage.toFixed(1)}% complete
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <DollarSign size={14} />
                      <span>Remaining</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₱{remaining.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar size={14} />
                      <span>Time Left</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {getTimeRemaining(goal.deadline)}
                    </p>
                  </div>
                </div>

                {goal.monthlyContribution > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 mb-1">
                      Monthly Contribution
                    </p>
                    <p className="font-semibold text-blue-900">
                      ₱{goal.monthlyContribution.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Motivational Message */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2">
                    <Sparkles className="text-purple-600 mt-0.5" size={16} />
                    <p className="text-sm text-purple-800">
                      {getMotivationalMessage(percentage, goal)}
                    </p>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContribution(goal, 1000)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      +₱1,000
                    </Button>
                    <Button
                      onClick={() => handleAddContribution(goal, 5000)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      +₱5,000
                    </Button>
                    <Button
                      onClick={() =>
                        handleAddContribution(goal, goal.monthlyContribution)
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      Add Monthly
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-white rounded-full">
            <Sparkles className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              AI Goal Insights
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                • You're on track to complete your Emergency Fund goal 2 months
                ahead of schedule at your current contribution rate.
              </p>
              <p className="text-sm text-gray-700">
                • Consider increasing your New Car contribution to ₱20,000/month
                to reach your goal by the deadline.
              </p>
              <p className="text-sm text-gray-700">
                • Great job prioritizing debt repayment! You'll be debt-free in
                2 months.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
