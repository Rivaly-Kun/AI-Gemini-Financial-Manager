import { useBills } from "../../hooks/useBills";
import { getDaysUntilDue } from "../../utils/formatters";
import { BillCard } from "./BillCard";
import { AddBillModal } from "./AddBillModal";
import { BillStats } from "./BillStats";
import { Bell, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type BillsProps = { uid: string };

export function Bills({ uid }: BillsProps) {
  const {
    pendingBills,
    overdueBills,
    paidBills,
    totalPending,
    totalOverdue,
    totalPaid,
    addBill,
    payBill,
  } = useBills(uid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-500 mt-1">Track and manage your bill payments</p>
        </div>
        <AddBillModal onAdd={addBill} />
      </div>

      <BillStats totalPending={totalPending} totalOverdue={totalOverdue} totalPaid={totalPaid} />

      {/* Bills List */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
            {pendingBills.map((bill) => (
              <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} onPay={payBill} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          {overdueBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
              {overdueBills.map((bill) => (
                <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} onPay={payBill} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900">No Overdue Bills</h3>
              <p className="text-gray-500 mt-2">Great job! All your bills are up to date.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar pb-4">
            {paidBills.map((bill) => (
              <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} onPay={payBill} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upcoming Reminders */}
      {pendingBills.filter((b) => getDaysUntilDue(b.dueDate) <= 7).length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Bell className="text-blue-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Upcoming Bill Reminders</h3>
              <div className="space-y-2">
                {pendingBills
                  .filter((b) => getDaysUntilDue(b.dueDate) <= 7)
                  .map((bill) => (
                    <p
                      key={bill.key ?? bill.id ?? bill.name}
                      className="text-sm text-blue-800"
                    >
                      • {bill.name} - ₱{bill.amount.toLocaleString()} due in{" "}
                      {getDaysUntilDue(bill.dueDate)} day
                      {getDaysUntilDue(bill.dueDate) !== 1 ? "s" : ""}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
