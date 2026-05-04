import { Badge } from "../ui/badge";
import { getDaysUntilDue } from "../../utils/formatters";

type BillStatusBadgeProps = {
  status: string;
  dueDate: string;
};

export function BillStatusBadge({ status, dueDate }: BillStatusBadgeProps) {
  if (status === "paid") {
    return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
  }
  if (status === "overdue") {
    return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
  }
  const daysUntil = getDaysUntilDue(dueDate);
  if (daysUntil <= 3) {
    return <Badge className="bg-orange-100 text-orange-700">Due Soon</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-700">Pending</Badge>;
}
