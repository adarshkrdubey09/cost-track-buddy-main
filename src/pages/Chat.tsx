import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeHeader } from '@/components/WelcomeHeader';
import { chatApi } from '@/utils/chatApi';
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

// Loading component for session transitions
const SessionLoading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading conversation...</p>
    </div>
  </div>
);

const ChatContent = () => {
  const { 
    currentSession, 
    addMessage, 
    loadMoreMessages, 
    isLoadingMessages, 
    hasMoreMessages,
    loadSession,
    sessions
  } = useChatContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(thinkingMessages[0]);
  const [dots, setDots] = useState('');
  const [userAtBottom, setUserAtBottom] = useState(true);
  const [thinkingSessionId, setThinkingSessionId] = useState<string | null>(null);
  const [inputDisabled, setInputDisabled] = useState<string | null>(null);
  const [sessionTransition, setSessionTransition] = useState(false);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);

  const thinkingIntervalRef = useRef<number | null>(null);
  const dotsIntervalRef = useRef<number | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const thinkingIndexRef = useRef<number>(0);
  const thinkingSessionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const prevSessionIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const isScrollingToLoadMoreRef = useRef<boolean>(false);
  const previousMessagesLengthRef = useRef<number>(0);
  const sessionCacheRef = useRef<Map<string, { messages: any[]; hasMore: boolean }>>(new Map());

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
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
      if (dotsIntervalRef.current) {
        clearInterval(dotsIntervalRef.current);
      }
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login", { relative: 'route' });
    }
  }, [navigate]);

  // Cache session messages when switching away
  useEffect(() => {
    if (prevSessionIdRef.current && currentSession) {
      // Cache the current session's messages before switching
      sessionCacheRef.current.set(prevSessionIdRef.current, {
        messages: currentSession.messages,
        hasMore: hasMoreMessages
      });
    }
  }, [currentSession, hasMoreMessages]);

  // Detect session changes and handle message loading
  useEffect(() => {
    if (currentSession?.id !== prevSessionIdRef.current) {
      const previousSessionId = prevSessionIdRef.current;
      
      if (previousSessionId !== null && currentSession?.id) {
        setSessionTransition(true);
        
        // Check if we have cached messages for this session
        const cachedSession = sessionCacheRef.current.get(currentSession.id);
        
        if (cachedSession && cachedSession.messages.length > 0) {
          // If we have cached messages, use them immediately
          setTimeout(() => {
            if (isMountedRef.current) {
              setSessionTransition(false);
              // Scroll to bottom after a short delay to ensure messages are rendered
              setTimeout(() => {
                if (messagesEndRef.current && isMountedRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                  setUserAtBottom(true);
                }
              }, 100);
            }
          }, 300);
        } else {
          // No cached messages, show loading for longer
          const timer = setTimeout(() => {
            if (isMountedRef.current) {
              setSessionTransition(false);
              // Scroll to bottom after messages load
              setTimeout(() => {
                if (messagesEndRef.current && isMountedRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
                  setUserAtBottom(true);
                }
              }, 100);
            }
          }, 800);
          
          return () => clearTimeout(timer);
        }
      } else if (currentSession?.id) {
        // Initial load of a session
        setTimeout(() => {
          if (messagesEndRef.current && isMountedRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            setUserAtBottom(true);
          }
        }, 100);
      }
      
      prevSessionIdRef.current = currentSession?.id || null;
      isInitialLoadRef.current = false;
      setIsInitialScrollDone(false);
    }
  }, [currentSession?.id]);

  // Auto scroll to bottom on initial load and new messages
  useEffect(() => {
    if (!currentSession?.messages.length) return;

    const isNewMessageAdded = currentSession.messages.length > previousMessagesLengthRef.current;
    const isInitialLoad = previousMessagesLengthRef.current === 0;

    if ((isNewMessageAdded && userAtBottom) || (isInitialLoad && !isInitialScrollDone)) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesEndRef.current && isMountedRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: isInitialLoad ? 'auto' : 'smooth' 
          });
          if (isInitialLoad) {
            setIsInitialScrollDone(true);
          }
        }
      }, 50);
    }

    previousMessagesLengthRef.current = currentSession.messages.length;
  }, [currentSession?.messages, userAtBottom, isInitialScrollDone]);

  // Optimized scroll handler with pagination
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !currentSession?.messages || isLoadingMessages) return;
    
    // Debounce scroll events to improve performance
    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }

    scrollDebounceRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current!;
      
      // If within 100px of bottom, consider user "at bottom"
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserAtBottom(isAtBottom);

      // Load more messages when scrolling to the top and there are more to load
      if (scrollTop < 200 && hasMoreMessages && !isLoadingMessages && !isScrollingToLoadMoreRef.current) {
        isScrollingToLoadMoreRef.current = true;
        
        // Store current scroll position and height
        const currentScrollTop = scrollTop;
        const currentScrollHeight = scrollHeight;
        
        loadMoreMessages().then(() => {
          // After loading, adjust scroll position to maintain user's view
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const heightDifference = newScrollHeight - currentScrollHeight;
            scrollContainerRef.current.scrollTop = currentScrollTop + heightDifference;
          }
        }).finally(() => {
          isScrollingToLoadMoreRef.current = false;
        });
      }

      lastScrollTopRef.current = scrollTop;
    }, 150);
  }, [currentSession?.messages, isLoadingMessages, hasMoreMessages, loadMoreMessages]);

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
    inputDisabled === currentSession?.id || isLoadingMessages || sessionTransition, 
    [inputDisabled, currentSession?.id, isLoadingMessages, sessionTransition]
  );

  const shouldShowWelcome = useMemo(() => 
    !currentSession || (currentSession.messages.length === 0 && !showThinkingMessage),
    [currentSession, showThinkingMessage]
  );

  // Show loading indicator when loading more messages
  const showLoadMoreIndicator = useMemo(() => 
    isLoadingMessages && hasMoreMessages,
    [isLoadingMessages, hasMoreMessages]
  );

  // Check if current session has cached messages
  const hasCachedMessages = useMemo(() => {
    if (!currentSession) return false;
    const cached = sessionCacheRef.current.get(currentSession.id);
    return cached && cached.messages.length > 0;
  }, [currentSession]);

  return (
    <div className="flex h-screen flex-col md:flex-row ">
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
          className="flex-1 overflow-y-auto p-4 pb-28 relative"
        >
          {sessionTransition ? (
            <SessionLoading />
          ) : shouldShowWelcome ? (
            <div className="flex h-full items-center justify-center">
              <WelcomeHeader />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Load more indicator at the top */}
              {showLoadMoreIndicator && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Loading older messages...</span>
                  </div>
                </div>
              )}

              {/* Show message if using cached data */}
              {hasCachedMessages && (
                <div className="text-center py-2 text-sm text-gray-500 italic">
                  {/* Showing cached messages. */}
                   Scroll up to load more...
                </div>
              )}

              {/* Messages */}
              {currentSession?.messages.map((message) => (
                <MemoizedChatMessage key={message.id} message={message} />
              ))}

              {/* Thinking message */}
              {showThinkingMessage && (
                <div className="flex justify-start p-2">
                  <div className="bg-muted px-4 py-2 rounded-2xl max-w-xs shadow-sm text-sm italic flex items-center gap-1">
                    <span>{thinkingMessage}</span>
                    <span className="min-w-[12px]">{dots}</span>
                  </div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="sticky bottom-14 bg-white border-t p-2 md:p-4">
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