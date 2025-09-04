import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatSession, ChatMessage, ChatContextType } from '@/types/chat';
import { chatApi } from '@/utils/chatApi';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://ai.rosmerta.dev/expense/api/chat/conversations", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch sessions");

        const data = await res.json();

        const apiSessions: ChatSession[] = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          messages: [],
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
        }));

        setSessions(apiSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Create a new chat session
  const createNewSession = async () => {
    try {
      const res = await fetch("https://ai.rosmerta.dev/expense/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  // Load a session and fetch its messages
  const loadSession = async (sessionId: string) => {
  setIsLoading(true);

  try {
    // Fetch session with messages
    const res = await fetch(
      `https://ai.rosmerta.dev/expense/api/chat/conversations/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch conversation");

    const sessionData = await res.json();

    // Map messages to ChatMessage format
    const messages: ChatMessage[] = sessionData.messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
      attachments: m.attachments || [],
    }));

    const loadedSession: ChatSession = {
      id: sessionData.id,
      title: sessionData.title,
      messages,
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at),
    };

    setCurrentSession(loadedSession);

    // Update sessions list if needed
    setSessions(prev =>
      prev.map(s => (s.id === loadedSession.id ? loadedSession : s))
    );

  } catch (error) {
    console.error("Error loading session:", error);
  } finally {
    setIsLoading(false);
  }
};


  // Replace all messages for current session
  const setMessages = (messages: ChatMessage[]) => {
    setCurrentSession(prev => {
      if (!prev) return null;

      const updatedSession = {
        ...prev,
        messages,
        updatedAt: new Date(),
      };

      setSessions(prevSessions =>
        prevSessions.map(s => (s.id === updatedSession.id ? updatedSession : s))
      );

      return updatedSession;
    });
  };

  // Add a new message locally
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setCurrentSession(prev => {
      if (!prev) return null;

      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      const updatedSession: ChatSession = {
        ...prev,
        messages: [...prev.messages, newMessage],
        updatedAt: new Date(),
        title:
          prev.messages.length === 0 && message.role === 'user'
            ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
            : prev.title,
      };

      setSessions(prevSessions =>
        prevSessions.map(s => (s.id === updatedSession.id ? updatedSession : s))
      );

      return updatedSession;
    });
  };

  // Send message via API and update local state
  const sendMessage = async (message: string, file?: File) => {
    if (!currentSession) return;

    addMessage({
      role: "user",
      content: message,
      attachments: file ? [file] : undefined,
    });

    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(message, currentSession.id);

      addMessage({
        role: "assistant",
        content: response.message,
      });
    } catch (error) {
      addMessage({
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        currentSession,
        sessions,
        createNewSession,
        loadSession,
        addMessage,
        setMessages,
        sendMessage,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
