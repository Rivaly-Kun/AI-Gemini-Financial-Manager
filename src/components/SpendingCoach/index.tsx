import { useState } from "react";
import { useSpendingCoach } from "./useSpendingCoach";
import { ReportModal } from "./ReportModal";
import { CoachWidgetBody } from "./CoachWidgetBody";

type SpendingCoachProps = { uid: string };
type ViewMode = "minimized" | "normal" | "expanded";

export function SpendingCoach({ uid }: SpendingCoachProps) {
  const coach = useSpendingCoach(uid);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");

  // ─── MINIMIZED ───
  if (viewMode === "minimized") {
    return (
      <button
        onClick={() => setViewMode("normal")}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
      >
        <span className="text-lg">💬</span>
        <span>Coach</span>
        {coach.merged.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
            {coach.merged.length}
          </span>
        )}
      </button>
    );
  }

  const isExpanded = viewMode === "expanded";
  const widthClass = isExpanded ? "w-[480px]" : "w-80";
  const chatHeight = isExpanded ? "max-h-[400px]" : "max-h-40";

  return (
    <>
      {/* Report Modal */}
      {coach.showReport && (
        <ReportModal
          merged={coach.merged}
          income={coach.income}
          expenses={coach.expenses}
          net={coach.net}
          getSortedReport={coach.getSortedReport}
          toggleSort={coach.toggleSort}
          sortArrow={coach.sortArrow}
          exportCSV={coach.exportCSV}
          onClose={() => coach.setShowReport(false)}
        />
      )}

      {/* Coach Widget */}
      <div className={`fixed bottom-6 right-6 ${widthClass} max-w-[calc(100%-3rem)] z-50 transition-all duration-300 ease-in-out`}>
        <div
          className="rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                <span className="text-white text-xs">💬</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Spending Coach</p>
                <h3 className="text-sm font-bold text-slate-900">Finance Assistant</h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
              <button
                onClick={() => setViewMode(isExpanded ? "normal" : "expanded")}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title={isExpanded ? "Shrink" : "Expand"}
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.71 3.29 3.29 4.71l3 3L4 10h6V4L7.71 6.29zm11.58 3L14 4v6h6l-2.29-2.29 3-3-1.42-1.42zM20 14h-6v6l2.29-2.29 3 3 1.42-1.42-3-3zM6.29 16.29l-3 3 1.42 1.42 3-3L10 20v-6H4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m15.71 14.29-1.42 1.42 3 3L15 21h6v-6l-2.29 2.29zM8.29 9.71l1.42-1.42-3-3L9 3H3v6l2.29-2.29zm9-4.42-3 3 1.42 1.42 3-3L21 9V3h-6zM6.71 18.71l3-3-1.42-1.42-3 3L3 15v6h6z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setViewMode("minimized")}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Minimize"
              >
                ⌄
              </button>
            </div>
          </div>

          {/* Body */}
          <CoachWidgetBody
            messages={coach.messages}
            isSending={coach.isSending}
            coachInsight={coach.coachInsight}
            inputValue={coach.inputValue}
            showPalette={coach.showPalette}
            filteredCmds={coach.filteredCmds}
            chatHeight={chatHeight}
            onInputChange={coach.handleInputChange}
            onSend={coach.handleSend}
            onSlashCommand={coach.handleSlashCommand}
            chatEndRef={coach.chatEndRef}
            inputRef={coach.inputRef}
          />
        </div>
      </div>
    </>
  );
}
