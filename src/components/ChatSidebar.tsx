import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/contexts/ChatContext';

export const ChatSidebar = () => {
  const { sessions, currentSession, createNewSession, loadSession } = useChatContext();

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          onClick={createNewSession}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <Button
              key={session.id}
              variant={currentSession?.id === session.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => loadSession(session.id)}
            >
              <div className="flex items-start gap-2 w-full">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium text-sm truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Button>
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