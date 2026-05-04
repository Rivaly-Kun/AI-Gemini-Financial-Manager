import type { CoachMessage } from "../../types";
import type { SlashCmd } from "../../types";

type CoachWidgetBodyProps = {
  messages: CoachMessage[];
  isSending: boolean;
  coachInsight: string;
  inputValue: string;
  showPalette: boolean;
  filteredCmds: SlashCmd[];
  chatHeight: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onSlashCommand: (cmd: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const renderContent = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
};

export function CoachWidgetBody({
  messages,
  isSending,
  coachInsight,
  inputValue,
  showPalette,
  filteredCmds,
  chatHeight,
  onInputChange,
  onSend,
  onSlashCommand,
  chatEndRef,
  inputRef,
}: CoachWidgetBodyProps) {
  return (
    <div className="p-3 space-y-2">
      {/* Insight Banner */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-xs text-slate-600 leading-relaxed">
        {coachInsight}
      </div>

      {/* Chat Messages */}
      <div className={`space-y-2 ${chatHeight} overflow-y-auto pr-1 no-scrollbar transition-all duration-300`}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
              m.role === "assistant"
                ? "bg-slate-50 text-slate-700 border border-slate-100"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-6"
            }`}
          >
            {renderContent(m.content)}
          </div>
        ))}
        {isSending && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-400">
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Slash Command Palette */}
      {showPalette && filteredCmds.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {filteredCmds.map((c) => (
            <button
              key={c.cmd}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-blue-50 border-b border-slate-50 last:border-0"
              onClick={() => onSlashCommand(c.cmd)}
            >
              <span className="text-sm">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-900">{c.cmd}</span>
                <span className="ml-1 text-slate-400">— {c.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onSend(); }
              if (e.key === "Escape") onSlashCommand("");
            }}
            placeholder="Type / for commands..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={onSend}
          disabled={isSending || !inputValue.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs shadow-sm transition disabled:opacity-40 hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
