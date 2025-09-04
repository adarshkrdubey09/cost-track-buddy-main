export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
}
export interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  createNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (message: string, file?: File) => Promise<void>;
  setMessages: (messages: ChatMessage[]) => void; // <-- add this
  isLoading: boolean;
}
