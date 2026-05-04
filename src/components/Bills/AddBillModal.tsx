import { useState, type ChangeEvent } from "react";
import { Plus } from "lucide-react";
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
import type { Bill } from "../../types";

type AddBillModalProps = {
  onAdd: (bill: Bill) => Promise<void>;
};

export function AddBillModal({ onAdd }: AddBillModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    dueDate: "",
    category: "",
    recurring: false,
  });

  const handleAddBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate || !newBill.category) return;

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
      await onAdd(bill);
    } finally {
      setIsSubmitting(false);
    }

    setIsOpen(false);
    setNewBill({ name: "", amount: "", dueDate: "", category: "", recurring: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
  );
}
