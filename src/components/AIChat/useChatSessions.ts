import { useState, useRef, useEffect } from "react";
import { push, ref, onValue, set, update } from "firebase/database";
import { database } from "../../utils/firebase";
import { requestAIResponse } from "../../services/aiService";
import type { Message, ChatSession } from "../../types";

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI financial assistant powered by Gemini 2.5 Flash Lite. I can help you with budgeting advice, investment suggestions, expense analysis, and answer any financial questions you have. How can I assist you today?",
  timestamp: Date.now(),
};

export function useChatSessions(uid: string) {
  const userPath = `users/${uid}`;
  const sessionsPath = `${userPath}/aiChat/sessions`;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for sessions
  useEffect(() => {
    const sessionsRef = ref(database, sessionsPath);

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (!snapshot.exists()) {
        const newSessionRef = push(sessionsRef);
        const now = Date.now();
        void set(newSessionRef, {
          title: "New chat",
          createdAt: now,
          updatedAt: now,
        });
        setActiveSessionId(newSessionRef.key);
        return;
      }

      const data = snapshot.val() as Record<
        string,
        { title: string; createdAt: number; updatedAt: number }
      >;

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          title: value.title,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      setSessions(loaded);
      if (!activeSessionId && loaded.length > 0) {
        setActiveSessionId(loaded[0].id);
      }
    });

    return () => unsubscribe();
  }, [sessionsPath, activeSessionId]);

  // Listen for messages of active session
  useEffect(() => {
    if (!activeSessionId) return;

    const messagesRef = ref(
      database,
      `${sessionsPath}/${activeSessionId}/messages`,
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        const welcomeRef = push(messagesRef);
        void set(welcomeRef, {
          role: welcomeMessage.role,
          content: welcomeMessage.content,
          timestamp: welcomeMessage.timestamp,
        });
        return;
      }

      const data = snapshot.val() as Record<
        string,
        { role: "user" | "assistant"; content: string; timestamp: number }
      >;

      const loaded = Object.entries(data)
        .map(([id, value]) => ({
          id,
          role: value.role,
          content: value.content,
          timestamp: value.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(loaded);
    });

    return () => unsubscribe();
  }, [activeSessionId, sessionsPath]);

  const createNewSession = async () => {
    const sessionsRef = ref(database, sessionsPath);
    const newSessionRef = push(sessionsRef);
    const now = Date.now();
    await set(newSessionRef, {
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    });
    setActiveSessionId(newSessionRef.key);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!activeSessionId) return;

    const messagesPath = `${sessionsPath}/${activeSessionId}/messages`;
    const userMessageRef = push(ref(database, messagesPath));
    const userMessageId = userMessageRef.key ?? `${Date.now()}-user`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    await set(userMessageRef, {
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.timestamp,
    });

    const activeSession = sessions.find(
      (session) => session.id === activeSessionId,
    );
    const shouldUpdateTitle = activeSession?.title === "New chat";
    const nextTitle = shouldUpdateTitle
      ? userMessage.content.split(" ").slice(0, 6).join(" ")
      : (activeSession?.title ?? "New chat");

    await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
      title: nextTitle,
      updatedAt: Date.now(),
    });

    try {
      const responseText = await requestAIResponse(
        userMessage.content,
        userPath,
      );
      const aiMessageRef = push(ref(database, messagesPath));
      const aiMessageId = aiMessageRef.key ?? `${Date.now()}-assistant`;
      const aiResponse: Message = {
        id: aiMessageId,
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      await set(aiMessageRef, {
        role: aiResponse.role,
        content: aiResponse.content,
        timestamp: aiResponse.timestamp,
      });
      await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
        updatedAt: Date.now(),
      });
    } catch {
      const aiMessageRef = push(ref(database, messagesPath));
      const aiMessageId = aiMessageRef.key ?? `${Date.now()}-assistant`;
      const aiResponse: Message = {
        id: aiMessageId,
        role: "assistant",
        content:
          "Sorry, I hit an error while analyzing your data. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      await set(aiMessageRef, {
        role: aiResponse.role,
        content: aiResponse.content,
        timestamp: aiResponse.timestamp,
      });
      await update(ref(database, `${sessionsPath}/${activeSessionId}`), {
        updatedAt: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  return {
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
  };
}
