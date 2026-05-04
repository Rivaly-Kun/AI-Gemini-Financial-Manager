import { Calendar, Bell, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { BillStatusBadge } from "./BillStatusBadge";
import { getDaysUntilDue } from "../../utils/formatters";
import type { Bill } from "../../types";

type BillCardProps = {
  bill: Bill;
  onPay: (bill: Bill) => void;
};

export function BillCard({ bill, onPay }: BillCardProps) {
  const daysUntil = getDaysUntilDue(bill.dueDate);
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{bill.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{bill.category}</p>
        </div>
        <BillStatusBadge status={bill.status} dueDate={bill.dueDate} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ₱{bill.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>
            Due:{" "}
            {new Date(bill.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {bill.status === "pending" && daysUntil >= 0 && (
            <span className="text-gray-500">({daysUntil} days left)</span>
          )}
        </div>

        {bill.recurring && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bell size={16} />
            <span>Recurring monthly</span>
          </div>
        )}

        {bill.status === "paid" && bill.paymentMethod && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 size={16} />
            <span>Paid via {bill.paymentMethod}</span>
          </div>
        )}

        {bill.status !== "paid" && (
          <Button
            onClick={() => onPay(bill)}
            className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
          >
            Pay Now
          </Button>
        )}
      </div>
    </Card>
  );
}
