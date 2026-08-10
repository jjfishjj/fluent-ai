import { Coins, Crown, Heart, Sparkles, Swords, Users } from 'lucide-react';
import { CLASSES } from '@/game/data/classes';
import type { HudSnapshot } from '@/game/core/types';
import { cn } from '@/lib/utils';

interface BarProps {
  value: number;
  max: number;
  className: string;
  label?: string;
  compact?: boolean;
}

function Bar({ value, max, className, label, compact }: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-black/55', compact ? 'h-2' : 'h-3.5')}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-150', className)}
        style={{ width: `${pct}%` }}
      />
      {!compact && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tracking-wide text-white/95 drop-shadow">
          {label ?? `${value} / ${max}`}
        </span>
      )}
    </div>
  );
}

/** Portrait, vitals and experience — the top-left frame. */
export function PlayerFrame({ hud, onOpenSheet }: { hud: HudSnapshot; onOpenSheet: () => void }) {
  const cls = CLASSES[hud.classId];
  const expPct = hud.expToNext === Infinity ? 100 : (hud.exp / hud.expToNext) * 100;
  return (
    <div className="pointer-events-auto w-52 rounded-xl sm:w-64 border border-white/15 bg-slate-950/70 p-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSheet}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/20 text-xl"
          style={{ background: `#${cls.color.toString(16).padStart(6, '0')}33` }}
          title="開啟角色面板 (C)"
        >
          <span>{hud.classId === 'sword' ? '⚔️' : hud.classId === 'talisman' ? '🔥' : hud.classId === 'archer' ? '🏹' : '✨'}</span>
          {(hud.statPoints > 0 || hud.skillPoints > 0) && (
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
              !
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">{hud.name}</span>
            <span className="shrink-0 text-[11px] text-amber-300">Lv.{hud.level}</span>
          </div>
          <div className="text-[10px] text-white/60">{cls.name} · {cls.title}</div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <Bar value={hud.hp} max={hud.maxHp} className="bg-gradient-to-r from-rose-600 to-rose-400" />
        <Bar value={hud.sp} max={hud.maxSp} className="bg-gradient-to-r from-sky-600 to-sky-400" />
        <Bar
          value={hud.exp}
          max={hud.expToNext === Infinity ? 1 : hud.expToNext}
          className="bg-gradient-to-r from-amber-500 to-yellow-300"
          compact
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/60">
        <span className="flex items-center gap-1">
          <Coins className="h-3 w-3 text-amber-300" />
          {hud.silver.toLocaleString()}
        </span>
        <span>EXP {expPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

const ELEMENT_LABEL: Record<string, string> = {
  neutral: '無屬性',
  fire: '火',
  water: '水',
  wind: '風',
  earth: '地',
  holy: '聖',
  shadow: '暗',
};

export function TargetFrame({ hud }: { hud: HudSnapshot }) {
  if (!hud.target) return null;
  const t = hud.target;
  return (
    <div className="pointer-events-none w-44 rounded-xl sm:w-56 border border-white/15 bg-slate-950/70 p-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 truncate text-sm font-semibold text-white">
          {t.boss && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
          {t.name}
        </span>
        <span className="shrink-0 text-[11px] text-white/60">Lv.{t.level}</span>
      </div>
      <div className="mt-1.5">
        <Bar
          value={t.hp}
          max={t.maxHp}
          className={t.boss ? 'bg-gradient-to-r from-orange-600 to-amber-400' : 'bg-gradient-to-r from-red-700 to-red-500'}
        />
      </div>
      <div className="mt-1 text-[10px] text-white/50">屬性：{ELEMENT_LABEL[t.element] ?? t.element}</div>
    </div>
  );
}

export function ZoneBanner({ hud, mode }: { hud: HudSnapshot; mode: string }) {
  return (
    <div className="pointer-events-none rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-right backdrop-blur-md">
      <div className="text-sm font-semibold text-white">{hud.zoneName}</div>
      <div className="text-[10px] text-white/55">{hud.zoneSubtitle}</div>
      <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-white/50">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {hud.playersOnline} 人
        </span>
        <span className={mode === 'online' ? 'text-emerald-300' : 'text-white/40'}>
          {mode === 'online' ? '連線中' : '單機模擬'}
        </span>
        <span>{hud.fps} FPS</span>
      </div>
    </div>
  );
}

export function BuffBar({ hud }: { hud: HudSnapshot }) {
  if (!hud.buffs.length) return null;
  return (
    <div className="pointer-events-none flex gap-1.5">
      {hud.buffs.map((b) => (
        <div
          key={b.id}
          className="rounded-md border border-amber-300/40 bg-amber-400/15 px-2 py-1 text-[10px] text-amber-200 backdrop-blur-md"
        >
          {b.name} {Math.ceil(b.left)}s
        </div>
      ))}
    </div>
  );
}

export function QuestTracker({
  hud,
  onTurnIn,
}: {
  hud: HudSnapshot;
  onTurnIn: (questId: string) => void;
}) {
  if (!hud.quests.length) return null;
  return (
    <div className="pointer-events-auto w-44 rounded-xl sm:w-60 border border-white/15 bg-slate-950/70 p-2.5 backdrop-blur-md">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
        <Sparkles className="h-3.5 w-3.5" />
        任務
      </div>
      <div className="space-y-2">
        {hud.quests.map((q) => (
          <div key={q.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-white">{q.name}</span>
              <span
                className={cn(
                  'shrink-0 text-[10px]',
                  q.status === 'complete' ? 'text-emerald-300' : 'text-white/55',
                )}
              >
                {q.progress}/{q.count}
              </span>
            </div>
            <div className="text-[10px] leading-tight text-white/50">{q.summary}</div>
            {q.status === 'complete' && (
              <button
                onClick={() => onTurnIn(q.id)}
                className="mt-1 w-full rounded-md bg-emerald-500/85 px-2 py-1 text-[10px] font-semibold text-slate-950 hover:bg-emerald-400"
              >
                回報任務（需找對應 NPC）
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillBar({
  hud,
  onCast,
  onUseItem,
}: {
  hud: HudSnapshot;
  onCast: (skillId: string) => void;
  onUseItem: (itemId: string) => void;
}) {
  const potions = hud.inventory.filter((i) => i.kind === 'consumable').slice(0, 2);
  return (
    <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2">
      {hud.skills.map((s, i) => {
        const locked = s.level <= 0;
        const cdPct = s.cooldownLeft > 0 ? (s.cooldownLeft / s.cooldown) * 100 : 0;
        return (
          <button
            key={s.id}
            onClick={() => onCast(s.id)}
            disabled={locked}
            title={`${s.name} — ${s.spCost} 靈力`}
            className={cn(
              'relative h-12 w-12 overflow-hidden rounded-xl border text-lg backdrop-blur-md transition sm:h-14 sm:w-14 sm:text-xl',
              locked
                ? 'cursor-not-allowed border-white/10 bg-slate-900/60 opacity-40'
                : s.ready
                  ? 'border-amber-300/50 bg-slate-900/70 hover:border-amber-300 hover:bg-slate-800/80'
                  : 'border-white/15 bg-slate-900/70',
            )}
          >
            <span className={cn('drop-shadow', !s.ready && !locked && 'opacity-60')}>{s.icon}</span>
            {cdPct > 0 && (
              <span
                className="absolute inset-x-0 bottom-0 bg-slate-950/75"
                style={{ height: `${cdPct}%` }}
              />
            )}
            {s.cooldownLeft > 0 && (
              <span className="absolute inset-0 grid place-items-center text-sm font-bold text-white">
                {s.cooldownLeft < 1 ? s.cooldownLeft.toFixed(1) : Math.ceil(s.cooldownLeft)}
              </span>
            )}
            <span className="absolute left-1 top-0.5 text-[9px] font-bold text-white/70">{i + 1}</span>
            {!locked && (
              <span className="absolute bottom-0.5 right-1 text-[9px] text-sky-300">{s.spCost}</span>
            )}
            {locked && <span className="absolute bottom-0.5 right-1 text-[9px] text-white/60">未習得</span>}
          </button>
        );
      })}

      <div className="mx-1 h-10 w-px bg-white/15" />

      {potions.map((p, i) => (
        <button
          key={p.itemId}
          onClick={() => onUseItem(p.itemId)}
          title={`${p.name} ×${p.qty}`}
          className="relative h-12 w-12 rounded-xl border border-white/15 bg-slate-900/70 text-lg backdrop-blur-md transition hover:border-emerald-300/60 sm:h-14 sm:w-14 sm:text-xl"
        >
          <span>{p.icon}</span>
          <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white/80">{p.qty}</span>
          <span className="absolute left-1 top-0.5 text-[9px] font-bold text-white/70">{i === 0 ? 'R' : 'T'}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Touch equivalents of the Tab / F / C keys. Only rendered on small screens,
 * where there is no keyboard to reach them with.
 */
export function TouchActions({
  onCycleTarget,
  onInteract,
  onOpenSheet,
}: {
  onCycleTarget: () => void;
  onInteract: () => void;
  onOpenSheet: () => void;
}) {
  const buttons = [
    { icon: '🎯', label: '選取', onClick: onCycleTarget },
    { icon: '💬', label: '對話', onClick: onInteract },
    { icon: '🎒', label: '角色', onClick: onOpenSheet },
  ];
  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 sm:hidden">
      {buttons.map((b) => (
        <button
          key={b.label}
          onClick={b.onClick}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-slate-950/70 backdrop-blur-md active:bg-slate-800/80"
          aria-label={b.label}
        >
          <span className="text-base leading-none">{b.icon}</span>
        </button>
      ))}
    </div>
  );
}

export function DeathOverlay({ hud, onRespawn }: { hud: HudSnapshot; onRespawn: () => void }) {
  if (!hud.dead) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 grid place-items-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-72 rounded-2xl border border-rose-400/30 bg-slate-950/90 p-6 text-center">
        <Heart className="mx-auto mb-3 h-8 w-8 text-rose-400" />
        <div className="text-lg font-semibold text-white">你已倒下</div>
        <p className="mt-1 text-xs text-white/60">回到青雲村療傷，損失少量經驗值。</p>
        <button
          onClick={onRespawn}
          disabled={hud.respawnIn > 0}
          className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {hud.respawnIn > 0 ? `${hud.respawnIn} 秒後可復活` : '回城復活'}
        </button>
      </div>
    </div>
  );
}

export function ControlHints() {
  return (
    <div className="pointer-events-none hidden rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-white/50 backdrop-blur-md md:block">
      <div className="flex items-center gap-1 font-semibold text-white/70">
        <Swords className="h-3 w-3" /> 操作
      </div>
      左鍵點地移動 · 點怪選取 · 右鍵拖曳轉視角 · 滾輪縮放
      <br />
      WASD 移動 · 1–4 技能 · R/T 喝藥 · Tab 換目標 · F 對話 · C 角色 · Enter 聊天
    </div>
  );
}
