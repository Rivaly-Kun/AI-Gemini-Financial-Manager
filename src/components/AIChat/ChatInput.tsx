import type { ChangeEvent } from "react";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Send,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type ChatInputProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isTyping: boolean;
  showQuickActions: boolean;
  onQuickAction: (label: string) => void;
};

const quickActions = [
  { label: "Analyze my spending", icon: TrendingUp },
  { label: "Budget recommendations", icon: DollarSign },
  { label: "Investment advice", icon: Sparkles },
  { label: "Bill reminders", icon: AlertCircle },
];

export function ChatInput({
  inputValue,
  onInputChange,
  onSend,
  isTyping,
  showQuickActions,
  onQuickAction,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <>
      {/* Quick Actions */}
      {showQuickActions && (
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
                  onClick={() => onQuickAction(action.label)}
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
              onInputChange(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={onSend}
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
    </>
  );
}
