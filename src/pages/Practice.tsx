import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { ScenarioSelector } from '@/components/practice/ScenarioSelector';
import { ChatInterface } from '@/components/practice/ChatInterface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LANGUAGES, SCENARIOS } from '@/lib/constants';
import { 
  Language, 
  Scenario, 
  DifficultyLevel, 
  SpeechSpeed, 
  ToneStyle, 
  ConversationMode,
  ConversationSettings,
  Message
} from '@/lib/types';
import { ArrowLeft, Globe } from 'lucide-react';
import { createConversation, saveMessage } from '@/lib/conversation-service';
import { streamChat } from '@/lib/stream-chat';
import { parseCorrections } from '@/lib/parse-corrections';
import { toast } from 'sonner';

const Practice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  
  // State
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  const [tone, setTone] = useState<ToneStyle>('semi-formal');
  const [mode, setMode] = useState<ConversationMode>('practice');
  const [instantCorrection, setInstantCorrection] = useState(true);
  const [isInConversation, setIsInConversation] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Initialize from URL params
  useEffect(() => {
    const lang = searchParams.get('lang') as Language;
    if (lang && LANGUAGES.find(l => l.id === lang)) {
      setSelectedLanguage(lang);
    }
  }, [searchParams]);

  const currentLanguage = LANGUAGES.find(l => l.id === selectedLanguage);

  const getCurrentSettings = (): ConversationSettings => ({
    language: selectedLanguage!,
    scenario: selectedScenario!.id,
    difficulty,
    speed,
    tone,
    mode,
    instantCorrection,
  });

  const handleStartConversation = async () => {
    if (!selectedLanguage || !selectedScenario) return;

    const settings = getCurrentSettings();

    // Create conversation in DB for logged-in users
    let newConvId: string | null = null;
    if (user) {
      const id = await createConversation(settings, user.id);
      newConvId = id || null;
      setConversationId(newConvId);
    }

    // Stream initial greeting from AI
    const greetingPrompt = `Start the conversation with a greeting in ${selectedLanguage}. Introduce the scenario "${selectedScenario.id}" at the ${difficulty} level. Keep it brief (2-3 sentences).`;

    setMessages([]);
    setIsInConversation(true);
    setIsLoading(true);

    let assistantContent = '';
    const greetingId = Date.now().toString();

    await streamChat({
      messages: [{ role: 'user', content: greetingPrompt }],
      settings,
      learningStyle: profile?.learning_style,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages([{
          id: greetingId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }]);
      },
      onDone: () => {
        setIsLoading(false);
        if (user && newConvId) {
          const parsed = parseCorrections(assistantContent);
          saveMessage(newConvId, {
            role: 'assistant',
            content: parsed.content,
            correction: parsed.correction || undefined,
            suggestion: parsed.suggestion || undefined,
          });
        }
      },
      onError: (msg) => {
        setIsLoading(false);
        toast.error(msg);
      },
    });
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message to DB
    if (user && conversationId) {
      saveMessage(conversationId, { role: 'user', content });
    }

    // Build chat history for AI (only role + content)
    const chatHistory = newMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let assistantContent = '';
    const aiId = (Date.now() + 1).toString();

    await streamChat({
      messages: chatHistory,
      settings: getCurrentSettings(),
      learningStyle: profile?.learning_style,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === aiId) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, {
            id: aiId,
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: new Date(),
          }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        if (user && conversationId) {
          saveMessage(conversationId, { role: 'assistant', content: assistantContent });
        }
      },
      onError: (msg) => {
        setIsLoading(false);
        toast.error(msg);
      },
    });
  };

  const handleBack = () => {
    if (isInConversation) {
      setIsInConversation(false);
      setMessages([]);
    } else if (selectedLanguage) {
      setSelectedLanguage(null);
      setSelectedScenario(null);
    } else {
      navigate('/');
    }
  };

  // Render conversation view
  if (isInConversation && selectedLanguage && selectedScenario) {
    return (
      <ChatInterface
        settings={{
          language: selectedLanguage,
          scenario: selectedScenario.id,
          difficulty,
          speed,
          tone,
          mode,
          instantCorrection,
        }}
        messages={messages}
        onSendMessage={handleSendMessage}
        onBack={handleBack}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Language Selection */}
        {!selectedLanguage ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">
                Select Your Language
              </h1>
              <p className="text-muted-foreground">
                Choose the language you want to practice today
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LANGUAGES.map((language) => (
                <button
                  key={language.id}
                  onClick={() => setSelectedLanguage(language.id)}
                  className={`language-card lang-${language.id}`}
                >
                  <div className="text-3xl mb-2">{language.flag}</div>
                  <h3 className="font-semibold">{language.name}</h3>
                  <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Scenario Configuration */
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">{currentLanguage?.flag}</span>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">
                  {currentLanguage?.name} Practice
                </h1>
                <p className="text-muted-foreground">
                  Configure your practice session
                </p>
              </div>
            </div>

            <ScenarioSelector
              selectedScenario={selectedScenario}
              onSelectScenario={setSelectedScenario}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              speed={speed}
              onSpeedChange={setSpeed}
              tone={tone}
              onToneChange={setTone}
              mode={mode}
              onModeChange={setMode}
              instantCorrection={instantCorrection}
              onInstantCorrectionChange={setInstantCorrection}
              onStartConversation={handleStartConversation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
