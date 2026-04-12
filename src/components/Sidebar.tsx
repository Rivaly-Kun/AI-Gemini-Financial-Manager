const navItems = [
  { key: "dashboard", label: "Dashboard", icon: "💠" },
  { key: "transactions", label: "Transactions", icon: "🔄" },
  { key: "budgets", label: "Budgets", icon: "🧭" },
  { key: "investments", label: "Investments", icon: "📈" },
  { key: "bills", label: "Bills", icon: "🧾" },
  { key: "goals", label: "Goals", icon: "🎯" },
  { key: "ai-chat", label: "AI Chat", icon: "💬" },
];

type SidebarProps = {
  active: string;
  onSelect: (key: string) => void;
  userName?: string | null;
  userEmail?: string | null;
  userInitials?: string;
  onLogout: () => void;
};

export default function Sidebar({
  active,
  onSelect,
  userName,
  userEmail,
  userInitials,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white/80 px-6 py-8 lg:sticky lg:top-8 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:gap-8 lg:overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          FB
        </div>
        <div>
          <div>FinBuddy</div>
          <p className="text-xs font-medium text-slate-500">
            AI Financial Assistant
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active === item.key
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                active === item.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
              aria-hidden
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            {userInitials ?? "JD"}
          </div>
          <div>
            <div>{userName ?? "User"}</div>
            <p className="text-xs font-medium text-slate-500">
              {userEmail ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
