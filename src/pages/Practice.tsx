import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { ScenarioSelector } from '@/components/practice/ScenarioSelector';
import { ChatInterface } from '@/components/practice/ChatInterface';
import { Button } from '@/components/ui/button';
import { LANGUAGES, SCENARIOS } from '@/lib/constants';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft } from 'lucide-react';
import { createConversation, saveMessage } from '@/lib/conversation-service';
import { streamChat } from '@/lib/stream-chat';
import { parseCorrections } from '@/lib/parse-corrections';
import { generateImage, uploadChatImage } from '@/lib/image-service';
import { toast } from 'sonner';
import { LearningStyle } from '@/lib/learning-styles';
import { analyzeMessage, updateProfile, getDominantStyle, VARKProfile } from '@/lib/vark-analyzer';
import { loadVARKProfile, saveVARKProfile } from '@/lib/vark-service';
import { getRandomTip } from '@/lib/vark-recommendations';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { VARK_MATERIALS } from '@/lib/vark-materials-library';
import { markUsed, markCompleted } from '@/lib/material-progress';
import { recordSessionEnd } from '@/lib/brainwave/behavioral-inference';

// Remember the last language so material-driven practice can start in one tap.
const LAST_LANG_KEY = 'fluent_last_language';
function loadLastLanguage(): Language | null {
  const v = localStorage.getItem(LAST_LANG_KEY) as Language | null;
  return v && LANGUAGES.find(l => l.id === v) ? v : null;
}
function persistLastLanguage(lang: Language) {
  localStorage.setItem(LAST_LANG_KEY, lang);
}

// Synthetic scenario for VARK material-guided sessions: the material prompt
// itself defines the activity, so no scenario configuration is needed.
const MATERIAL_SCENARIO: Scenario = {
  id: 'vark-practice',
  category: 'freeChat',
  name: 'Guided Practice',
  description: 'VARK material-guided practice session',
  icon: '🎯',
};

