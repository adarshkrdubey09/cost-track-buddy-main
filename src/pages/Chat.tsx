import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [thinkingMessage, setThinkingMessage] = useState(thinkingMessages[0]);
  const [dots, setDots] = useState('');
  const [userAtBottom, setUserAtBottom] = useState(true);
  const [thinkingSessionId, setThinkingSessionId] = useState<string | null>(null);
  const [inputDisabled, setInputDisabled] = useState<string | null>(null);

  const thinkingIntervalRef = useRef<number | null>(null);
  const dotsIntervalRef = useRef<number | null>(null);
  const hasFetchedRef = useRef<Set<string>>(new Set());
  const currentSessionIdRef = useRef<string | null>(null);
  const thinkingIndexRef = useRef<number>(0);
  const thinkingSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Update refs when state changes
  useEffect(() => {
    currentSessionIdRef.current = currentSession?.id || null;
    thinkingSessionIdRef.current = thinkingSessionId;
  }, [currentSession, thinkingSessionId]);

  // Set mounted ref for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login",{ relative: 'route' });
    }
  }, [navigate]);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
      if (dotsIntervalRef.current) {
        clearInterval(dotsIntervalRef.current);
        dotsIntervalRef.current = null;
      }
    };
  }, []);

  // Detect user scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // If within 50px of bottom, consider user "at bottom"
    setUserAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  // Auto scroll only if user is at bottom
  useEffect(() => {
    if (userAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentSession?.messages, isThinking, userAtBottom]);

  // Fetch messages when a conversation is selected - FIXED TO PREVENT REPEATED CALLS
  useEffect(() => {
    const fetchMessages = async () => {
      // Early return conditions to prevent unnecessary calls
      if (!currentSession || hasFetchedRef.current.has(currentSession.id)) {
        return;
      }

      setIsLoading(true);
      try {
        console.log('Fetching messages for session:', currentSession.id);
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
        
        // Mark this session as fetched
        hasFetchedRef.current.add(currentSession.id);
        console.log('Messages fetched successfully for session:', currentSession.id);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        // Remove from fetched set on error to allow retry
        hasFetchedRef.current.delete(currentSession.id);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchMessages();
  }, [currentSession, setMessages]); // Only depend on currentSession and setMessages

  // Start thinking animation with proper cleanup
  const startThinking = useCallback((sessionId: string) => {
    console.log('Starting thinking for session:', sessionId);
    
    // Clear any existing intervals first
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
      dotsIntervalRef.current = null;
    }

    setThinkingSessionId(sessionId);
    setInputDisabled(sessionId);
    setThinkingMessage(thinkingMessages[0]);
    setDots('.');
    setIsThinking(true);
    thinkingIndexRef.current = 0;

    // Cycle through thinking messages
    thinkingIntervalRef.current = window.setInterval(() => {
      if (!isMountedRef.current) return;
      
      thinkingIndexRef.current = (thinkingIndexRef.current + 1) % thinkingMessages.length;
      setThinkingMessage(thinkingMessages[thinkingIndexRef.current]);
    }, 4000);

    // Animate the dots
    dotsIntervalRef.current = window.setInterval(() => {
      if (!isMountedRef.current) return;
      
      setDots((prev) => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
  }, []);

  // Stop thinking animation with proper cleanup
  const stopThinking = useCallback(() => {
    console.log('Stopping thinking animation');
    
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
      dotsIntervalRef.current = null;
    }
    
    setIsThinking(false);
    setThinkingMessage(thinkingMessages[0]);
    setDots('');
    setThinkingSessionId(null);
    setInputDisabled(null);
    thinkingIndexRef.current = 0;
  }, []);

  // Handle sending message with proper session tracking
  const handleSendMessage = useCallback(async (
    message: string,
    file?: File,
    sessionId?: string
  ) => {
    const id = sessionId || currentSessionIdRef.current;
    if (!id) {
      console.error('No session ID available for sending message');
      return;
    }

    console.log('Sending message to session:', id);
    
    // Add user message to the current session
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
      console.log('Received response for session:', id);
      
      // Check if we're still in the same session using ref (avoids closure issues)
      if (currentSessionIdRef.current === id) {
        console.log('Adding assistant response to current session');
        addMessage({
          role: "assistant",
          content: response.message,
        });
      } else {
        console.log('User switched sessions, response not displayed');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Check if we're still in the same session
      if (currentSessionIdRef.current === id) {
        addMessage({
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        });
      }
    } finally {
      // Stop thinking animation only if this is the current thinking session
      // Use the ref instead of state to avoid stale closure
      if (thinkingSessionIdRef.current === id) {
        stopThinking();
      }
    }
  }, [addMessage, startThinking, stopThinking]);

  // Check if thinking message should be shown for current session
  const showThinkingMessage = isThinking && thinkingSessionId === currentSession?.id;

  // Check if input should be disabled for the current session
  const isInputDisabled = inputDisabled === currentSession?.id;

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
                    <span>{thinkingMessage}</span>
                    <span className="min-w-[12px]">{dots}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-20 bg-white border-t p-2 md:p-4">
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isInputDisabled} 
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