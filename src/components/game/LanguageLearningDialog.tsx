import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Flame, Globe2,
  LockKeyhole, Map, RotateCcw, Sparkles, Volume2, XCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ALL_LANGUAGE_LESSONS, LANGUAGE_PACKS } from '@/game/data/language-packs';
import type { LanguageLesson, LearningRegionId, LessonLevel, TargetLanguage } from '@/game/data/language-lessons';
import { addCard, loadCards, reviewCard } from '@/lib/memory-srs';
import { loadGeniusType } from '@/lib/genius-type';
import { planFor } from '@/lib/genius-plan';
import {
  completeDailyChallenge, dailyStreak, filterAvailableLessons, isRegionUnlocked,
  LEARNING_REGIONS, loadLearningProgress, localDateKey, markLessonCompleted,
  mergeMemoryReviews, recordLessonReview, selectDailyLessons, TARGET_LANGUAGE_OPTIONS,
  updateLearningPreferences, type DailyGoal, type LevelFilter,
} from '@/game/data/language-learning-progress';
import { shuffleLessonChoices } from '@/game/data/language-lessons';
import './LanguageLearningDialog.css';

type Stage = 'home' | 'study' | 'challenge' | 'result';
type Grade = 'again' | 'good';
type SessionKind = 'daily' | 'region';
const DAILY_GOALS: DailyGoal[] = [5, 8, 10];
const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: '全部程度' },
  { value: 'beginner', label: '初階' },
  { value: 'intermediate', label: '中階' },
];