const Practice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { mode: brainMode, updateBehaviorSignals } = useBrainwave();

  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [speed, setSpeed] = useState<SpeechSpeed>('normal');
  const [tone, setTone] = useState<ToneStyle>('semi-formal');
  const [mode, setMode] = useState<ConversationMode>('practice');
  const [instantCorrection, setInstantCorrection] = useState(true);
  const [romanization, setRomanization] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isInConversation, setIsInConversation] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Material prompt injected from Brain Lab materials library
  const [materialPrompt, setMaterialPrompt] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);

  // VARK tracking
  const [varkProfile, setVarkProfile] = useState<VARKProfile | null>(null);
  const [varkTip, setVarkTip] = useState<{ style: LearningStyle; message: string } | null>(null);
  const voiceUsedRef = useRef(false);
  const audioPlayedRef = useRef(false);
  const userMsgCountRef = useRef(0);
  const totalCharsRef = useRef(0);
  const avgCharsRef = useRef(0);
  const correctionCountRef = useRef(0);
  const isFirstMsgRef = useRef(true);

  useEffect(() => {
    const lang = searchParams.get('lang') as Language;
    if (lang && LANGUAGES.find(l => l.id === lang)) {
      setSelectedLanguage(lang);
    }
    const prompt = searchParams.get('prompt');
    if (prompt) setMaterialPrompt(decodeURIComponent(prompt));
    const mid = searchParams.get('materialId');
    if (mid) setMaterialId(mid);
  }, [searchParams]);

  useEffect(() => {
    const uid = user?.id || 'guest';
    setVarkProfile(loadVARKProfile(uid));
  }, [user?.id]);

  const currentLanguage = LANGUAGES.find(l => l.id === selectedLanguage);

  const getCurrentSettings = (): ConversationSettings => ({
    language: selectedLanguage!,
    languageVariant: selectedVariant || undefined,
    scenario: selectedScenario!.id,
    difficulty,
    speed,
    tone,
    mode,
    instantCorrection,
    romanization: currentLanguage?.supportsRomanization ? romanization : undefined,
  });

  const handleGenerateImage = async (aiContent: string, convId: string | null) => {
    if (!imageMode || !selectedLanguage) return;
    setIsGeneratingImage(true);
    try {
      const result = await generateImage(aiContent.slice(0, 200), selectedLanguage);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.imageUrl) {
        const imgMsg: Message = {
          id: `img-${Date.now()}`,
          role: 'assistant',
          content: result.text || '',
          imageUrl: result.imageUrl,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, imgMsg]);
        if (user && convId) {
          saveMessage(convId, {
            role: 'assistant',
            content: result.text || '🖼️',
            imageUrl: result.imageUrl,
          });
        }
      }
    } catch {
      toast.error('圖片生成失敗');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Core launcher: starts a conversation with an explicit language/scenario so
  // it doesn't depend on React state being flushed (used by both the normal
  // config flow and the one-tap material flow).
  const beginConversation = async (lang: Language, scenario: Scenario, greetingPrompt: string) => {
    const langConfig = LANGUAGES.find(l => l.id === lang);
    const settings: ConversationSettings = {
      language: lang,
      languageVariant: selectedVariant || undefined,
      scenario: scenario.id,
      difficulty,
      speed,
      tone,
      mode,
      instantCorrection,
      romanization: langConfig?.supportsRomanization ? romanization : undefined,
    };

    let newConvId: string | null = null;
    if (user) {
      const id = await createConversation(settings, user.id);
      newConvId = id || null;
      setConversationId(newConvId);
    }

    setMessages([]);
    setIsInConversation(true);
    setIsLoading(true);
    setVarkTip(null);
    userMsgCountRef.current = 0;
    totalCharsRef.current = 0;
    avgCharsRef.current = 0;
    correctionCountRef.current = 0;
    isFirstMsgRef.current = true;
    voiceUsedRef.current = false;
    audioPlayedRef.current = false;

    // Record usage in material progress
    if (materialId && user) markUsed(user.id, materialId);

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
        handleGenerateImage(assistantContent, newConvId);
      },
      onError: (msg) => {
        setIsLoading(false);
        toast.error(msg);
      },
    });
  };

  const handleStartConversation = async () => {
    if (!selectedLanguage || !selectedScenario) return;
    persistLastLanguage(selectedLanguage);
    const greetingPrompt = materialPrompt
      ? materialPrompt
      : `Start the conversation with a greeting in ${selectedLanguage}. Introduce the scenario "${selectedScenario.id}" at the ${difficulty} level. Keep it brief (2-3 sentences).`;
    await beginConversation(selectedLanguage, selectedScenario, greetingPrompt);
  };

  // One-tap start for a VARK material: skip the scenario-config page entirely;
  // the chosen language is all that's needed since the material defines the activity.
  const startMaterialSession = async (lang: Language) => {
    if (!materialPrompt) return;
    setSelectedLanguage(lang);
    setSelectedScenario(MATERIAL_SCENARIO);
    persistLastLanguage(lang);
    await beginConversation(lang, MATERIAL_SCENARIO, materialPrompt);
  };

  const handleSendMessage = async (content: string, imageBase64?: string, videoFrames?: string[], urlContext?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      imageUrl: imageBase64,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Track message length for error rate computation in onDone
    userMsgCountRef.current += 1;
    totalCharsRef.current += content.length;
    avgCharsRef.current = Math.round(totalCharsRef.current / userMsgCountRef.current);

    // Collect VARK signals for this message
    if (varkProfile && selectedLanguage && selectedScenario) {
      const signals = analyzeMessage(content, getCurrentSettings(), {
        hasImage: !!imageBase64,
        hasVideo: !!(videoFrames?.length),
        usedVoice: voiceUsedRef.current,
        usedAudio: audioPlayedRef.current,
      });
      voiceUsedRef.current = false;
      audioPlayedRef.current = false;

      const isNew = isFirstMsgRef.current;
      isFirstMsgRef.current = false;
      const updated = updateProfile(varkProfile, signals, isNew);
      setVarkProfile(updated);
      saveVARKProfile(user?.id || 'guest', updated);

      // Show VARK tip after 5th message, then every 10 messages
      const count = userMsgCountRef.current;
      if ((count === 5 || (count > 5 && (count - 5) % 10 === 0)) && updated.totalSignals >= 5) {
        const dominant = getDominantStyle(updated);
        setVarkTip({ style: dominant, message: getRandomTip(dominant) });
      }
    }

    // Upload image to storage if present
    let storedImageUrl: string | undefined;
    if (imageBase64 && user) {
      storedImageUrl = imageBase64;
    }

    if (user && conversationId) {
      saveMessage(conversationId, { 
        role: 'user', 
        content,
        imageUrl: storedImageUrl,
      });
    }

    // Build chat history - support multimodal
    const chatHistory = newMessages.map(m => {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      if (m.content) {
        parts.push({ type: 'text', text: m.content });
      }

      if (m.imageUrl && m.role === 'user') {
        parts.push({ type: 'image_url', image_url: { url: m.imageUrl } });
      }

      if (parts.length > 1) {
        return { role: m.role as 'user' | 'assistant', content: parts };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

    // If video frames, add them to the last user message
    if (videoFrames && videoFrames.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      const frameParts = videoFrames.map(f => ({ type: 'image_url' as const, image_url: { url: f } }));
      if (Array.isArray(lastMsg.content)) {
        (lastMsg.content as any[]).push(...frameParts);
      } else {
        lastMsg.content = [
          { type: 'text', text: lastMsg.content as string },
          ...frameParts,
        ];
      }
    }

    // If URL context, prepend it to the last user message
    if (urlContext) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      const contextPrefix = `[The user shared a link. Here is the content from that link for context:\n${urlContext}\n]\n\n`;
      if (Array.isArray(lastMsg.content)) {
        const textPart = (lastMsg.content as any[]).find((p: any) => p.type === 'text');
        if (textPart) {
          textPart.text = contextPrefix + (textPart.text || '');
        } else {
          (lastMsg.content as any[]).unshift({ type: 'text', text: contextPrefix });
        }
      } else {
        lastMsg.content = contextPrefix + (lastMsg.content as string);
      }
    }

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
        const parsed = parseCorrections(assistantContent);

        // Track correction rate for behavioral brain state inference
        if (parsed.correction) correctionCountRef.current += 1;
        if (brainMode === 'behavioral') {
          const errorRate = userMsgCountRef.current > 0
            ? correctionCountRef.current / userMsgCountRef.current
            : 0.15;
          updateBehaviorSignals(userMsgCountRef.current, avgCharsRef.current, errorRate);
        }

        if (user && conversationId) {
          saveMessage(conversationId, {
            role: 'assistant',
            content: parsed.content,
            correction: parsed.correction || undefined,
            suggestion: parsed.suggestion || undefined,
          });
        }
        handleGenerateImage(assistantContent, conversationId);
      },
      onError: (msg) => {
        setIsLoading(false);
        toast.error(msg);
      },
    });
  };

  const handleBack = () => {
    if (isInConversation) {
      // Persist session end time so behavioral inference can compute daysSinceLastSession
      recordSessionEnd();
      // Auto-mark material completed if user sent ≥3 messages
      if (materialId && user && userMsgCountRef.current >= 3) {
        markCompleted(user.id, materialId);
      }
      setIsInConversation(false);
      setMessages([]);
      setMaterialPrompt(null);
      setMaterialId(null);
    } else if (selectedLanguage) {
      setSelectedLanguage(null);
      setSelectedScenario(null);
    } else {
      navigate('/');
    }
  };

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
        imageMode={imageMode}
        onImageModeChange={setImageMode}
        isGeneratingImage={isGeneratingImage}
        varkTip={varkTip}
        onVarkTipDismiss={() => setVarkTip(null)}
        onVoiceUsed={() => { voiceUsedRef.current = true; }}
        onAudioPlayed={() => { audioPlayedRef.current = true; }}
      />
    );
  }

  // Material-driven entry: skip the scenario-config page. The material already
  // defines the activity — the user only picks a language to start in one tap.
  if (materialPrompt && !isInConversation) {
    const material = VARK_MATERIALS.find(m => m.id === materialId);
    const remembered = loadLastLanguage();
    const orderedLangs = remembered
      ? [...LANGUAGES].sort((a, b) => (a.id === remembered ? -1 : b.id === remembered ? 1 : 0))
      : LANGUAGES;
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
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/brain-lab')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回 Brain Lab
          </Button>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🎯</span>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">已選練習素材</span>
              </div>
              <h1 className="text-2xl font-display font-bold">
                {material ? material.titleZh : '練習素材'}
              </h1>
              {material && (
                <p className="text-sm text-muted-foreground mt-1">{material.descriptionZh}</p>
              )}
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-semibold">選擇語言即可開始</h2>
              <p className="text-sm text-muted-foreground">
                選好語言後直接進入對話，AI 會依此素材引導你練習
                {remembered && '（已置頂你上次使用的語言）'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {orderedLangs.map((language) => (
                <button
                  key={language.id}
                  onClick={() => startMaterialSession(language.id)}
                  className={`language-card lang-${language.id} ${language.id === remembered ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="relative z-10 text-left w-full">
                    <div className="text-3xl mb-2 flag-emoji">{language.flag}</div>
                    <h3 className="font-semibold text-sm lang-name">{language.name}</h3>
                    <p className="text-xs text-muted-foreground">{language.nativeName}</p>
                    {language.id === remembered && (
                      <span className="text-[10px] text-primary font-medium">上次使用 ·一鍵開始</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
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
        <Button variant="ghost" className="mb-6" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {LANGUAGES.map((language) => (
                <button
                  key={language.id}
                  onClick={() => {
                    setSelectedLanguage(language.id);
                    setRomanization(false);
                    setSelectedVariant(null);
                  }}
                  className={`language-card lang-${language.id}`}
                >
                  <div className="relative z-10 text-left w-full">
                    <div className="text-3xl mb-2 flag-emoji">{language.flag}</div>
                    <h3 className="font-semibold text-sm lang-name">{language.name}</h3>
                    <p className="text-xs text-muted-foreground">{language.nativeName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
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

            {/* Variant selector for languages with variants */}
            {currentLanguage?.variants && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">選擇變體 / Select Variant</h3>
                <div className="flex gap-3 flex-wrap">
                  {currentLanguage.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        selectedVariant === v.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Romanization toggle for supported languages */}
            {currentLanguage?.supportsRomanization && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Switch
                  checked={romanization}
                  onCheckedChange={setRomanization}
                  id="romanization"
                />
                <Label htmlFor="romanization" className="cursor-pointer">
                  <span className="font-medium">英文拼音輔助 (Romanization)</span>
                  <span className="block text-xs text-muted-foreground">
                    對話中附上拼音/羅馬字以方便閱讀
                  </span>
                </Label>
              </div>
            )}

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
