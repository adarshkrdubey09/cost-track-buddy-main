import { useEffect, useRef, useState, useCallback, useMemo, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { chatApi } from '@/utils/chatApi';
import { ReactDOM } from 'react';
import React from 'react';

const thinkingMessages = [
  "Thinking about your question…",
  "Analyzing your request…",
  "Formulating an answer…",
  "Let me work this out for you…",
  "Almost there, just a moment…"
];

// Memoized ChatMessage component to prevent unnecessary re-renders
const MemoizedChatMessage = React.memo(ChatMessage);

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
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const thinkingIntervalRef = useRef<number | null>(null);
  const dotsIntervalRef = useRef<number | null>(null);
  const hasFetchedRef = useRef<Set<string>>(new Set());
  const currentSessionIdRef = useRef<string | null>(null);
  const thinkingIndexRef = useRef<number>(0);
  const thinkingSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const messageBatchSize = 50; // Number of messages to render at once
  const lastScrollTopRef = useRef<number>(0);

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
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login", { relative: 'route' });
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

  // Virtualized message rendering - only show a subset of messages
  useEffect(() => {
    if (!currentSession?.messages) return;
    
    // For small message counts, show all messages
    if (currentSession.messages.length <= messageBatchSize) {
      setVisibleMessages(currentSession.messages);
      setHasMoreMessages(false);
      return;
    }

    // For large message counts, only show the most recent messages initially
    const recentMessages = currentSession.messages.slice(-messageBatchSize);
    setVisibleMessages(recentMessages);
    setHasMoreMessages(currentSession.messages.length > messageBatchSize);
  }, [currentSession?.messages]);

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !currentSession?.messages) return;
    
    // Debounce scroll events to improve performance
    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }

    scrollDebounceRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current!;
      
      // If within 50px of bottom, consider user "at bottom"
      setUserAtBottom(scrollHeight - scrollTop - clientHeight < 50);

      // Load more messages when scrolling to the top (for virtualized rendering)
      if (scrollTop < 100 && hasMoreMessages && currentSession.messages.length > messageBatchSize) {
        const currentScrollPosition = scrollTop;
        const currentMessages = currentSession.messages;
        const currentVisibleCount = visibleMessages.length;
        
        // Load more older messages
        const startIndex = Math.max(0, currentMessages.length - currentVisibleCount - messageBatchSize);
        const newVisibleMessages = currentMessages.slice(startIndex);
        
        setVisibleMessages(newVisibleMessages);
        
        // Restore scroll position after updating messages
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const scrollDifference = newScrollHeight - scrollHeight;
            scrollContainerRef.current.scrollTop = currentScrollPosition + scrollDifference;
          }
        }, 0);

        // Check if we've loaded all messages
        if (startIndex === 0) {
          setHasMoreMessages(false);
        }
      }

      lastScrollTopRef.current = scrollTop;
    }, 50);
  }, [currentSession?.messages, visibleMessages.length, hasMoreMessages]);

  // Auto scroll only if user is at bottom
  useEffect(() => {
    if (userAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages, isThinking, userAtBottom]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentSession || hasFetchedRef.current.has(currentSession.id)) {
        return;
      }

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
        
        hasFetchedRef.current.add(currentSession.id);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        hasFetchedRef.current.delete(currentSession.id);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchMessages();
  }, [currentSession, setMessages]);

  // Start thinking animation with proper cleanup
  const startThinking = useCallback((sessionId: string) => {
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
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    if (dotsIntervalRef.current) {
      clearInterval(dotsIntervalRef.current);
      dotsIntervalRef.current = null;
    }
    
    setIsThinking(false);
    setThinkingSessionId(null);
    setInputDisabled(null);
  }, []);

  // Throttled message sending to prevent rapid API calls
  const sendMessageThrottled = useRef(
    (() => {
      let lastCallTime = 0;
      const throttleDelay = 1000; // 1 second between messages
      
      return async (message: string, id: string, addMessage: any, startThinking: any, stopThinking: any) => {
        const now = Date.now();
        if (now - lastCallTime < throttleDelay) {
          console.log('Message throttled');
          return;
        }
        lastCallTime = now;

        // Start thinking animation
        startThinking(id);

        try {
          const response = await chatApi.sendMessage(message, id);
          
          if (currentSessionIdRef.current === id) {
            addMessage({
              role: "assistant",
              content: response.message,
            });
          }
        } catch (error) {
          console.error("Error sending message:", error);
          
          if (currentSessionIdRef.current === id) {
            addMessage({
              role: "assistant",
              content: "I'm sorry, I encountered an error. Please try again.",
            });
          }
        } finally {
          if (thinkingSessionIdRef.current === id) {
            stopThinking();
          }
        }
      };
    })()
  );

  // Handle sending message
  const handleSendMessage = useCallback(async (
    message: string,
    file?: File,
    sessionId?: string
  ) => {
    const id = sessionId || currentSessionIdRef.current;
    if (!id) return;

    addMessage({
      role: "user",
      content: message,
      attachments: file ? [file] : undefined,
    });

    // Use throttled message sending
    sendMessageThrottled.current(message, id, addMessage, startThinking, stopThinking);
  }, [addMessage, startThinking, stopThinking]);

  // Memoized values for performance
  const showThinkingMessage = useMemo(() => 
    isThinking && thinkingSessionId === currentSession?.id, 
    [isThinking, thinkingSessionId, currentSession?.id]
  );

  const isInputDisabled = useMemo(() => 
    inputDisabled === currentSession?.id, 
    [inputDisabled, currentSession?.id]
  );

  const shouldShowWelcome = useMemo(() => 
    !currentSession || (currentSession.messages.length === 0 && !showThinkingMessage),
    [currentSession, showThinkingMessage]
  );

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
          {shouldShowWelcome ? (
            <div className="flex h-full items-center justify-center">
              <WelcomeHeader />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {hasMoreMessages && (
                <div className="text-center py-2 text-sm text-gray-500">
                  {currentSession!.messages.length - visibleMessages.length} older messages not shown
                </div>
              )}
              
              {visibleMessages.map((message) => (
                <MemoizedChatMessage key={message.id} message={message} />
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