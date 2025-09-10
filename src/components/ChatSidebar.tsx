import { MessageSquare, Plus, Trash2, Edit, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/contexts/ChatContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const ChatSidebar = () => {
  const {
    sessions,
    currentSession,
    createNewSession,
    setCurrentSession,
    loadSession,
    renameSession,
    deleteSession,
  } = useChatContext();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

// useEffect(() => {
//   const initializeSession = async () => {
//     if (!currentSession) {
//       if (sessions.length === 0) {
//         // No sessions exist → create a new one
//         const newSession = await createNewSession();
//         if (newSession) setCurrentSession(newSession);
//       } else {
//         // Sessions exist → set the first one as current
//         setCurrentSession(sessions[0]);
//       }
//     }
//   };

//   initializeSession();
// }, [currentSession, sessions, createNewSession, setCurrentSession]);

  const handleNewChat = async () => {
    const newSession = await createNewSession();
    if (newSession) setCurrentSession(newSession);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId);
    const loaded = sessions.find(s => s.id === sessionId);
    if (loaded) setCurrentSession(loaded);
    if (isMobile) setIsMobileOpen(false);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.chat-sidebar');
      if (isMobileOpen && sidebar && !sidebar.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Overlay for mobile */}
      {isMobileOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "chat-sidebar w-64 border-r bg-muted/30 flex flex-col h-screen fixed md:relative z-40 transition-transform duration-300",
          isMobile ? "transform " + (isMobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        )}
      >
        {/* New Chat Button */}
        <div className="p-3 sm:p-4 border-b flex-shrink-0">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 py-5 sm:py-6 text-sm sm:text-base"
            variant="outline"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            New Chat
          </Button>
        </div>

        {/* Scrollable Chat Sessions */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center gap-1">
                <Button
                  variant={currentSession?.id === session.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start text-left h-auto p-2 sm:p-3 min-h-[60px] sm:min-h-[70px]"
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-1 py-1"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onBlur={() => {
                            renameSession(session.id, newTitle);
                            setEditingSessionId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameSession(session.id, newTitle);
                              setEditingSessionId(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="font-medium text-sm truncate">
                            {session.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {session.updatedAt.toLocaleDateString("en-GB", {
                              day: '2-digit',
                              month: 'short',
                              year: session.updatedAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                            {" • "}
                            {session.updatedAt.toLocaleTimeString("en-US", {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Button>

                <div className="flex flex-col gap-1">
                  {/* Rename Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingSessionId(session.id);
                      setNewTitle(session.title);
                    }}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8 px-4">
                No chat history yet. Start a new conversation!
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};