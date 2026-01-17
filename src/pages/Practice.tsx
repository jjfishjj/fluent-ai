import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
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

const Practice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
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

  // Initialize from URL params
  useEffect(() => {
    const lang = searchParams.get('lang') as Language;
    if (lang && LANGUAGES.find(l => l.id === lang)) {
      setSelectedLanguage(lang);
    }
  }, [searchParams]);

  const currentLanguage = LANGUAGES.find(l => l.id === selectedLanguage);

  const handleStartConversation = () => {
    if (!selectedLanguage || !selectedScenario) return;

    const settings: ConversationSettings = {
      language: selectedLanguage,
      scenario: selectedScenario.id,
      difficulty,
      speed,
      tone,
      mode,
      instantCorrection,
    };

    // Initialize with AI greeting
    const greeting: Message = {
      id: '1',
      role: 'assistant',
      content: getGreeting(settings),
      timestamp: new Date(),
    };

    setMessages([greeting]);
    setIsInConversation(true);
  };

  const getGreeting = (settings: ConversationSettings): string => {
    const greetings: Record<Language, string> = {
      english: "Hello! I'm your English practice partner. Let's practice together!",
      german: "Hallo! Ich bin dein Deutsch-Übungspartner. Lass uns zusammen üben!",
      french: "Bonjour! Je suis votre partenaire de pratique. Commençons!",
      spanish: "¡Hola! Soy tu compañero de práctica de español. ¡Empecemos!",
      japanese: "こんにちは！私はあなたの日本語練習パートナーです。一緒に練習しましょう！",
      korean: "안녕하세요! 저는 한국어 연습 파트너입니다. 같이 연습해요!",
    };

    const scenarioIntro = settings.scenario === 'freeChat' 
      ? "Feel free to talk about anything you'd like." 
      : `Today we'll practice a ${settings.scenario} scenario at the ${settings.difficulty} level.`;

    return `${greetings[settings.language]}\n\n${scenarioIntro}`;
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual AI)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(content),
        timestamp: new Date(),
        suggestion: mode === 'practice' && Math.random() > 0.5 
          ? "You could also say: 'That sounds great!'" 
          : undefined,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const getAIResponse = (userMessage: string): string => {
    // Placeholder responses - will be replaced with actual AI
    const responses = [
      "That's a great point! Can you tell me more about that?",
      "Interesting! How do you feel about this situation?",
      "I understand. What would you do next in this scenario?",
      "Good observation! Let's continue with the conversation.",
      "That's correct! You're doing well. What else would you like to discuss?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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
      <Header isAdmin={true} />

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
