import { useEffect, useState, type ReactNode } from "react";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import Transactions from "./components/Transactions";
import { Budgets } from "./components/Budgets";
import { Investments } from "./components/Investments";
import { Bills } from "./components/Bills";
import { Goals } from "./components/Goals";
import { AIChat } from "./components/AIChat";
import { SpendingCoach } from "./components/SpendingCoach";
import Login from "./components/Login";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

const tabs = (uid: string): Record<string, ReactNode> => ({
  dashboard: <Dashboard uid={uid} />,
  transactions: <Transactions uid={uid} />,
  budgets: <Budgets uid={uid} />,
  investments: <Investments uid={uid} />,
  bills: <Bills uid={uid} />,
  goals: <Goals uid={uid} />,
  "ai-chat": <AIChat uid={uid} />,
});

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-slate-500">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs">Coming soon.</p>
    </div>
  );
}

function App() {
  const [active, setActive] = useState<string>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setActive("dashboard");
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full items-start gap-6 px-6 py-8 lg:px-10">
        <Sidebar
          active={active}
          onSelect={setActive}
          userName={user.displayName}
          userEmail={user.email}
          userInitials={user.displayName
            ?.split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
          onLogout={handleLogout}
        />
        <main className="flex-1 space-y-8">
          {tabs(user.uid)[active] ?? <Placeholder title="Soon" />}
        </main>
      </div>
      <SpendingCoach uid={user.uid} />
    </div>
  );
}

export default App;
