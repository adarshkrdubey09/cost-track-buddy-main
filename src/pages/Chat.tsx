import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [dots, setDots] = useState(1);

  const thinkingIntervalRef = useRef<number | null>(null);
  const dotsIntervalRef = useRef<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
    }
  }, [navigate]);

  // Scroll to bottom whenever messages or thinking index change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, thinkingIndex, dots]);

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
              ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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
        setThinkingIndex(0);
      }
    };

    fetchMessages();
  }, [currentSession, setMessages]);

  // Start thinking
  const startThinking = () => {
    setThinkingIndex(0);
    setDots(1);
    setIsLoading(true);

    if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    thinkingIntervalRef.current = window.setInterval(() => {
      setThinkingIndex(prev => (prev + 1) % thinkingMessages.length);
    }, 4000);

    if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
    dotsIntervalRef.current = window.setInterval(() => {
      setDots(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);
  };

  // Stop thinking
  const stopThinking = () => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
      dotsIntervalRef.current = null;
    }
    setIsLoading(false);
    setThinkingIndex(0);
    setDots(1);
  };

  // Handle sending message
  const handleSendMessage = async (message: string, file?: File) => {
    if (!currentSession) return;

    // Add user message immediately
    addMessage({
      role: "user",
      content: message,
      attachments: file ? [file] : undefined,
    });

    startThinking(); // show thinking messages

    try {
      const response = await chatApi.sendMessage(message, currentSession.id);

      // Add assistant reply
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
      stopThinking(); // stop thinking messages
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <ChatSidebar />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {!currentSession || currentSession.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <WelcomeHeader />
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-2">
              {currentSession.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex justify-start p-2">
                  <div className="bg-muted px-4 py-2 rounded-2xl max-w-xs shadow-sm text-sm italic flex items-center gap-1">
                    <span>{thinkingMessages[thinkingIndex]}</span>
                    <span className="animate-blink">{'.'.repeat(dots)}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <div className="max-w-4xl mx-auto w-full p-2 md:p-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
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
