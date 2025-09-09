import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Upload, Send } from 'lucide-react';
import { speechRecognition } from '@/utils/speechRecognition';
import { useToast } from '@/hooks/use-toast';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
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

  const handleVoiceInput = () => {
    if (!speechRecognition.isAvailable()) {
      toast({
        title: 'Voice input not supported',
        description: 'Your browser does not support voice input.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      speechRecognition.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechRecognition.startListening(
      (transcript) => {
        setMessage(prev => prev + ' ' + transcript);
        setIsListening(false);
      },
      (error) => {
        toast({
          title: 'Voice input error',
          description: error,
          variant: 'destructive',
        });
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  return (
    <div className="border-t bg-background p-4">
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
              placeholder="Type your message... demo"
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