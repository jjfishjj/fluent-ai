import { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw, Sparkles, Volume2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LANGUAGE_LESSONS, shuffleLessonChoices, type LanguageLesson } from '@/game/data/language-lessons';
import { addCard, loadCards, reviewCard } from '@/lib/memory-srs';
import { loadGeniusType } from '@/lib/genius-type';
import { planFor } from '@/lib/genius-plan';
import './LanguageLearningDialog.css';

type Stage = 'study' | 'challenge' | 'result';
type Grade = 'again' | 'good';

export function LanguageLearningDialog({
  open,
  onOpenChange,
  userId,
  onCorrect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCorrect: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('study');
  const [flipped, setFlipped] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState(() => shuffleLessonChoices(LANGUAGE_LESSONS[0].choices));

  const lesson = LANGUAGE_LESSONS[index];
  const progress = stage === 'result' ? LANGUAGE_LESSONS.length : index;

  const close = () => {
    window.speechSynthesis?.cancel();
    onOpenChange(false);
  };

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const recordReview = (card: LanguageLesson, grade: Grade) => {
    try {
      const cards = loadCards(userId);
      let item = cards.find((candidate) => candidate.english.toLowerCase() === card.word.toLowerCase());
      if (!item) {
        const updated = addCard(userId, {
          english: card.word,
          meaning: card.meaning,
          encodeNote: `${card.scene}｜${card.sentence.replace('___', card.word)}｜諧音鉤子：${card.mnemonic}`,
        });
        item = updated.find((candidate) => candidate.english.toLowerCase() === card.word.toLowerCase());
      }
      if (item) reviewCard(userId, item.id, grade, planFor(loadGeniusType()).schedule);
    } catch (error) {
      // The lesson remains playable when local storage is unavailable.
      console.warn('[xianjing-learning] could not save the review locally.', error);
    }
  };

  const answer = (choice: string) => {
    if (chosen) return;
    setChosen(choice);
    const correct = choice === lesson.word;
    recordReview(lesson, correct ? 'good' : 'again');
    if (correct) {
      setScore((current) => current + 1);
      onCorrect();
    }
  };

  const startChallenge = () => {
    setFlipped(false);
    setChosen(null);
    setChoices(shuffleLessonChoices(lesson.choices));
    setStage('challenge');
  };

  const nextLesson = () => {
    if (index === LANGUAGE_LESSONS.length - 1) {
      setStage('result');
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setChoices(shuffleLessonChoices(LANGUAGE_LESSONS[nextIndex].choices));
    setFlipped(false);
    setChosen(null);
    setStage('study');
  };

  const restart = () => {
    setIndex(0);
    setStage('study');
    setFlipped(false);
    setChosen(null);
    setScore(0);
    setChoices(shuffleLessonChoices(LANGUAGE_LESSONS[0].choices));
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto border-amber-200/20 bg-slate-950/95 text-white shadow-2xl shadow-cyan-950/30 sm:rounded-2xl">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            <Sparkles className="h-3.5 w-3.5" /> 青雲村・記憶祭壇
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-amber-300" />
            語言修行：情境翻牌
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-white/55">
            先回想，再翻牌；接著把單字放進仙境任務裡試用。答題紀錄會沿用你的記憶卡與間隔複習。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 flex items-center justify-between text-[11px] text-white/55">
          <span>{stage === 'result' ? '修行完成' : `第 ${index + 1} 張／共 ${LANGUAGE_LESSONS.length} 張`}</span>
          <span className="text-amber-200">本輪答對 {score} 題</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 transition-all duration-500"
            style={{ width: `${(progress / LANGUAGE_LESSONS.length) * 100}%` }}
          />
        </div>

        {stage === 'study' && (
          <div className="space-y-3 pt-1">
            <div className="learning-card-stage" aria-live="polite">
              <div
                className={`learning-card-inner ${flipped ? 'is-flipped' : ''}`}
              >
                <div className="learning-card-face learning-card-front">
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] text-cyan-100/80">{lesson.scene}</span>
                  <div className="mt-5 text-center">
                    <div className="text-4xl font-black tracking-wide text-white sm:text-5xl">{lesson.word}</div>
                    <div className="mt-1 text-sm text-cyan-100/65">{lesson.phonetic}</div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        speak();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10"
                      aria-label={`播放 ${lesson.word} 的英文發音`}
                    >
                      <Volume2 className="h-3.5 w-3.5" /> 聽發音
                    </button>
                  </div>
                  <p className="mt-auto text-center text-xs text-white/60">先在心裡想意思，再翻開記憶卡</p>
                </div>

                <div className="learning-card-face learning-card-back">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">記憶卡背面</div>
                      <div className="mt-1 text-2xl font-bold text-white">{lesson.word}<span className="ml-2 text-sm font-normal text-white/50">{lesson.phonetic}</span></div>
                      <div className="mt-1 text-lg font-semibold text-cyan-100">{lesson.meaning}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        speak();
                      }}
                      className="rounded-full border border-white/15 p-2 text-white/65 hover:bg-white/10"
                      aria-label={`播放 ${lesson.word} 的英文發音`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/45 p-2.5">
                    <div className="text-[10px] font-semibold text-amber-100/75">情境例句</div>
                    <p className="mt-1 text-sm font-medium text-white">{lesson.sentence.replace('___', lesson.word)}</p>
                    <p className="mt-0.5 text-xs text-white/55">{lesson.translation}</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {lesson.relatedWords.map((related) => (
                      <div key={related.word} className="rounded-lg border border-cyan-100/10 bg-cyan-200/5 p-2">
                        <div className="text-xs font-semibold text-cyan-100">{related.word}<span className="ml-1 font-normal text-white/65">{related.meaning}</span></div>
                        <div className="mt-1 text-[10px] leading-relaxed text-white/55">{related.relation}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-lg border border-amber-200/15 bg-amber-300/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber-50/85">
                    <span className="font-semibold text-amber-200">諧音記憶鉤子：</span>{lesson.mnemonic}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setFlipped((value) => !value)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" /> {flipped ? '翻回正面' : '翻開答案'}
              </button>
              <button
                type="button"
                onClick={startChallenge}
                disabled={!flipped}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
              >
                挑戰情境 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {stage === 'challenge' && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-cyan-200/15 bg-cyan-300/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-cyan-100/75">
                <Sparkles className="h-3.5 w-3.5" /> 情境任務・{lesson.scene}
              </div>
              <p className="text-lg font-semibold leading-relaxed text-white">{lesson.sentence}</p>
              <p className="mt-1 text-xs text-white/50">選出最適合填入空格的單字</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {choices.map((choice) => {
                const isCorrect = choice === lesson.word;
                const isChosen = choice === chosen;
                const style = chosen
                  ? isCorrect
                    ? 'border-emerald-300/70 bg-emerald-400/15 text-emerald-100'
                    : isChosen
                      ? 'border-rose-300/70 bg-rose-400/15 text-rose-100'
                      : 'border-white/10 bg-white/[0.03] text-white/35'
                  : 'border-white/15 bg-white/5 text-white/85 hover:border-cyan-200/50 hover:bg-cyan-200/10';
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => answer(choice)}
                    disabled={!!chosen}
                    className={`rounded-xl border px-4 py-3 text-base font-semibold transition ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {chosen && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${chosen === lesson.word ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-amber-200/20 bg-amber-200/10 text-amber-50'}`} role="status">
                {chosen === lesson.word ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div>
                  <div className="font-semibold">{chosen === lesson.word ? '答對了！獲得 3 點冒險經驗。' : `再記一次：答案是 ${lesson.word}（${lesson.meaning}）。`}</div>
                  <div className="mt-0.5 text-xs opacity-75">{chosen === lesson.word ? '已記下這次回想結果，之後會依間隔安排複習。' : '這張卡會排入較早的複習，先看情境和記憶鉤子再繼續。'}</div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={nextLesson}
              disabled={!chosen}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {index === LANGUAGE_LESSONS.length - 1 ? '查看修行成果' : '下一張記憶卡'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {stage === 'result' && (
          <div className="space-y-4 py-3 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-amber-200/25 bg-amber-300/10 text-amber-200">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <div className="text-2xl font-bold">修行完成</div>
              <div className="mt-1 text-sm text-white/65">本輪單字已加入或更新你的複習紀錄</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-3xl font-black text-amber-200">{score}<span className="ml-1 text-base font-medium text-white/50">/ {LANGUAGE_LESSONS.length}</span></div>
              <div className="mt-1 text-xs text-white/55">本輪答對 · 最多可獲得 {LANGUAGE_LESSONS.length * 3} 點冒險經驗</div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={restart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10">
                <RotateCcw className="h-4 w-4" /> 再修行一次
              </button>
              <button type="button" onClick={close} className="flex-1 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-200">返回仙境</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
