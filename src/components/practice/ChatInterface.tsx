import { useState, useRef, useEffect } from 'react';
import { Message, ConversationSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  X, 
  Lightbulb, 
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface ChatInterfaceProps {
  settings: ConversationSettings;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ChatInterface({ 
  settings, 
  messages, 
  onSendMessage, 
  onBack,
  isLoading = false 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual speech-to-text
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background">
      {/* Header */}
      <div className="glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-semibold capitalize">
                {settings.scenario} Practice
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {settings.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {settings.mode}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="w-4 h-4 mr-1" />
            End
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
          >
            <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {/* AI Features */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                </div>
              )}

              {/* Correction */}
              {message.correction && (
                <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-destructive">Correction</p>
                      <p className="text-xs text-muted-foreground">{message.correction}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {message.suggestion && (
                <div className="mt-3 p-2 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-success">More Natural</p>
                      <p className="text-xs text-muted-foreground">{message.suggestion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-border/50 p-4">
        <div className="flex items-end gap-3">
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleRecording}
            className="shrink-0"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[48px] max-h-32 pr-12 resize-none"
              rows={1}
            />
          </div>

          <Button
            variant="gradient"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {isRecording && (
          <div className="mt-3 flex items-center gap-2 text-destructive">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm">Recording... Speak now</span>
          </div>
        )}
      </div>
    </div>
  );
}
