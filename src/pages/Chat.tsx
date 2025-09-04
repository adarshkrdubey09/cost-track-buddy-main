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
  const { currentSession, addMessage } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Cycle through thinking messages while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSendMessage = async (message: string, file?: File) => {
    if (!currentSession) return;

    // Add user message
    addMessage({
      role: 'user',
      content: message,
      attachments: file ? [file] : undefined
    });

    setIsLoading(true);

    // Get AI response
    try {
      const response = await chatApi.sendMessage(message);
      addMessage({
        role: 'assistant',
        content: response.message
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      });
    } finally {
      setIsLoading(false);
      setThinkingIndex(0);
    }
  };

  return (
    <div className="flex h-full">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col">
        {!currentSession || currentSession.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <WelcomeHeader />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto">
              {currentSession.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Assistant "thinking" bubble */}
              {isLoading && (
                <div className="flex justify-start p-4">
                  <div className="bg-muted px-4 py-2 rounded-2xl max-w-xs shadow-sm text-sm italic">
                    {thinkingMessages[thinkingIndex]}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
        
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  return (
    <ChatProvider>
      <Layout>
        <div className="h-full flex flex-col">
          <ChatContent />
        </div>
      </Layout>
    </ChatProvider>
  );
}