export function LanguageLearningDialog({
  open,
  onOpenChange,
  userId,
  onCorrect,
  onDailyComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCorrect: () => void;
  onDailyComplete: (bonusExp: number) => void;
}) {
  const [, setRevision] = useState(0);
  const [stage, setStage] = useState<Stage>('home');
  const [sessionKind, setSessionKind] = useState<SessionKind>('daily');
  const [sessionLessons, setSessionLessons] = useState<LanguageLesson[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [dailyBonus, setDailyBonus] = useState(false);
  const [resultStreak, setResultStreak] = useState(0);

  const progress = loadLearningProgress(userId);
  const preferences = progress.preferences;
  const targetLanguage = preferences.targetLanguage;
  const selectedLevel = preferences.level;
  const goal = preferences.dailyGoal;
  const completedIds = progress.completedLessonIds[targetLanguage];
  const memoryCards = targetLanguage === 'en' ? loadCards(userId) : [];
  const reviews = mergeMemoryReviews(progress.reviews[targetLanguage], memoryCards);
  const availableLessons = filterAvailableLessons(ALL_LANGUAGE_LESSONS, targetLanguage, selectedLevel, completedIds);
  const dailyPlan = selectDailyLessons(availableLessons, reviews, goal);
  const lesson = sessionLessons[index];
  const today = localDateKey();
  const completedToday = progress.completedDailyDates.includes(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dailyStats = {
    completedToday,
    streak: dailyStreak(progress.completedDailyDates, completedToday ? today : localDateKey(yesterday)),
  };

  const savePreferences = (next: Parameters<typeof updateLearningPreferences>[1]) => {
    updateLearningPreferences(userId, next);
    setRevision((current) => current + 1);
  };

  const close = () => {
    window.speechSynthesis?.cancel();
    setStage('home');
    onOpenChange(false);
  };

  const speak = (card: LanguageLesson) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.word);
    utterance.lang = card.locale;
    utterance.rate = card.targetLanguage === 'ja' ? 0.88 : 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const recordReview = (card: LanguageLesson, grade: Grade) => {
    try {
      recordLessonReview(userId, card.targetLanguage, card.id, grade);
      if (grade === 'good') markLessonCompleted(userId, card.targetLanguage, card.id);
      if (card.targetLanguage === 'en') {
        const existing = loadCards(userId).find((candidate) => candidate.english.toLowerCase() === card.word.toLowerCase());
        let item = existing;
        if (!item) {
          const updated = addCard(userId, {
            english: card.word,
            meaning: card.meaning,
            encodeNote: `${card.scene}｜${card.sentence.replace('___', card.word)}｜諧音鉤子：${card.mnemonic}`,
          });
          item = updated.find((candidate) => candidate.english.toLowerCase() === card.word.toLowerCase());
        }
        if (item) reviewCard(userId, item.id, grade, planFor(loadGeniusType()).schedule);
      }
      setRevision((current) => current + 1);
    } catch (error) {
      // The lesson remains playable when browser storage is unavailable.
      console.warn('[xianjing-learning] could not save the review locally.', error);
    }
  };

  const startSession = (cards: LanguageLesson[], kind: SessionKind) => {
    if (!cards.length) return;
    setSessionLessons(cards);
    setSessionKind(kind);
    setIndex(0);
    setFlipped(false);
    setChosen(null);
    setScore(0);
    setDailyBonus(kind === 'daily' && !dailyStats.completedToday);
    setChoices(shuffleLessonChoices(cards[0].choices));
    setStage('study');
  };

  const startDaily = () => startSession(dailyPlan, 'daily');

  const startRegion = (region: LearningRegionId) => {
    const cards = availableLessons.filter((candidate) => candidate.region === region);
    startSession(cards, 'region');
  };

  const answer = (choice: string) => {
    if (!lesson || chosen) return;
    setChosen(choice);
    const correct = choice === lesson.word;
    recordReview(lesson, correct ? 'good' : 'again');
    if (correct) {
      setScore((current) => current + 1);
      onCorrect();
    }
  };

  const nextLesson = () => {
    if (!lesson || !chosen) return;
    if (index === sessionLessons.length - 1) {
      if (sessionKind === 'daily') {
        const completion = completeDailyChallenge(userId, localDateKey());
        const bonus = dailyBonus && !completion.wasAlreadyComplete ? 10 : 0;
        if (bonus) onDailyComplete(bonus);
        setResultStreak(completion.streakDays);
        setRevision((current) => current + 1);
      }
      setStage('result');
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setChoices(shuffleLessonChoices(sessionLessons[nextIndex].choices));
    setFlipped(false);
    setChosen(null);
    setStage('study');
  };

  const restart = () => {
    const today = localDateKey();
    setIndex(0);
    setStage('study');
    setFlipped(false);
    setChosen(null);
    setScore(0);
    setDailyBonus(sessionKind === 'daily' && !loadLearningProgress(userId).completedDailyDates.includes(today));
    setChoices(shuffleLessonChoices(sessionLessons[0]?.choices ?? []));
  };

  const selectLanguage = (language: TargetLanguage) => {
    savePreferences({ targetLanguage: language, ...(language === 'ja' ? { level: 'beginner' } : {}) });
  };

  const beginStudy = (card: LanguageLesson) => {
    setFlipped(false);
    setChosen(null);
    setChoices(shuffleLessonChoices(card.choices));
    setStage('challenge');
  };

  const progressCount = Math.min(index + (stage === 'result' ? 1 : 0), sessionLessons.length);
  const currentRegion = lesson ? LEARNING_REGIONS.find((region) => region.id === lesson.region) : undefined;
  const related = lesson?.relatedWords.find((item) => item.word.toLocaleLowerCase() === (chosen ?? '').toLocaleLowerCase())
    ?? lesson?.relatedWords[0];

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto border-amber-200/20 bg-slate-950/95 text-white shadow-2xl shadow-cyan-950/30 sm:rounded-2xl">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
            <Sparkles className="h-3.5 w-3.5" /> 青雲村・記憶祭壇
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-amber-300" /> 語言修行
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-white/60">
            每日挑選到期、曾答錯或尚未熟悉的詞卡；答題與複習進度會保存在這台裝置。
          </DialogDescription>
        </DialogHeader>

        {stage === 'home' && (
          <div className="space-y-4 pb-1">
            <section className="rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-400/10 via-slate-900/70 to-amber-300/5 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><CalendarDays className="h-4 w-4" /> 每日修行</div>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">優先複習快忘或答錯的字，再補上新詞。</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                  <Flame className="h-3.5 w-3.5" /> 連續 {dailyStats.streak} 天
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs text-white/55">每日題數</span>
                {DAILY_GOALS.map((count) => (
                  <button key={count} type="button" onClick={() => savePreferences({ dailyGoal: count })}
                    className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition ${goal === count ? 'border-cyan-200/70 bg-cyan-200/15 text-cyan-50' : 'border-white/15 bg-white/5 text-white/65 hover:bg-white/10'}`}>
                    {count} 題
                  </button>
                ))}
                <span className="text-xs text-white/45">最多 {dailyPlan.length} 題可練</span>
              </div>
              <button type="button" onClick={startDaily} disabled={!dailyPlan.length}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                {dailyStats.completedToday ? '今日已完成・再練一輪' : '開始今日修行'} <ArrowRight className="h-4 w-4" />
              </button>
              {dailyStats.completedToday && <p className="mt-2 text-center text-xs text-emerald-200/80">今天已完成每日任務；重練仍會更新單字複習紀錄。</p>}
              {!dailyPlan.length && <p className="mt-2 text-center text-xs text-amber-100/80">目前選擇的程度沒有可用詞卡，請切換程度或解鎖新區域。</p>}
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4 text-cyan-200" /> 學習包設定</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-white/55">
                  目標語言
                  <select aria-label="目標語言" value={targetLanguage} onChange={(event) => selectLanguage(event.target.value as TargetLanguage)}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-200/60">
                    {TARGET_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}・{option.detail}</option>)}
                  </select>
                </label>
                <div className="text-xs text-white/55">
                  程度
                  <div className="mt-1.5 grid min-h-11 grid-cols-3 gap-1.5">
                    {LEVEL_OPTIONS.map((option) => {
                      const disabled = targetLanguage === 'ja' && option.value === 'intermediate';
                      return <button key={option.value} type="button" disabled={disabled} onClick={() => savePreferences({ level: option.value })}
                        className={`rounded-lg border px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${selectedLevel === option.value ? 'border-amber-200/60 bg-amber-200/15 text-amber-50' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'}`}>
                        {option.label}
                      </button>;
                    })}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/45">解說、例句翻譯與記憶提示皆以繁體中文呈現。日文目前提供村莊入門詞庫。</p>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Map className="h-4 w-4 text-amber-200" /> 分區任務與詞庫</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {LEARNING_REGIONS.filter((region) => targetLanguage === 'en' || region.id === 'village').map((region) => {
                  const unlocked = isRegionUnlocked(targetLanguage, region.id, completedIds);
                  const regionLessons = LANGUAGE_PACKS[targetLanguage].filter((card) => card.region === region.id && (selectedLevel === 'all' || card.level === selectedLevel));
                  const allRegionLessons = LANGUAGE_PACKS[targetLanguage].filter((card) => card.region === region.id);
                  const finished = allRegionLessons.filter((card) => completedIds.includes(card.id)).length;
                  const villageProgress = ['meet', 'right', 'borrow', 'tell', 'bring', 'dessert'].filter((id) => completedIds.includes(id)).length;
                  const forestProgress = ['hear', 'lose', 'follow', 'search', 'quiet', 'protect'].filter((id) => completedIds.includes(id)).length;
                  const requirement = region.id === 'forest' ? '完成村莊 5 張初階詞卡解鎖' : region.id === 'ruins' ? '完成村莊與森林各 5 張解鎖' : '從這裡開始';
                  return (
                    <article key={region.id} className={`rounded-xl border p-3 ${unlocked ? 'border-white/12 bg-white/[0.035]' : 'border-white/8 bg-slate-900/45 opacity-65'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div><div className="text-sm font-bold text-white/90">{region.name}</div><div className="mt-0.5 text-[10px] text-cyan-100/70">{region.theme}</div></div>
                        {unlocked ? <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] text-emerald-100">已開放</span> : <LockKeyhole className="h-4 w-4 shrink-0 text-white/45" />}
                      </div>
                      <p className="mt-2 min-h-9 text-[11px] leading-relaxed text-white/55">{unlocked ? region.description : requirement}</p>
                      {unlocked && <div className="mt-2 text-[10px] text-white/45">詞卡 {finished}/{allRegionLessons.length} · {regionLessons.length ? `${regionLessons[0].level === 'beginner' ? '初階' : '中階'}任務` : '切換程度查看詞卡'}</div>}
                      {!unlocked && targetLanguage === 'en' && <div className="mt-2 text-[10px] text-amber-100/70">解鎖進度：{region.id === 'forest' ? `村莊 ${villageProgress}/5` : `村莊 ${villageProgress}/5・森林 ${forestProgress}/5`}</div>}
                      <button type="button" onClick={() => startRegion(region.id)} disabled={!unlocked || !regionLessons.length}
                        className="mt-3 min-h-11 w-full rounded-lg border border-cyan-200/20 bg-cyan-200/5 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-35">
                        {unlocked ? (regionLessons.length ? '開始區域任務' : '切換程度以練習') : '尚未解鎖'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {(stage === 'study' || stage === 'challenge') && lesson && (
          <div className="space-y-3 pb-1">
            <div className="flex items-center justify-between gap-2 text-xs text-white/60">
              <button type="button" onClick={() => setStage('home')} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-white/70 hover:bg-white/5"><ArrowLeft className="h-3.5 w-3.5" /> 回選單</button>
              <span>{sessionKind === 'daily' ? '每日修行' : currentRegion?.name} · {lesson.level === 'beginner' ? '初階' : '中階'}</span>
              <span className="text-amber-100">{score} 題答對</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/55"><span>第 {index + 1} 張／共 {sessionLessons.length} 張</span><span>答對每題 +3 經驗</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 transition-all duration-500" style={{ width: `${(progressCount / sessionLessons.length) * 100}%` }} /></div>

            {stage === 'study' && (
              <div className="space-y-3 pt-1">
                <div className="learning-card-stage" aria-live="polite">
                  <div className={`learning-card-inner ${flipped ? 'is-flipped' : ''}`}>
                    <div className="learning-card-face learning-card-front">
                      <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] text-cyan-100/80">{lesson.scene}</span>
                      <div className="mt-4 text-center">
                        <div className="break-words text-4xl font-black tracking-wide text-white sm:text-5xl">{lesson.word}</div>
                        <div className="mt-1 text-sm text-cyan-100/65">{lesson.phonetic}</div>
                        <button type="button" onClick={() => speak(lesson)} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10" aria-label={`播放 ${lesson.word} 的發音`}>
                          <Volume2 className="h-4 w-4" /> 聽發音
                        </button>
                      </div>
                      <p className="mt-auto text-center text-xs text-white/60">先想想它的意思，再翻開記憶卡</p>
                    </div>

                    <div className="learning-card-face learning-card-back">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-200/70">記憶卡背面</div>
                          <div className="mt-1 break-words text-2xl font-bold text-white">{lesson.word}<span className="ml-2 text-sm font-normal text-white/50">{lesson.phonetic}</span></div>
                          <div className="mt-1 text-lg font-semibold text-cyan-100">{lesson.meaning}</div>
                        </div>
                        <button type="button" onClick={() => speak(lesson)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/15 text-white/70 hover:bg-white/10" aria-label={`播放 ${lesson.word} 的發音`}><Volume2 className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                        <div className="text-[10px] font-semibold text-amber-100/75">情境例句</div>
                        <p className="mt-1 text-sm font-medium text-white">{lesson.sentence.replace('___', lesson.word)}</p>
                        <p className="mt-0.5 text-xs text-white/55">{lesson.translation}</p>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {lesson.relatedWords.map((relatedWord) => <div key={relatedWord.word} className="rounded-lg border border-cyan-100/10 bg-cyan-200/5 p-2">
                          <div className="text-xs font-semibold text-cyan-100">{relatedWord.word}<span className="ml-1 font-normal text-white/65">{relatedWord.meaning}</span></div>
                          <div className="mt-1 text-[10px] leading-relaxed text-white/55">{relatedWord.relation}</div>
                        </div>)}
                      </div>
                      <div className="mt-2 rounded-lg border border-amber-200/15 bg-amber-300/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber-50/85"><span className="font-semibold text-amber-200">記憶提示：</span>{lesson.mnemonic}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => setFlipped((value) => !value)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"><RotateCcw className="h-4 w-4" /> {flipped ? '翻回正面' : '翻開答案'}</button>
                  <button type="button" onClick={() => beginStudy(lesson)} disabled={!flipped} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">挑戰情境 <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            {stage === 'challenge' && (
              <div className="space-y-3 pt-1">
                <div className="rounded-xl border border-cyan-200/15 bg-cyan-300/5 p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-cyan-100/75"><Sparkles className="h-3.5 w-3.5" /> 情境任務・{lesson.scene}</div>
                  <p className="break-words text-base font-semibold leading-relaxed text-white sm:text-lg">{lesson.sentence}</p>
                  <p className="mt-1 text-xs text-white/50">選出最適合填入空格的單字</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {choices.map((choice) => {
                    const isCorrect = choice === lesson.word;
                    const isChosen = choice === chosen;
                    const style = chosen
                      ? isCorrect ? 'border-emerald-300/70 bg-emerald-400/15 text-emerald-100' : isChosen ? 'border-rose-300/70 bg-rose-400/15 text-rose-100' : 'border-white/10 bg-white/[0.03] text-white/35'
                      : 'border-white/15 bg-white/5 text-white/85 hover:border-cyan-200/50 hover:bg-cyan-200/10';
                    return <button key={choice} type="button" onClick={() => answer(choice)} disabled={!!chosen}
                      className={`min-h-12 break-words rounded-xl border px-4 py-3 text-base font-semibold transition ${style}`}>{choice}</button>;
                  })}
                </div>
                {chosen && (
                  <div className={`space-y-2 rounded-lg border p-3 text-sm ${chosen === lesson.word ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-amber-200/20 bg-amber-200/10 text-amber-50'}`} role="status">
                    <div className="flex items-start gap-2">
                      {chosen === lesson.word ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                      <div>
                        <div className="font-semibold">{chosen === lesson.word ? '答對了！獲得 3 點冒險經驗。' : `答案是 ${lesson.word}（${lesson.meaning}）。`}</div>
                        <div className="mt-0.5 text-xs opacity-75">{chosen === lesson.word ? '已記下這次回想結果，之後會依複習間隔安排。' : '已將這張卡排入較早複習；看看差異，再試著記住情境。'}</div>
                      </div>
                    </div>
                    {chosen !== lesson.word && <div className="rounded-md border border-amber-100/10 bg-black/10 px-2.5 py-2 text-xs leading-relaxed">
                      <div><span className="font-semibold">你選的詞：</span>{chosen} · <span className="font-semibold">正確用法：</span>{lesson.sentence.replace('___', lesson.word)}</div>
                      {related && <div className="mt-1"><span className="font-semibold">相似詞辨析：</span>{related.word}（{related.meaning}）— {related.relation}</div>}
                      <div className="mt-1"><span className="font-semibold">記憶提示：</span>{lesson.mnemonic}</div>
                      <div className="mt-1 text-white/70">{lesson.translation}</div>
                    </div>}
                    {chosen === lesson.word && <div className="text-xs leading-relaxed opacity-80">{lesson.translation}{related && <> · 易混辨析：{related.word}（{related.meaning}），{related.relation}</>}</div>}
                  </div>
                )}
                <button type="button" onClick={nextLesson} disabled={!chosen} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35">
                  {index === sessionLessons.length - 1 ? '查看修行成果' : '下一張記憶卡'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'result' && (
          <div className="space-y-4 py-3 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-amber-200/25 bg-amber-300/10 text-amber-200"><Sparkles className="h-8 w-8" /></div>
            <div><div className="text-2xl font-bold">修行完成</div><div className="mt-1 text-sm text-white/65">詞卡、錯題與複習排程已儲存於此裝置</div></div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-3xl font-black text-amber-200">{score}<span className="ml-1 text-base font-medium text-white/50">/ {sessionLessons.length}</span></div>
              <div className="mt-1 text-xs text-white/55">本輪答對 · 冒險經驗 {score * 3 + (sessionKind === 'daily' && dailyBonus ? 10 : 0)} 點</div>
              {sessionKind === 'daily' && <div className="mt-2 inline-flex items-center gap-1 text-xs text-orange-200"><Flame className="h-3.5 w-3.5" /> 連續修行 {resultStreak} 天 {dailyBonus ? '· 完成獎勵 +10' : '· 今日獎勵已領取'}</div>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={restart} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10"><RotateCcw className="h-4 w-4" /> 再修行一次</button>
              <button type="button" onClick={() => setStage('home')} className="min-h-11 flex-1 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-200">返回修行選單</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
