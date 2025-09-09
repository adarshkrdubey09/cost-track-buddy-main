import { MessageSquare, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/contexts/ChatContext';
import { useState } from 'react';

export const ChatSidebar = () => {
  const {
    sessions,
    currentSession,
    createNewSession,
    loadSession,
    renameSession,
    deleteSession,
  } = useChatContext();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-screen">
      {/* New Chat Button */}
      <div className="p-4 border-b flex-shrink-0">
        <Button
          onClick={createNewSession}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
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
                className="flex-1 justify-start text-left h-auto p-3"
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-start gap-2 w-full">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        className="w-full text-sm border rounded px-1"
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
                        <div className="text-xs text-muted-foreground">
                          {session.updatedAt.toLocaleDateString("en-GB")}{" "}
                          {session.updatedAt.toLocaleTimeString("en-US")}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Button>

              {/* Rename Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditingSessionId(session.id);
                  setNewTitle(session.title);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteSession(session.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chat history yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
