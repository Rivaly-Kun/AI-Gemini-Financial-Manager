import { useEffect, useState, type ChangeEvent } from "react";
import { onValue, push, ref, update } from "firebase/database";
import {
  Plus,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { database } from "../utils/firebase";

type Bill = {
  id?: number;
  key?: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  category: string;
  recurring: boolean;
  paymentMethod?: string;
};

type BillsProps = {
  uid: string;
};

export function Bills({ uid }: BillsProps) {
  const userPath = `users/${uid}`;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
    recurring: false,
  });

  useEffect(() => {
    const billsRef = ref(database, `${userPath}/bills`);
    const unsubscribe = onValue(billsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Bill> | null;
      if (!data) {
        setBills([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setBills(items);

      // Auto-mark overdue if due date has passed and not paid
      items.forEach((bill) => {
        if (!bill.key || bill.status === "paid") return;
        const due = new Date(bill.dueDate);
        const now = new Date();
        if (Number.isNaN(due.getTime())) return;
        if (due < now && bill.status !== "overdue") {
          void update(ref(database, `${userPath}/bills/${bill.key}`), {
            status: "overdue",
          });
        }
      });
    });

    return () => unsubscribe();
  }, [userPath]);

  const handleAddBill = async () => {
    if (
      !newBill.name ||
      !newBill.amount ||
      !newBill.dueDate ||
      !newBill.category
    ) {
      return;
    }

    const bill: Bill = {
      id: Date.now(),
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      dueDate: newBill.dueDate,
      status: "pending",
      category: newBill.category,
      recurring: newBill.recurring,
    };

    setIsSubmitting(true);
    try {
      await push(ref(database, `${userPath}/bills`), bill);
    } finally {
      setIsSubmitting(false);
    }

    setIsAddDialogOpen(false);
    setNewBill({
      name: "",
      amount: "",
      dueDate: "",
      category: "",
      recurring: false,
    });
  };

  const handlePayBill = async (bill: Bill) => {
    if (!bill.key) return;
    const paymentMethod = bill.paymentMethod ?? "GCash";
    await update(ref(database, `${userPath}/bills/${bill.key}`), {
      status: "paid",
      paymentMethod,
    });

    const transaction = {
      name: bill.name,
      category: bill.category,
      date: new Date().toISOString().split("T")[0],
      amount: -Math.abs(bill.amount),
      type: "expense",
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      push(ref(database, `${userPath}/transactions`), transaction),
      push(ref(database, `${userPath}/dashboard/transactions`), transaction),
    ]);

    if (bill.recurring) {
      const currentDue = new Date(bill.dueDate);
      if (!Number.isNaN(currentDue.getTime())) {
        const nextDue = new Date(currentDue);
        nextDue.setMonth(nextDue.getMonth() + 1);
        const nextBill: Bill = {
          id: Date.now(),
          name: bill.name,
          amount: bill.amount,
          dueDate: nextDue.toISOString().split("T")[0],
          status: "pending",
          category: bill.category,
          recurring: true,
        };
        await push(ref(database, `${userPath}/bills`), nextBill);
      }
    }
  };

  const pendingBills = bills.filter((b) => b.status === "pending");
  const overdueBills = bills.filter((b) => b.status === "overdue");
  const paidBills = bills.filter((b) => b.status === "paid");

  const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, dueDate: string) => {
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
  };

  const BillCard = ({ bill }: { bill: Bill }) => {
    const daysUntil = getDaysUntilDue(bill.dueDate);
    return (
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{bill.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{bill.category}</p>
          </div>
          {getStatusBadge(bill.status, bill.dueDate)}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              ₱
              {bill.amount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
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
              onClick={() => handlePayBill(bill)}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
            >
              Pay Now
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-500 mt-1">
            Track and manage your bill payments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={20} className="mr-2" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="billName">Bill Name</Label>
                <Input
                  id="billName"
                  placeholder="e.g., Electric Bill"
                  value={newBill.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBill({ ...newBill, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newBill.amount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBill({ ...newBill, amount: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBill({ ...newBill, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newBill.category}
                  onValueChange={(value: string) =>
                    setNewBill({ ...newBill, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Subscription">Subscription</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Loan">Loan</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newBill.recurring}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBill({ ...newBill, recurring: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Recurring bill
                </Label>
              </div>
              <Button
                onClick={handleAddBill}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Add Bill"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Bills</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ₱
                {totalPending.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
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
                ₱
                {totalOverdue.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
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
                ₱
                {totalPaid.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Bills List */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingBills.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueBills.length})
          </TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBills.map((bill) => (
              <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          {overdueBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueBills.map((bill) => (
                <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900">
                No Overdue Bills
              </h3>
              <p className="text-gray-500 mt-2">
                Great job! All your bills are up to date.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidBills.map((bill) => (
              <BillCard key={bill.key ?? bill.id ?? bill.name} bill={bill} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upcoming Reminders */}
      {pendingBills.filter((b) => getDaysUntilDue(b.dueDate) <= 7).length >
        0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Bell className="text-blue-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Upcoming Bill Reminders
              </h3>
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
