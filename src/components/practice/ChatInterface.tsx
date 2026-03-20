import { useState, useRef, useEffect } from 'react';
import { Message, ConversationSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { parseCorrections } from '@/lib/parse-corrections';
import { toast } from 'sonner';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  X, 
  Lightbulb, 
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
  const recognitionRef = useRef<any>(null);

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

  const [playingId, setPlayingId] = useState<string | null>(null);

  const langMap: Record<string, string> = {
    english: 'en-US', german: 'de-DE', french: 'fr-FR',
    spanish: 'es-ES', japanese: 'ja-JP', korean: 'ko-KR', hebrew: 'he-IL',
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error('您的瀏覽器不支援語音輸入');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[settings.language] || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handlePlayAudio = (messageId: string, text: string) => {
    if (playingId === messageId) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const langMap: Record<string, string> = {
      english: 'en-US', german: 'de-DE', french: 'fr-FR',
      spanish: 'es-ES', japanese: 'ja-JP', korean: 'ko-KR', hebrew: 'he-IL',
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[settings.language] || 'en-US';
    utterance.rate = settings.speed === 'slow' ? 0.75 : settings.speed === 'fast' ? 1.25 : 1;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(messageId);
    window.speechSynthesis.speak(utterance);
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
                {settings.mode === 'practice' && settings.instantCorrection && (
                  <Badge variant="default" className="text-xs bg-primary/80">
                    ✓ 糾錯
                  </Badge>
                )}
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
        {messages.map((message) => {
          // Parse corrections from AI messages for display
          const parsed = message.role === 'assistant'
            ? parseCorrections(message.content)
            : null;

          const displayContent = parsed ? parsed.content : message.content;
          const correction = message.correction || parsed?.correction;
          const suggestion = message.suggestion || parsed?.suggestion;

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
            >
              <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                
                {/* AI Features */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handlePlayAudio(message.id, displayContent)}
                    >
                      <Volume2 className={`w-3 h-3 mr-1 ${playingId === message.id ? 'text-primary animate-pulse' : ''}`} />
                      {playingId === message.id ? 'Stop' : 'Play'}
                    </Button>
                  </div>
                )}

                {/* Correction */}
                {correction && (
                  <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-1">📝 文法糾正</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{correction}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestion */}
                {suggestion && (
                  <div className="mt-3 p-2.5 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-success mb-1">💡 更自然的說法</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{suggestion}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
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
