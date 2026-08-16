import { BookOpenCheck, Check, X } from 'lucide-react';
import type { Phrase } from '@/game/race/data/nations';
import type { RaceSnapshot } from '@/game/race/core/types';
import { cn } from '@/lib/utils';

const LANE_MARK = ['◀ 左', '▲ 中', '▶ 右'];

/**
 * The question you are driving into. It has to be readable in about a second,
 * so it is one line of prompt and three lane chips laid out left-to-right in
 * the same order as the lanes on the road.
 */
export function GatePrompt({ language }: { language: NonNullable<RaceSnapshot['language']> }) {
  const upcoming = language.upcoming;
  if (!upcoming) return null;
  const { question, distance } = upcoming;
  // Fills up as you close on the gate — a read-it-now timer.
  const closeness = Math.max(0, Math.min(1, 1 - distance / 62));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 flex flex-col items-center gap-1.5 px-3 sm:top-20">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-2 text-center backdrop-blur-md">
        <div className="text-base font-bold leading-tight text-white sm:text-lg">{question.prompt}</div>
        {question.hint && <div className="text-[11px] text-white/50">{question.hint}</div>}
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
            style={{ width: `${closeness * 100}%` }}
          />
        </div>
      </div>
      <div className="flex w-full max-w-md gap-1.5">
        {question.lanes.map((lane, index) => (
          <div
            key={`${lane.text}-${index}`}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950/70 px-2 py-1.5 text-center backdrop-blur-md"
          >
            <div className="text-[10px] font-semibold text-white/40">{LANE_MARK[index]}</div>
            <div className="truncate text-sm font-bold text-white">{lane.text}</div>
            {lane.sub && <div className="truncate text-[10px] text-white/45">{lane.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The verdict flash right after you pass a gate. */
export function GateFlash({ language }: { language: NonNullable<RaceSnapshot['language']> }) {
  const last = language.last;
  if (!last) return null;
  const { outcome, question } = last;
  const correctLane = question.lanes.find((lane) => lane.correct);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-4">
      <div
        className={cn(
          'animate-in fade-in zoom-in-95 rounded-2xl border px-4 py-2 text-center backdrop-blur-md',
          outcome === 'correct'
            ? 'border-emerald-300/60 bg-emerald-500/25'
            : outcome === 'wrong'
              ? 'border-red-300/60 bg-red-500/25'
              : 'border-white/30 bg-slate-900/70',
        )}
      >
        <div className="flex items-center justify-center gap-1.5 text-lg font-black text-white">
          {outcome === 'correct' ? (
            <>
              <Check className="h-5 w-5" /> 正確！加速
            </>
          ) : outcome === 'wrong' ? (
            <>
              <X className="h-5 w-5" /> 答錯了
            </>
          ) : (
            <>繞過閘門</>
          )}
        </div>
        {outcome !== 'correct' && correctLane && (
          <div className="text-[12px] text-white/80">
            正解：{correctLane.text}
            {correctLane.sub ? `（${correctLane.sub}）` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/** Running tally, parked under the place counter. */
export function LanguageBadge({ language }: { language: NonNullable<RaceSnapshot['language']> }) {
  return (
    <div className="pointer-events-none rounded-2xl border border-white/15 bg-slate-950/65 px-3 py-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-[10px] text-white/50">
        <BookOpenCheck className="h-3 w-3" /> 語言關卡
      </div>
      <div className="flex items-baseline gap-1.5 font-mono text-sm font-bold tabular-nums text-emerald-300">
        <span>
          {language.correct}
          <span className="text-white/40"> / {language.total}</span>
        </span>
        {language.total > 0 && (
          <span className="text-[11px] text-white/55">（{Math.round(language.accuracy * 100)}%）</span>
        )}
      </div>
    </div>
  );
}

/**
 * Shown over the grid on recall stages: the sequence you will be quizzed on
 * mid-race. This is the memory-palace idea in a racing shell — the words are
 * numbered positions, and the gates ask for a position, not a meaning.
 */
export function MemoriseOverlay({
  phrases,
  secondsLeft,
}: {
  phrases: Phrase[];
  secondsLeft: number;
}) {
  if (phrases.length === 0) return null;
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/90 p-5 text-white shadow-2xl">
        <div className="text-center text-sm font-semibold text-amber-200">記住這個順序</div>
        <p className="mt-1 text-center text-[11px] text-white/55">
          途中的閘門會問「第幾個是什麼」，出發後就看不到了。
        </p>
        <ol className="mt-3 space-y-1.5">
          {phrases.map((phrase, index) => (
            <li key={phrase.native} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-300/20 font-mono text-sm font-bold text-amber-200">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{phrase.native}</div>
                <div className="truncate text-[11px] text-white/55">
                  {phrase.roman ? `${phrase.roman} · ` : ''}
                  {phrase.meaning}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 text-center font-mono text-lg font-bold tabular-nums text-white/80">
          {Math.max(0, Math.ceil(secondsLeft))}
        </div>
      </div>
    </div>
  );
}

export interface CampaignSummary {
  nationName: string;
  /** Set for a hub room race, which does not touch the campaign. */
  multiplayer?: boolean;
  mission?: string;
  cleared: boolean;
  isCampaign: boolean;
  credits: { placement: number; language: number; clearBonus: number; total: number };
  promotedTo?: string;
  unlockedNation?: string;
  missed: Phrase[];
  targetPlace?: number;
  targetAccuracy?: number;
}

/** The language half of the results card. */
export function LanguageResult({
  language,
  summary,
  onAddCards,
  cardsAdded,
}: {
  language?: RaceSnapshot['language'];
  summary?: CampaignSummary;
  onAddCards: () => void;
  cardsAdded: number;
}) {
  if (!language && !summary) return null;
  return (
    <div className="mt-3 space-y-2.5">
      {language && language.total > 0 && (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">語言關卡</span>
            <span className="font-mono tabular-nums text-white">
              {language.correct}/{language.total}
              <span className="ml-1.5 text-emerald-300">{Math.round(language.accuracy * 100)}%</span>
            </span>
          </div>
          {summary?.targetAccuracy !== undefined && (
            <div className="mt-0.5 text-[11px] text-white/45">
              通關門檻：第 {summary.targetPlace} 名內 · 正確率 {Math.round(summary.targetAccuracy * 100)}%
            </div>
          )}
        </div>
      )}

      {summary && (
        <div className="rounded-xl bg-white/5 p-2.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-white/55">名次積分</span>
            <span className="font-mono tabular-nums">+{summary.credits.placement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/55">語言積分</span>
            <span className="font-mono tabular-nums text-emerald-300">+{summary.credits.language}</span>
          </div>
          {summary.credits.clearBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-white/55">首次通關獎勵</span>
              <span className="font-mono tabular-nums text-amber-300">+{summary.credits.clearBonus}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-white/10 pt-1 font-semibold">
            <span>外交積分</span>
            <span className="font-mono tabular-nums text-amber-300">+{summary.credits.total}</span>
          </div>
        </div>
      )}

      {summary?.multiplayer && (
        <div className="rounded-xl bg-sky-400/15 px-3 py-2 text-center text-[12px] text-sky-100">
          多人賽事 · 名次以各自回報的進度排序，不計入巡迴賽進度
        </div>
      )}

      {summary?.isCampaign && (
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-center text-sm font-semibold',
            summary.cleared ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-white/60',
          )}
        >
          {summary.cleared ? `✅ ${summary.nationName} 任務達成` : '未達通關門檻，可以再挑戰一次'}
          {summary.cleared && summary.unlockedNation && (
            <div className="text-[11px] font-normal text-white/60">已解鎖：{summary.unlockedNation}</div>
          )}
        </div>
      )}

      {summary?.promotedTo && (
        <div className="rounded-xl bg-amber-400/15 px-3 py-2 text-center text-sm font-bold text-amber-200">
          🎖️ 晉升為「{summary.promotedTo}」
        </div>
      )}

      {summary && summary.missed.length > 0 && (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="mb-1.5 text-[11px] font-semibold text-white/60">
            這場答錯的 {summary.missed.length} 個詞
          </div>
          <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
            {summary.missed.map((phrase, index) => (
              <div key={`${phrase.native}-${index}`} className="flex justify-between gap-2 text-[12px]">
                <span className="truncate font-semibold text-white">{phrase.native}</span>
                <span className="shrink-0 text-white/55">{phrase.meaning}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onAddCards}
            disabled={cardsAdded > 0}
            className="mt-2 w-full rounded-lg border border-white/20 px-3 py-1.5 text-[12px] font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-60"
          >
            {cardsAdded > 0 ? `已加入 ${cardsAdded} 張記憶卡` : '加入記憶卡（間隔重複複習）'}
          </button>
        </div>
      )}
    </div>
  );
}

