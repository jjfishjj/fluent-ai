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
import { LearningStyle, STYLE_INFO } from '@/lib/learning-styles';
import { analyzeMessage, updateProfile, getDominantStyle, VARKProfile } from '@/lib/vark-analyzer';
import { loadVARKProfile, saveVARKProfile } from '@/lib/vark-service';
import { loadGeniusType, geniusInfo, GeniusType, loadGeniusVark } from '@/lib/genius-type';
import { GENIUS_TASKS, GENIUS_SCENARIO } from '@/lib/genius-tasks';
import { addCard } from '@/lib/memory-srs';
import { TrainingPlanPanel } from '@/components/practice/TrainingPlanPanel';
import { DailyTrainingPanel } from '@/components/practice/DailyTrainingPanel';
import { markDailyDone, addReinforce, dailyChallenges, DailyChallenge } from '@/lib/genius-daily';
import { getRandomTip } from '@/lib/vark-recommendations';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { markUsed, markCompleted } from '@/lib/material-progress';
import { recordSessionEnd } from '@/lib/brainwave/behavioral-inference';

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
  // 記憶天才類型 (from same-origin standalone quiz) — adapts the AI partner
  const [geniusType, setGeniusType] = useState<GeniusType | null>(null);
  // VARK style derived from the genius quiz — unifies the quiz with the app's VARK system
  const [geniusVark, setGeniusVark] = useState<string | null>(null);
  // Effective VARK: explicit account style wins; otherwise adopt the quiz-derived one
  const effectiveLearningStyle = profile?.learning_style || geniusVark;
  // Practice view: AI 對話 / 訓練方案 / 每日訓練
  const [practiceView, setPracticeView] = useState<'chat' | 'plan' | 'daily'>('chat');
  const voiceUsedRef = useRef(false);
  const audioPlayedRef = useRef(false);
  const userMsgCountRef = useRef(0);
  const totalCharsRef = useRef(0);
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
    setGeniusType(loadGeniusType());
    setGeniusVark(loadGeniusVark());
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

  // Core conversation launcher — takes explicit settings + greeting so callers
  // don't depend on React state having flushed.
  const runConversation = async (settings: ConversationSettings, greetingPrompt: string) => {
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
      learningStyle: effectiveLearningStyle,
      geniusType,
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
        // Surface the error in the chat itself so it doesn't vanish with the toast
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'assistant' as const,
          content: `⚠️ ${msg}`,
          timestamp: new Date(),
        }]);
      },
    });
  };

  // Re-target an English-worded task prompt to the chosen practice language.
  const localizePrompt = (p: string) => p.replaceAll('English', currentLanguage?.name || selectedLanguage || 'the target language');

  const handleStartConversation = async () => {
    if (!selectedLanguage || !selectedScenario) return;
    const settings = getCurrentSettings();
    const langName = currentLanguage?.name || selectedLanguage;
    const greetingPrompt = materialPrompt
      ? localizePrompt(materialPrompt)
      : `Start the conversation with a greeting in ${langName}. Introduce the scenario "${selectedScenario.id}" at the ${difficulty} level. Keep it brief (2-3 sentences).`;
    await runConversation(settings, greetingPrompt);
  };

  // Save a word from the conversation straight into the SRS memory cards.
  const handleSaveCard = (english: string, meaning: string, note?: string) => {
    addCard(user?.id || 'guest', { english, meaning, encodeNote: note });
    toast.success('已加入記憶卡，今天就會出現在複習佇列');
  };

  // Launch a type-recommended training task in the currently selected language
  // (falls back to English when none is picked yet, e.g. from 訓練方案/每日訓練).
  const startTypeTask = async (prompt: string) => {
    const lang = selectedLanguage || 'english';
    const freeChat = SCENARIOS.find(sc => sc.id === 'freeChat') || SCENARIOS[0];
    setSelectedLanguage(lang);
    setSelectedScenario(freeChat);
    const langName = LANGUAGES.find(l => l.id === lang)?.name || lang;
    const localized = prompt.replaceAll('English', langName);
    setMaterialPrompt(localized);
    const settings: ConversationSettings = {
      language: lang,
      scenario: 'freeChat',
      difficulty,
      speed,
      tone,
      mode,
      instantCorrection,
    };
    await runConversation(settings, localized);
  };

  // 每日訓練完成 → 回饋強化 VARK profile + 天賦量表累積
  const reinforceFromChallenge = (c: DailyChallenge) => {
    const uid = user?.id || 'guest';
    const base = varkProfile || loadVARKProfile(uid);
    const updated = updateProfile(base, [{ style: c.vark, weight: 2 }]);
    saveVARKProfile(uid, updated);
    setVarkProfile(updated);
    addReinforce(uid, c.dimLabel);
    toast.success(`訓練完成！已強化 ${c.dimLabel} · 量表已更新`);
  };

  const handleDailyComplete = (c: DailyChallenge) => reinforceFromChallenge(c);

  const handleDailyLaunch = (prompt: string, idx: number) => {
    // Launching the AI session counts as doing the challenge.
    const uid = user?.id || 'guest';
    markDailyDone(uid, idx);
    if (geniusType) {
      const c = dailyChallenges(geniusType)[idx];
      if (c) reinforceFromChallenge(c);
    }
    startTypeTask(prompt);
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

    // Track message length for behavioral brain state inference
    userMsgCountRef.current += 1;
    totalCharsRef.current += content.length;
    const avgChars = Math.round(totalCharsRef.current / userMsgCountRef.current);
    if (brainMode === 'behavioral') {
      updateBehaviorSignals(userMsgCountRef.current, avgChars);
    }

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
      learningStyle: effectiveLearningStyle,
      geniusType,
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
          const parsed = parseCorrections(assistantContent);
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
        // Surface the error in the chat itself so it doesn't vanish with the toast
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'assistant' as const,
          content: `⚠️ ${msg}`,
          timestamp: new Date(),
        }]);
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
        geniusType={geniusType}
        onSaveCard={handleSaveCard}
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
        <Button variant="ghost" className="mb-6" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Memory-Genius type: shows the AI is adapting, or links to the assessment */}
        {(() => {
          const gi = geniusInfo(geniusType);
          return gi ? (
            <div className="max-w-4xl mx-auto mb-6 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <span className="text-xl">{gi.emoji}</span>
              <div className="text-sm flex-1">
                <span className="text-muted-foreground">練習時，AI 會依你的記憶天才類型</span>
                <span className="font-semibold text-indigo-700 mx-1">{gi.nameZh} · {gi.nameEn}</span>
                <span className="text-muted-foreground">調整教學（{gi.vark} · {gi.brainwave}）</span>
              </div>
              <a href="/quizzes/memory-genius-quiz/" className="text-xs text-indigo-600 hover:underline shrink-0">重新測定</a>
            </div>
          ) : (
            <a
              href="/quizzes/memory-genius-quiz/"
              className="max-w-4xl mx-auto mb-6 flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3 hover:shadow-sm transition-shadow"
            >
              <span className="text-xl">🧠</span>
              <div className="text-sm flex-1">
                <span className="font-semibold">做 5 分鐘記憶天才測定</span>
                <span className="text-muted-foreground">，讓 AI 依你的學習型態（8 種天才類型 × VARK）調整任何語言的教學方式</span>
              </div>
              <span className="text-indigo-600 shrink-0">→</span>
            </a>
          );
        })()}

        {/* VARK learning style indicator */}
        {(() => {
          const style = effectiveLearningStyle as LearningStyle | null;
          const styleData = style ? STYLE_INFO[style] : null;
          if (styleData) {
            return (
              <div className="max-w-4xl mx-auto mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5"
                style={{ borderColor: styleData.color + '44', background: styleData.color + '0d' }}>
                <span className="text-lg">{styleData.emoji}</span>
                <span className="text-sm flex-1">
                  <span className="text-muted-foreground">AI 教學風格已調整為</span>
                  <span className="font-semibold mx-1" style={{ color: styleData.color }}>{styleData.name}</span>
                  <span className="text-muted-foreground text-xs">· {styleData.nameEn}</span>
                </span>
                <button onClick={() => navigate('/quiz')} className="text-xs hover:underline shrink-0" style={{ color: styleData.color }}>重新測驗</button>
              </div>
            );
          }
          return (
            <button onClick={() => navigate('/quiz')}
              className="max-w-4xl mx-auto mb-4 w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors text-left">
              <span className="text-xl">🎯</span>
              <div className="text-sm flex-1">
                <span className="font-semibold">做 VARK 學習型態測驗</span>
                <span className="text-muted-foreground">，讓 AI 依你的風格（視覺／聽覺／讀寫／動覺）調整教學</span>
              </div>
              <span className="text-primary shrink-0">→</span>
            </button>
          );
        })()}

        {/* Practice view switcher: AI 對話 / 訓練方案 / 每日訓練 */}
        <div className="max-w-4xl mx-auto mb-6 grid grid-cols-3 gap-2">
          {([
            { key: 'chat' as const, emoji: '💬', label: 'AI 對話' },
            { key: 'plan' as const, emoji: '📋', label: '訓練方案' },
            { key: 'daily' as const, emoji: '🎯', label: '每日訓練' },
          ]).map(v => (
            <button
              key={v.key}
              onClick={() => setPracticeView(v.key)}
              className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                practiceView === v.key
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-slate-200 text-muted-foreground hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        {/* 介面一：訓練方案 — 每個天分的完整訓練方法 */}
        {practiceView === 'plan' && (
          <TrainingPlanPanel userType={geniusType} onLaunch={(p) => startTypeTask(p)} />
        )}

        {/* 介面二：每日訓練 — 每天輪換挑戰卡 + 量表回饋 */}
        {practiceView === 'daily' && (
          geniusType ? (
            <DailyTrainingPanel
              uid={user?.id || 'guest'}
              userType={geniusType}
              varkProfile={varkProfile}
              onLaunch={handleDailyLaunch}
              onComplete={handleDailyComplete}
            />
          ) : (
            <div className="max-w-3xl mx-auto">
              <a href="/quizzes/memory-genius-quiz/" className="block text-center rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-8 hover:shadow-sm transition-shadow">
                <div className="text-3xl mb-2">🧠</div>
                <p className="font-semibold">先做 5 分鐘記憶天才測定</p>
                <p className="text-sm text-muted-foreground mt-1">測出型態後，每天會有專屬你的訓練挑戰卡 →</p>
              </a>
            </div>
          )
        )}

        {practiceView === 'chat' && (!selectedLanguage ? (
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

            {/* #1 為你的型態推薦課題 (any language + type known) */}
            {selectedLanguage && geniusType && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold">為你的型態推薦</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {geniusInfo(geniusType)?.emoji} {geniusInfo(geniusType)?.nameZh}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {GENIUS_TASKS[geniusType].map((task, i) => (
                    <button
                      key={i}
                      onClick={() => startTypeTask(task.prompt)}
                      className="text-left rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="font-semibold text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.desc}</div>
                      <div className="text-xs text-indigo-600 font-medium mt-2">用 AI 練習 →</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <ScenarioSelector
              selectedScenario={selectedScenario}
              onSelectScenario={setSelectedScenario}
              recommendedCategory={geniusType ? GENIUS_SCENARIO[geniusType].scenario : undefined}
              recommendedReason={geniusType ? GENIUS_SCENARIO[geniusType].reason : undefined}
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
        ))}
      </div>
    </div>
  );
};

export default Practice;
