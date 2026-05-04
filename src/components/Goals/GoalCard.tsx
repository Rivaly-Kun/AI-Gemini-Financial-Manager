import type { Goal } from "../../types";
import { getTimeRemaining } from "../../utils/formatters";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

type GoalCardProps = {
  goal: Goal;
  onContribute: (goal: Goal, amount: number) => void;
  getMotivationalMessage: (percentage: number, goal: Goal) => string;
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

export function GoalCard({
  goal,
  onContribute,
  getMotivationalMessage,
}: GoalCardProps) {
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const isCompleted = percentage >= 100;

  return (
    <Card
      className={`p-6 ${isCompleted ? "border-green-500 border-2" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{goal.name}</h3>
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
            <p className="text-xs text-blue-800 mb-1">Monthly Contribution</p>
            <p className="font-semibold text-blue-900">
              ₱{goal.monthlyContribution.toLocaleString()}
            </p>
          </div>
        )}

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
              onClick={() => onContribute(goal, 1000)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              +₱1,000
            </Button>
            <Button
              onClick={() => onContribute(goal, 5000)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              +₱5,000
            </Button>
            <Button
              onClick={() => onContribute(goal, goal.monthlyContribution)}
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
}
