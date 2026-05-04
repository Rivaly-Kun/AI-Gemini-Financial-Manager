import { useState, type ChangeEvent } from "react";
import { useGoals } from "../../hooks/useGoals";
import type { Goal } from "../../types";
import { GoalCard } from "./GoalCard";
import {
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type GoalsProps = {
  uid: string;
};

export function Goals({ uid }: GoalsProps) {
  const {
    goals,
    totalProgress,
    completedGoals,
    addGoal,
    addContribution,
    getMotivationalMessage,
  } = useGoals(uid);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.category || !newGoal.targetAmount || !newGoal.deadline) return;

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
      await addGoal(goal);
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
                <Label htmlFor="monthlyContribution">Monthly Contribution (₱)</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  placeholder="0.00"
                  value={newGoal.monthlyContribution}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewGoal({ ...newGoal, monthlyContribution: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newGoal.priority}
                  onValueChange={(value: string) =>
                    setNewGoal({ ...newGoal, priority: value as "low" | "medium" | "high" })
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
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onContribute={addContribution}
            getMotivationalMessage={getMotivationalMessage}
          />
        ))}
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
