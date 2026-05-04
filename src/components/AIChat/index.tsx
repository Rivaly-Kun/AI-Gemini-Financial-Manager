import { Bot } from "lucide-react";
import { Card } from "../ui/card";
import { useChatSessions } from "./useChatSessions";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

type AIChatProps = {
  uid: string;
};

export function AIChat({ uid }: AIChatProps) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    inputValue,
    setInputValue,
    isTyping,
    scrollAreaRef,
    createNewSession,
    handleSendMessage,
  } = useChatSessions(uid);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Financial Assistant
          </h1>
          <p className="text-gray-500 mt-1">Powered by Gemini 2.5 Flash Lite</p>
        </div>
      </div>

      {/* Chat Container */}
      <Card
        className="flex-1 flex min-h-0"
        style={{ height: "calc(100vh - 280px)" }}
      >
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewChat={createNewSession}
        />

        <div className="flex-1 flex flex-col">
          <MessageList
            ref={scrollAreaRef}
            messages={messages}
            isTyping={isTyping}
          />

          <ChatInput
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSendMessage}
            isTyping={isTyping}
            showQuickActions={messages.length <= 2}
            onQuickAction={setInputValue}
          />
        </div>
      </Card>
    </div>
  );
}
