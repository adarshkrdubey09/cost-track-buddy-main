import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { chatApi } from '@/utils/chatApi';

const thinkingMessages = [
  "Thinking about your question…",
  "Analyzing your request…",
  "Formulating an answer…",
  "Let me work this out for you…",
  "Almost there, just a moment…"
];

const ChatContent = () => {
  const { currentSession, setMessages, addMessage } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [userAtBottom, setUserAtBottom] = useState(true);
  const [thinkingSessionId, setThinkingSessionId] = useState<string | null>(null);

  const thinkingIntervalRef = useRef<number | null>(null);
  const dotsIntervalRef = useRef<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
    }
  }, [navigate]);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
    };
  }, []);

  // Detect user scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // If within 50px of bottom, consider user "at bottom"
    setUserAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  // Auto scroll only if user is at bottom
  useEffect(() => {
    if (userAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentSession?.messages, isThinking, userAtBottom]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentSession) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `https://ai.rosmerta.dev/chat/conversations/${currentSession.id}/messages`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        setMessages(
          data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [currentSession, setMessages]);

  // Start thinking animation
  const startThinking = (sessionId: string) => {
    // Clear any existing intervals
    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);

    setThinkingSessionId(sessionId);
    setThinkingIndex(0);
    setDots('.');
    setIsThinking(true);

    // Cycle through thinking messages
    thinkingIntervalRef.current = window.setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 4000);

    // Animate the dots
    dotsIntervalRef.current = window.setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
  };

  // Stop thinking animation
  const stopThinking = () => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
      dotsIntervalRef.current = null;
    }
    setIsThinking(false);
    setThinkingIndex(0);
    setDots('');
    setThinkingSessionId(null);
  };

  // Handle sending message
  const handleSendMessage = async (
    message: string,
    file?: File,
    sessionId?: string
  ) => {
    const id = sessionId || currentSession?.id;
    if (!id) return;

    // Add user message
    addMessage({
      role: "user",
      content: message,
      attachments: file ? [file] : undefined,
    });

    // Start thinking animation
    startThinking(id);

    try {
      // Send message to API
      const response = await chatApi.sendMessage(message, id);

      // Add assistant response
      addMessage({
        role: "assistant",
        content: response.message,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      });
    } finally {
      // Stop thinking animation
      stopThinking();
    }
  };

  // Check if thinking message should be shown for current session
  const showThinkingMessage = isThinking && thinkingSessionId === currentSession?.id;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div className="flex-shrink-0 w-full md:w-64 border-r">
        <ChatSidebar />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 pb-28"
        >
          {!currentSession || (currentSession.messages.length === 0 && !showThinkingMessage) ? (
            <div className="flex h-full items-center justify-center">
              <WelcomeHeader />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {currentSession.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {showThinkingMessage && (
                <div className="flex justify-start p-2">
                  <div className="bg-muted px-4 py-2 rounded-2xl max-w-xs shadow-sm text-sm italic flex items-center gap-1">
                    <span>{thinkingMessages[thinkingIndex]}</span>
                    <span className="min-w-[12px]">{dots}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white border-t p-2 md:p-4">
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading || isThinking} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  return (
    <ChatProvider>
      <Layout>
        <ChatContent />
      </Layout>
    </ChatProvider>
  );
}