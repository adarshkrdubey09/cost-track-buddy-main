export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'assistant_thinking';
  content: string;
  timestamp: Date;
  attachments?: File[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  hasMore?: boolean;
  cursor?: string | null;
}

export interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  createNewSession: () => Promise<ChatSession | null>;
  setCurrentSession: (session: ChatSession | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>; // 👈 New pagination method
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string }) => ChatMessage | null;
  setMessages: (messages: ChatMessage[]) => void;
  sendMessage: (message: string, file?: File) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  isLoading: boolean;
  isLoadingMessages: boolean; // 👈 New loading state for messages
  hasMoreMessages: boolean; // 👈 New state for pagination
}