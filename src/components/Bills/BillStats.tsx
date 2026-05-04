import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";

type BillStatsProps = {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
};

export function BillStats({ totalPending, totalOverdue, totalPaid }: BillStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-full">
            <Clock className="text-orange-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending Bills</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ₱{totalPending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overdue Bills</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              ₱{totalOverdue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
            <p className="text-sm text-gray-500">Paid This Month</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">
              ₱{totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </Card>
    </div>
  );
}
