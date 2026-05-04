import type { ChatSession } from "../../types";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

type ChatSidebarProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
};

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <div className="w-56 border-r bg-slate-50/80 flex flex-col">
      <div className="p-4 border-b">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={onNewChat}
        >
          New chat
        </Button>
      </div>
      <div className="px-4 pt-3 text-xs font-semibold text-slate-500">
        History
      </div>
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                session.id === activeSessionId
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="truncate font-semibold">{session.title}</div>
              <div className="mt-1 text-[10px] text-slate-400">
                {new Date(session.updatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
