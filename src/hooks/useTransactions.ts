import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref } from "firebase/database";
import { database } from "../utils/firebase";
import type { Transaction } from "../types";

export function useTransactions(uid: string) {
  const userPath = `users/${uid}`;
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const transactionsRef = ref(database, `${userPath}/transactions`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Transaction> | null;
      if (!data) {
        setTransactions([]);
        return;
      }
      const items = Object.entries(data).map(([key, value]) => ({
        ...value,
        key,
        id: value.id ?? Date.now(),
      }));
      setTransactions(items);
    });

    return () => unsubscribe();
  }, [userPath]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  const addTransaction = async (entry: Transaction) => {
    await push(ref(database, `${userPath}/transactions`), entry);
  };

  return { transactions, totals, addTransaction };
}
