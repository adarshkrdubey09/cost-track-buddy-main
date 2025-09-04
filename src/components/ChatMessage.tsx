import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 p-3 sm:p-4 rounded-xl border shadow-sm w-full ${
        isUser ? 'bg-muted/40 border-primary/20' : 'bg-background border-border'
      }`}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
        <AvatarFallback
          className={isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}
        >
          {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
        </AvatarFallback>
      </Avatar>

      {/* Message body */}
      <div className="flex-1 space-y-2 min-w-0">
        {/* Name + Time */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-xs sm:text-sm">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Message Content */}
        <div className="prose prose-xs sm:prose-sm max-w-none text-foreground overflow-x-auto break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto">
                  <table
                    className="border border-collapse border-gray-300 w-full text-xs sm:text-sm"
                    {...props}
                  />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th
                  className="border border-gray-300 bg-muted px-2 py-1 text-left font-medium"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 px-2 py-1" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.attachments.map((file, index) => (
              <div
                key={index}
                className="text-[10px] sm:text-xs border border-accent bg-accent/20 text-accent-foreground px-2 py-1 rounded-md truncate max-w-[150px] sm:max-w-[200px]"
              >
                📄 {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
