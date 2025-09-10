import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { speechRecognition } from '@/utils/speechRecognition';
import { useToast } from '@/hooks/use-toast';
import { useChatContext } from '@/contexts/ChatContext'; // ✅ added

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ✅ chat context
  const { currentSession, createNewSession, setCurrentSession } = useChatContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      let session = currentSession;

      // ✅ if no session, create one before sending
      if (!session) {
        session = await createNewSession();


        if (session) setCurrentSession(session);
        onSendMessage(message.trim(), selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      }

      onSendMessage(message.trim(), selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF file only.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  return (
    <div className="bg-background p-4 border border-gray-300 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-sm">📄 {selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              ×
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || (!message.trim() && !selectedFile)}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
