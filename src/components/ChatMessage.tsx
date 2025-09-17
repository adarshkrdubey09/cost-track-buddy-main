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
  console.log(message)

  return (
    <div
      className={`flex gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-lg md:rounded-xl border shadow-sm w-full max-w-full
        ${isUser 
          ? 'bg-muted/40 border-primary/20' 
          : 'bg-background border-border'
        }`}
    > 
      {/* Avatar */}
      <Avatar className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex-shrink-0">
        <AvatarFallback
          className={`${isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary'
          } text-[10px] xs:text-xs sm:text-sm`}
        >
          {isUser ? (
            <User className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
          ) : (
            <Bot className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message body */}
      <div className="flex-1 space-y-1 sm:space-y-2 min-w-0 max-w-full">
        {/* Name + Time */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <span className="font-medium text-xs xs:text-sm sm:text-base">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[9px] xs:text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* Message Content */}
        <div className="prose prose-xs xs:prose-sm sm:prose-base max-w-full text-foreground break-words overflow-hidden">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-1 xs:my-2 max-w-full">
                  <table
                    className="border border-collapse border-gray-300 w-full text-xs xs:text-sm sm:text-base max-w-full table-fixed"
                    {...props}
                  />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th
                  className="border border-gray-300 bg-muted px-2 py-1 text-left font-medium break-words max-w-[120px]"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 px-2 py-1 break-words max-w-[120px]" {...props} />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-lg xs:text-xl sm:text-2xl my-1 xs:my-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base xs:text-lg sm:text-xl my-1 xs:my-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm xs:text-base sm:text-lg my-1 xs:my-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="break-words whitespace-pre-wrap" {...props} />
              ),
              pre: ({ node, ...props }) => (
                <pre className="overflow-x-auto max-w-full text-xs bg-muted p-2 rounded my-1" {...props} />
              ),
              code: ({ node, ...props }) => (
                <code className="break-words bg-muted px-1 rounded text-xs" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-1 xs:gap-2 mt-1 xs:mt-2 flex-wrap">
            {message.attachments.map((file, index) => (
              <div
                key={index}
                className="text-[10px] xs:text-xs border border-accent bg-accent/20 text-accent-foreground px-2 py-1 rounded truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]"
                title={file.name}
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