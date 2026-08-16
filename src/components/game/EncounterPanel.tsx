import { Flame, Lock, ShieldCheck, Sparkles, Timer, TrendingUp, X, Zap } from 'lucide-react';
import type { EncounterHud, HudSnapshot } from '@/game/core/types';
import { cn } from '@/lib/utils';

/**
 * The turn-based exchange. It sits over the 3D scene rather than replacing it,
 * so the obstacle you are talking to stays visible behind the question.
 */
export function EncounterPanel({
  hud,
  encounter,
  onAnswer,
  onNext,
  onAid,
  onFlee,
  onClose,
}: {
  hud: HudSnapshot;
  encounter: EncounterHud;
  onAnswer: (option: string) => void;
  onNext: () => void;
  onAid: (skillId: string) => void;
  onFlee: () => void;
  onClose: () => void;
}) {
  const { result, outcome, stage } = encounter;
  const enemyPct = encounter.enemyMaxHp > 0 ? (encounter.enemyHp / encounter.enemyMaxHp) * 100 : 0;
  const aids = hud.skills.filter((s) => s.level > 0);

  if (outcome) {
    return (
      <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/95 p-6 text-center">
          <div className="text-2xl">{outcome === 'win' ? '🤝' : outcome === 'lose' ? '💤' : '🚪'}</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {outcome === 'win' ? '溝通成功' : outcome === 'lose' ? '你撐不住了' : '暫時撤退'}
          </div>
          <p className="mt-1 text-xs text-white/60">
            {outcome === 'win'
              ? `答對 ${encounter.correct} 題，答錯 ${encounter.wrong} 題。`
              : outcome === 'lose'
                ? '回學院休息一下，再來過。'
                : '你退開了一段距離，隨時可以再上。'}
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
          >
            繼續
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl backdrop-blur-md">
        {/* obstacle header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="truncate text-sm font-semibold text-white">{encounter.enemyName}</span>
              <span className="shrink-0 text-[10px] text-white/50">Lv.{encounter.enemyLevel}</span>
              {stage && (
                <span className="flex shrink-0 items-center gap-1 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-200">
                  第 {stage.index}/{stage.total} 幕 · {stage.name}
                  {stage.sealed && <Lock className="h-2.5 w-2.5" />}
                </span>
              )}
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/55">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-[width] duration-300"
                style={{ width: `${enemyPct}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right text-[10px] leading-tight text-white/55">
            <div>第 {encounter.round} 題</div>
            {encounter.streak > 1 && (
              <div className="flex items-center gap-0.5 text-amber-300">
                <Flame className="h-3 w-3" />
                連續 {encounter.streak}
              </div>
            )}
          </div>
          <button
            onClick={onFlee}
            title="撤退"
            className="shrink-0 rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* the representative's line for this stage of the interview */}
        {stage && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 bg-amber-400/[0.06] px-4 py-1.5 text-[10px]">
            <span className="italic text-amber-100/80">「{stage.line}」</span>
            <span className="ml-auto flex items-center gap-2 text-white/45">
              {stage.pressure > 1 && (
                <span className="flex items-center gap-0.5 text-rose-300">
                  <TrendingUp className="h-3 w-3" />
                  反噬 ×{stage.pressure}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Timer className="h-3 w-3" />
                {stage.swiftWindow}s
              </span>
            </span>
          </div>
        )}

        {/* question */}
        <div className="px-4 py-3">
          {encounter.stageAdvanced && (
            <div className="mb-2 rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-100">
              進入「{encounter.stageAdvanced}」
            </div>
          )}
          <div className="text-[10px] uppercase tracking-wider text-white/40">請翻譯</div>
          <div className="mt-0.5 text-xl font-semibold text-white">{encounter.prompt}</div>
          {encounter.hintRevealed && encounter.hint && (
            <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
              <Sparkles className="h-3 w-3 shrink-0" />
              {encounter.hint}
            </div>
          )}

          {/* options, or the result of the answer just given */}
          {!result ? (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {encounter.options.map((option) => (
                <button
                  key={option}
                  onClick={() => onAnswer(option)}
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-left text-sm text-white transition hover:border-amber-300/60 hover:bg-white/10 active:scale-[0.99]"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <div
                className={cn(
                  'rounded-lg border p-3',
                  result.correct
                    ? 'border-emerald-400/30 bg-emerald-400/10'
                    : 'border-rose-400/30 bg-rose-400/10',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className={result.correct ? 'text-emerald-300' : 'text-rose-300'}>
                    {result.correct ? '正確' : '錯了'}
                  </span>
                  {result.correct ? (
                    <span className="text-white/70">造成 {result.damage} 點說服力</span>
                  ) : (
                    <span className="text-white/70">
                      {result.shielded ? '技法擋下了反噬' : `受到 ${result.backlash} 點衝擊`}
                    </span>
                  )}
                  {result.swift && (
                    <span className="flex items-center gap-0.5 rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] text-sky-200">
                      <Timer className="h-3 w-3" />
                      反應快
                    </span>
                  )}
                  {result.amplified && (
                    <span className="flex items-center gap-0.5 rounded bg-orange-400/20 px-1.5 py-0.5 text-[10px] text-orange-200">
                      <Zap className="h-3 w-3" />
                      加倍
                    </span>
                  )}
                </div>
                {!result.correct && (
                  <div className="mt-1 text-xs text-white/70">
                    正解：<span className="font-semibold text-white">{result.answer}</span>
                  </div>
                )}
                {result.note && <div className="mt-1 text-[11px] leading-relaxed text-white/55">{result.note}</div>}
              </div>
              <button
                onClick={onNext}
                autoFocus
                className="mt-2 w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
              >
                下一題
              </button>
            </div>
          )}
        </div>

        {/* memory techniques */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 px-4 py-2">
          <span className="mr-1 text-[10px] text-white/40">記憶技法</span>
          {stage?.sealed && (
            <span className="flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[10px] text-rose-200">
              <Lock className="h-3 w-3" />
              這一幕封印
            </span>
          )}
          {aids.map((s) => {
            const queued = encounter.aids.some((a) => a.skillId === s.id);
            const usable = s.ready && !result && !queued && !stage?.sealed;
            return (
              <button
                key={s.id}
                onClick={() => onAid(s.id)}
                disabled={!usable}
                title={`${s.name}｜${s.spCost} 專注`}
                className={cn(
                  'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition',
                  queued
                    ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200'
                    : usable
                      ? 'border-white/15 bg-white/5 text-white/85 hover:border-amber-300/60'
                      : 'border-white/5 text-white/30',
                )}
              >
                <span>{s.icon}</span>
                {s.name}
                {queued ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : s.cooldownLeft > 0 ? (
                  <span className="text-white/40">{Math.ceil(s.cooldownLeft)}s</span>
                ) : (
                  <span className="text-sky-300">{s.spCost}</span>
                )}
              </button>
            );
          })}
          {!aids.length && <span className="text-[11px] text-white/35">尚未習得任何技法</span>}
        </div>
      </div>
    </div>
  );
}
