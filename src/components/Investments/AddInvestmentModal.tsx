import { useState, type ChangeEvent } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { marketSymbols } from "./useInvestmentData";

type AddInvestmentModalProps = {
  onAdd: (data: { name: string; type: string; amount: number; currentValue: number; risk: "low" | "medium" | "high" }) => Promise<void>;
  onSymbolSelect: (symbol: string) => { name: string; type: string; currentValue: string };
  isSubmitting: boolean;
};

export function AddInvestmentModal({ onAdd, onSymbolSelect, isSubmitting }: AddInvestmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Stock", amount: "", currentValue: "", risk: "medium" as "low" | "medium" | "high" });

  const handleSymbol = (symbol: string) => {
    const result = onSymbolSelect(symbol);
    setForm((prev) => ({ ...prev, name: result.name, type: result.type, currentValue: result.currentValue }));
  };

  const handleAdd = async () => {
    if (!form.name || !form.type || !form.amount) return;
    const amountValue = Number(form.amount);
    const currentValue = form.currentValue ? Number(form.currentValue) : amountValue;
    if (!Number.isFinite(amountValue) || amountValue <= 0) return;
    await onAdd({ name: form.name, type: form.type, amount: amountValue, currentValue, risk: form.risk });
    setIsOpen(false);
    setForm({ name: "", type: "Stock", amount: "", currentValue: "", risk: "medium" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <DollarSign size={20} className="mr-2" />Add Investment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Stock Symbol</Label>
            <Select value={form.name} onValueChange={handleSymbol}>
              <SelectTrigger><SelectValue placeholder="Select a stock" /></SelectTrigger>
              <SelectContent>
                {marketSymbols.map((s) => (
                  <SelectItem key={s.symbol} value={s.symbol}>{s.symbol} · {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Input placeholder="Stock" value={form.type} readOnly />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Amount Invested (₱)</Label>
              <Input type="number" placeholder="0.00" value={form.amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Current Value (₱)</Label>
              <Input type="number" placeholder="0.00" value={form.currentValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, currentValue: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Risk Level</Label>
            <Select value={form.risk} onValueChange={(v: string) => setForm({ ...form, risk: v as "low" | "medium" | "high" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Investment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
