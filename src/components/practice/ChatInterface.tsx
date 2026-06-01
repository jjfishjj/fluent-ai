import { useState, useRef, useEffect } from 'react';
import { Message, ConversationSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { parseCorrections } from '@/lib/parse-corrections';
import { toast } from 'sonner';
import { fileToBase64 } from '@/lib/image-service';
import { VARKInsightBanner } from '@/components/vark/VARKInsightBanner';
import { LearningStyle } from '@/lib/learning-styles';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  X,
  Lightbulb,
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Sparkles,
  Loader2,
  Video,
  Link2,
  FileVideo
} from 'lucide-react';

interface ChatInterfaceProps {
  settings: ConversationSettings;
  messages: Message[];
  onSendMessage: (content: string, imageBase64?: string, videoFrames?: string[], urlContext?: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  imageMode?: boolean;
  onImageModeChange?: (enabled: boolean) => void;
  isGeneratingImage?: boolean;
  varkTip?: { style: LearningStyle; message: string } | null;
  onVarkTipDismiss?: () => void;
  onVoiceUsed?: () => void;
  onAudioPlayed?: () => void;
}

export function ChatInterface({
  settings,
  messages,
  onSendMessage,
  onBack,
  isLoading = false,
  imageMode = false,
  onImageModeChange,
  isGeneratingImage = false,
  varkTip,
  onVarkTipDismiss,
  onVoiceUsed,
  onAudioPlayed,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessingContent, setIsProcessingContent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !previewImage && !previewVideo && !urlInput.trim()) || isLoading || isProcessingContent) return;

    let imageBase64: string | undefined;
    let videoFrames: string[] | undefined;
    let urlContext: string | undefined;

    if (selectedFile) {
      imageBase64 = await fileToBase64(selectedFile);
    }

    if (selectedVideo) {
      setIsProcessingContent(true);
      try {
        const { videoToBase64Frames } = await import('@/lib/content-service');
        videoFrames = await videoToBase64Frames(selectedVideo, 4);
        toast.success('已擷取影片畫面');
      } catch {
        toast.error('影片處理失敗');
      }
      setIsProcessingContent(false);
    }

    if (urlInput.trim()) {
      setIsProcessingContent(true);
      try {
        const { analyzeUrl } = await import('@/lib/content-service');
        const result = await analyzeUrl(urlInput.trim());
        if (result.error) {
          toast.error(result.error);
        } else {
          urlContext = result.content;
        }
      } catch {
        toast.error('連結分析失敗');
      }
      setIsProcessingContent(false);
    }

    const messageText = input.trim() || 
      (previewVideo ? '(sent a video)' : '') ||
      (urlInput.trim() ? `(shared a link: ${urlInput.trim()})` : '') ||
      '(sent an image)';

    onSendMessage(messageText, imageBase64, videoFrames, urlContext);
    setInput('');
    setPreviewImage(null);
    setSelectedFile(null);
    setPreviewVideo(null);
    setSelectedVideo(null);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('圖片大小不能超過 5MB');
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('請選擇影片檔案');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('影片大小不能超過 50MB');
      return;
    }
    setSelectedVideo(file);
    setPreviewVideo(URL.createObjectURL(file));
  };

  const removePreviewImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreviewVideo = () => {
    if (previewVideo) URL.revokeObjectURL(previewVideo);
    setPreviewVideo(null);
    setSelectedVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
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

    const recognition = new SpeechRecognitionAPI();
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

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    onVoiceUsed?.();
  };

  const handlePlayAudio = (messageId: string, text: string) => {
    if (playingId === messageId) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langMap[settings.language] || 'en-US';
    utterance.rate = settings.speed === 'slow' ? 0.75 : settings.speed === 'fast' ? 1.25 : 1;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(messageId);
    window.speechSynthesis.speak(utterance);
    onAudioPlayed?.();
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
          <div className="flex items-center gap-2">
            <Button
              variant={imageMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onImageModeChange?.(!imageMode)}
              className={imageMode ? 'bg-primary/80' : ''}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              🖼️ 圖片模式
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <X className="w-4 h-4 mr-1" />
              End
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
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
                {/* User uploaded image */}
                {message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="uploaded" 
                      className="max-w-[240px] rounded-lg border border-border/30"
                    />
                  </div>
                )}

                {/* Video indicator */}
                {message.content.includes('(sent a video)') && (
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <FileVideo className="w-4 h-4" />
                    <span className="text-xs">📹 已上傳影片</span>
                  </div>
                )}

                {/* URL indicator */}
                {message.content.includes('(shared a link:') && (
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Link2 className="w-4 h-4" />
                    <span className="text-xs break-all">🔗 {message.content.match(/\(shared a link: (.*?)\)/)?.[1]}</span>
                  </div>
                )}

                {displayContent && 
                 displayContent !== '(sent an image)' && 
                 displayContent !== '(sent a video)' && 
                 !displayContent.startsWith('(shared a link:') && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                )}
                
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
        
        {varkTip && onVarkTipDismiss && (
          <VARKInsightBanner
            style={varkTip.style}
            tip={varkTip.message}
            onDismiss={onVarkTipDismiss}
          />
        )}

        {isLoading && !isGeneratingImage && (
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

        {isGeneratingImage && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">🎨 正在生成圖片...</span>
              </div>
            </div>
          </div>
        )}

        {isProcessingContent && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">📎 正在分析內容...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Previews */}
      {(previewImage || previewVideo || showUrlInput) && (
        <div className="px-4 pb-2 space-y-2">
          {previewImage && (
            <div className="relative inline-block">
              <img src={previewImage} alt="preview" className="h-20 rounded-lg border border-border" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removePreviewImage}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {previewVideo && (
            <div className="relative inline-block">
              <video src={previewVideo} className="h-20 rounded-lg border border-border" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-foreground/80" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removePreviewVideo}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {showUrlInput && (
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="貼上連結 (網頁或 YouTube)..."
                className="flex-1 h-8 px-3 text-sm rounded-md border border-input bg-background"
                onKeyDown={handleKeyDown}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="glass border-t border-border/50 p-4">
        <div className="flex items-end gap-2">
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleRecording}
            className="shrink-0"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => videoInputRef.current?.click()}
            className="shrink-0"
          >
            <Video className="w-5 h-5" />
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelect}
          />

          <Button
            variant={showUrlInput ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="shrink-0"
          >
            <Link2 className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入訊息、上傳圖片/影片或貼上連結..."
              className="min-h-[48px] max-h-32 pr-12 resize-none"
              rows={1}
            />
          </div>

          <Button
            variant="gradient"
            size="icon"
            onClick={handleSend}
            disabled={(!input.trim() && !previewImage && !previewVideo && !urlInput.trim()) || isLoading || isProcessingContent}
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
