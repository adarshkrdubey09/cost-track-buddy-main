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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);

  const API_BASE = "https://ai.rosmerta.dev/expense/api/chat/conversations";
  const TOKEN = localStorage.getItem("access_token");

  // Load all chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(API_BASE, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
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
          hasMore: true,
          cursor: null,
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

  const createNewSession = async (): Promise<ChatSession | null> => {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`,
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
        hasMore: false,
        cursor: null,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setHasMoreMessages(false);
      setMessageCursor(null);

      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  // Load a session and fetch its messages with pagination
  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Reset pagination state
      setHasMoreMessages(true);
      setMessageCursor(null);

      // First get session details
      const sessionRes = await fetch(`${API_BASE}/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`,
        },
      });

      if (!sessionRes.ok) throw new Error("Failed to fetch conversation");

      const sessionData = await sessionRes.json();

      // Then get paginated messages
      const messagesRes = await fetch(
        `${API_BASE}/${sessionId}/messages/scroll?limit=5`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
          },
        }
      );

      if (!messagesRes.ok) throw new Error("Failed to fetch messages");

      const messagesData = await messagesRes.json();

      const messages: ChatMessage[] = (messagesData.messages || [])
        .map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'assistant_thinking',
          content: m.content,
          timestamp: new Date(m.created_at),
          attachments: m.attachments || [],
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const loadedSession: ChatSession = {
        id: sessionData.id,
        title: sessionData.title,
        messages,
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
        hasMore: !!messagesData.next_cursor,
        cursor: messagesData.next_cursor || null,
      };

      setCurrentSession(loadedSession);
      setSessions(prev => prev.map(s => (s.id === loadedSession.id ? loadedSession : s)));
      setHasMoreMessages(!!messagesData.next_cursor);
      setMessageCursor(messagesData.next_cursor || null);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more messages for current session (pagination)
  const loadMoreMessages = async () => {
    if (!currentSession || isLoadingMessages || !hasMoreMessages || !messageCursor) return;

    setIsLoadingMessages(true);
    try {
      const res = await fetch(
        `${API_BASE}/${currentSession.id}/messages/scroll?limit=5&cursor=${messageCursor}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch more messages");

      const data = await res.json();

      const newMessages: ChatMessage[] = (data.messages || [])
        .map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'assistant_thinking',
          content: m.content,
          timestamp: new Date(m.created_at),
          attachments: m.attachments || [],
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Prepend older messages to maintain chronological order
      const updatedMessages = [...newMessages, ...currentSession.messages];

      const updatedSession: ChatSession = {
        ...currentSession,
        messages: updatedMessages,
        hasMore: !!data.next_cursor,
        cursor: data.next_cursor || null,
      };

      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => (s.id === updatedSession.id ? updatedSession : s)));
      setHasMoreMessages(!!data.next_cursor);
      setMessageCursor(data.next_cursor || null);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMessages(false);
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
        hasMore: false,
        cursor: null
      };
      setSessions(prevSessions => prevSessions.map(s => (s.id === updatedSession.id ? updatedSession : s)));
      return updatedSession;
    });
  };

  // Add a new message locally
  const addMessage = (
    message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string }
  ): ChatMessage | null => {
    let newMsg: ChatMessage | null = null;

    setCurrentSession(prev => {
      if (!prev) return null;

      newMsg = {
        ...message,
        id: message.id ?? Date.now().toString(),
        timestamp: new Date(),
      };

      const updatedSession: ChatSession = {
        ...prev,
        messages: [...prev.messages, newMsg],
        updatedAt: new Date(),
      };

      setSessions(prevSessions =>
        prevSessions.map(s => (s.id === updatedSession.id ? updatedSession : s))
      );

      return updatedSession;
    });

    return newMsg;
  };

  const updateMessage = (id: string, updated: Partial<ChatMessage>) => {
    setCurrentSession(prev =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map(m => (m.id === id ? { ...m, ...updated } : m)),
            updatedAt: new Date(),
          }
        : prev
    );
  };

  // Send message via API
  const sendMessage = async (message: string, file?: File) => {
    let session = currentSession;

    // Auto-create session if none exists
    if (!session) {
      session = await createNewSession();
      if (!session) {
        console.error("Failed to create session");
        return;
      }
      setCurrentSession(session);
    }

    // Add user message
    const userMsg = addMessage({
      role: "user",
      content: message,
      attachments: file ? [file] : undefined,
    });

    // Add temporary assistant "thinking" message
    const thinkingMsg = addMessage({ 
      role: "assistant_thinking", 
      content: "__thinking__" 
    });

    try {
      const response = await chatApi.sendMessage(message, session.id);

      // Replace thinking message with actual response
      if (thinkingMsg) updateMessage(thinkingMsg.id!, { 
        role: "assistant", 
        content: response.message 
      });
    } catch (error) {
      if (thinkingMsg)
        updateMessage(thinkingMsg.id!, {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        });
    }
  };

  // Rename a session
  const renameSession = async (sessionId: string, newTitle: string) => {
    try {
      const res = await fetch(`${API_BASE}/${sessionId}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!res.ok) throw new Error("Failed to rename session");

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date() } : s))
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => (prev ? { ...prev, title: newTitle, updatedAt: new Date() } : prev));
      }
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete session");

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setHasMoreMessages(true);
        setMessageCursor(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        currentSession,
        sessions,
        createNewSession,
        setCurrentSession,
        loadSession,
        loadMoreMessages,
        addMessage,
        setMessages,
        sendMessage,
        renameSession,
        deleteSession,
        isLoading,
        isLoadingMessages,
        hasMoreMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};