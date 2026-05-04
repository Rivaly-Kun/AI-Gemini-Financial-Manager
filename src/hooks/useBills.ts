import { useEffect, useState } from "react";
import { onValue, push, ref, update } from "firebase/database";
import { database } from "../utils/firebase";
import type { Bill } from "../types";

export function useBills(uid: string) {
  const userPath = `users/${uid}`;
  const [bills, setBills] = useState<Bill[]>([]);

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

      // Auto-mark overdue
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

  const addBill = async (bill: Bill) => {
    await push(ref(database, `${userPath}/bills`), bill);
  };

  const payBill = async (bill: Bill) => {
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

  return {
    bills,
    pendingBills,
    overdueBills,
    paidBills,
    totalPending,
    totalOverdue,
    totalPaid,
    addBill,
    payBill,
  };
}
