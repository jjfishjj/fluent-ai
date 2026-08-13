import { useEffect, useMemo, useRef } from 'react';
import { Flag, Home, RotateCcw, Trophy, Video } from 'lucide-react';
import { LanguageBadge, LanguageResult, type CampaignSummary } from './RaceLanguageHud';
import { BIRDS } from '@/game/race/data/birds';
import { formatTime } from '@/game/race/core/records';
import type { RaceSnapshot, Track } from '@/game/race/core/types';
import { cn } from '@/lib/utils';

const PLACE_SUFFIX = ['', 'st', 'nd', 'rd'];

function ordinal(place: number): string {
  return place <= 3 ? `${place}${PLACE_SUFFIX[place]}` : `${place}th`;
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Analogue-ish speed readout plus lap counter — the top-right cluster. */
function SpeedPanel({ hud }: { hud: RaceSnapshot }) {
  const kph = Math.round(hud.player.speed * 7.2);
  return (
    <div className="pointer-events-none rounded-2xl border border-white/15 bg-slate-950/65 px-3.5 py-2 text-right backdrop-blur-md">
      <div className="flex items-baseline justify-end gap-1">
        <span className="font-mono text-3xl font-black tabular-nums text-white sm:text-4xl">{kph}</span>
        <span className="text-[10px] font-semibold text-white/50">km/h</span>
      </div>
      <div className="mt-0.5 text-[11px] text-white/60">
        第 <span className="font-semibold text-white">{hud.player.lap}</span> / {hud.laps} 圈
      </div>
      <div className="font-mono text-[11px] tabular-nums text-white/70">{formatTime(hud.player.lapTime)}</div>
      {hud.player.bestLap > 0 && (
        <div className="font-mono text-[10px] tabular-nums text-emerald-300/80">
          best {formatTime(hud.player.bestLap)}
        </div>
      )}
    </div>
  );
}

/** Stamina, boost and drift charge — everything the player spends. */
function GaugePanel({ hud }: { hud: RaceSnapshot }) {
  const staminaPct = (hud.player.stamina / hud.player.maxStamina) * 100;
  const driftPct = Math.min(100, (hud.player.driftCharge / 2.4) * 100);
  return (
    <div className="pointer-events-none w-44 rounded-2xl border border-white/15 bg-slate-950/65 p-2.5 backdrop-blur-md sm:w-56">
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-white/60">
        <span>體力</span>
        <span className="tabular-nums">{Math.round(hud.player.stamina)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 transition-[width] duration-100"
          style={{ width: `${staminaPct}%` }}
        />
      </div>
      <div className="mt-2 mb-1 text-[10px] font-semibold text-white/60">甩尾蓄力</div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-75',
            driftPct > 95 ? 'bg-fuchsia-400' : driftPct > 60 ? 'bg-orange-400' : 'bg-sky-400',
          )}
          style={{ width: `${driftPct}%` }}
        />
      </div>
      {hud.player.boost > 0 && (
        <div className="mt-1.5 animate-pulse text-center text-[11px] font-bold text-cyan-300">加速中！</div>
      )}
      {hud.player.offTrack && (
        <div className="mt-1.5 text-center text-[11px] font-bold text-red-300">離開賽道！</div>
      )}
    </div>
  );
}

function Standings({ hud }: { hud: RaceSnapshot }) {
  return (
    <div className="pointer-events-none w-40 rounded-2xl border border-white/15 bg-slate-950/65 p-2 text-[11px] backdrop-blur-md sm:w-48">
      {hud.standings.map((row) => (
        <div
          key={row.id}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-1.5 py-1',
            row.isPlayer ? 'bg-amber-300/15 text-amber-100' : 'text-white/75',
          )}
        >
          <span className="w-4 shrink-0 text-right font-mono font-bold tabular-nums">{row.place}</span>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: hex(BIRDS[row.birdId]?.body ?? 0xffffff) }}
          />
          <span className="min-w-0 flex-1 truncate">{row.name}</span>
          <span className="shrink-0 font-mono tabular-nums text-white/45">
            {row.finished ? formatTime(row.finishTime) : row.place === 1 ? '領先' : `-${Math.round(row.gap)}m`}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Top-down course map with a dot per racer. */
function Minimap({ track, hud }: { track: Track; hud: RaceSnapshot }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const s of track.samples) {
      minX = Math.min(minX, s.pos.x);
      maxX = Math.max(maxX, s.pos.x);
      minZ = Math.min(minZ, s.pos.z);
      maxZ = Math.max(maxZ, s.pos.z);
    }
    const pad = 14;
    return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
  }, [track]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    const scale = size / Math.max(spanX, spanZ);
    const toX = (x: number) => (x - bounds.minX) * scale;
    // Flip Z so north on the map matches +Z in the world.
    const toY = (z: number) => size - (z - bounds.minZ) * scale;

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    track.samples.forEach((s, i) => {
      const x = toX(s.pos.x);
      const y = toY(s.pos.z);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = Math.max(3, track.def.halfWidth * scale * 1.4);
    ctx.lineJoin = 'round';
    ctx.stroke();

    const start = track.samples[0];
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(toX(start.pos.x) - 3, toY(start.pos.z) - 3, 6, 6);

    for (const blip of hud.blips) {
      ctx.beginPath();
      ctx.arc(toX(blip.x), toY(blip.z), blip.isPlayer ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = blip.isPlayer ? '#fbbf24' : hex(blip.color);
      ctx.fill();
      if (blip.isPlayer) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [bounds, hud, track]);

  return (
    <canvas
      ref={canvasRef}
      width={132}
      height={132}
      className="pointer-events-none h-28 w-28 rounded-2xl border border-white/15 bg-slate-950/60 backdrop-blur-md sm:h-32 sm:w-32"
    />
  );
}

export function CountdownOverlay({ hud }: { hud: RaceSnapshot }) {
  if (hud.phase !== 'countdown') return null;
  const remaining = Math.ceil(hud.countdown);
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div
        key={remaining}
        className="animate-in zoom-in-50 fade-in text-7xl font-black text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)] sm:text-8xl"
      >
        {remaining > 0 ? remaining : 'GO!'}
      </div>
    </div>
  );
}

export function ResultOverlay({
  hud,
  newRecord,
  summary,
  cardsAdded,
  onAddCards,
  onRestart,
  onExit,
}: {
  hud: RaceSnapshot;
  newRecord: boolean;
  summary?: CampaignSummary;
  cardsAdded: number;
  onAddCards: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  if (!hud.player.finished) return null;
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/90 p-5 text-white shadow-2xl">
        <div className="flex items-center gap-2 text-amber-300">
          <Trophy className="h-5 w-5" />
          <span className="text-lg font-bold">{ordinal(hud.player.place)} · 第 {hud.player.place} 名</span>
        </div>
        <div className="mt-3 space-y-1 font-mono text-sm tabular-nums text-white/80">
          <div className="flex justify-between">
            <span className="font-sans text-white/55">總時間</span>
            <span>{formatTime(hud.player.finishTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-white/55">最快單圈</span>
            <span>{formatTime(hud.player.bestLap)}</span>
          </div>
        </div>
        {newRecord && (
          <div className="mt-3 rounded-xl bg-emerald-400/15 px-3 py-2 text-center text-sm font-semibold text-emerald-200">
            🎉 新紀錄！
          </div>
        )}
        <LanguageResult
          language={hud.language}
          summary={summary}
          cardsAdded={cardsAdded}
          onAddCards={onAddCards}
        />
        <div className="mt-4 space-y-1.5 text-[11px]">
          {hud.standings.map((row) => (
            <div
              key={row.id}
              className={cn('flex items-center gap-2 rounded-lg px-2 py-1', row.isPlayer && 'bg-amber-300/15')}
            >
              <span className="w-4 text-right font-mono font-bold">{row.place}</span>
              <span className="flex-1 truncate">{row.name}</span>
              <span className="font-mono text-white/55">
                {row.finished ? formatTime(row.finishTime) : '未完賽'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110"
          >
            <RotateCcw className="mr-1 inline h-4 w-4" /> 再跑一次
          </button>
          <button
            onClick={onExit}
            className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            <Home className="mr-1 inline h-4 w-4" /> 回大廳
          </button>
        </div>
      </div>
    </div>
  );
}

/** The whole in-race overlay. Touch controls live in `TouchPad`. */
export function RaceHud({
  hud,
  track,
  cameraLabel,
  onCamera,
  onRestart,
  onExit,
}: {
  hud: RaceSnapshot;
  track: Track;
  cameraLabel: string;
  onCamera: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-3">
        <div className="flex flex-col gap-2">
          <div className="pointer-events-none rounded-2xl border border-white/15 bg-slate-950/65 px-3 py-1.5 backdrop-blur-md">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black tabular-nums text-amber-300">
                {hud.player.place}
              </span>
              <span className="text-[11px] text-white/55">/ {hud.standings.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/50">
              <Flag className="h-3 w-3" /> {track.def.name}
            </div>
          </div>
          {hud.language && <LanguageBadge language={hud.language} />}
          <Standings hud={hud} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <SpeedPanel hud={hud} />
          <Minimap track={track} hud={hud} />
          <div className="pointer-events-auto flex gap-1.5">
            <button
              onClick={onCamera}
              className="rounded-xl border border-white/15 bg-slate-950/65 px-2.5 py-1.5 text-[11px] text-white/80 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <Video className="mr-1 inline h-3 w-3" />
              {cameraLabel}
            </button>
            <button
              onClick={onRestart}
              className="rounded-xl border border-white/15 bg-slate-950/65 px-2.5 py-1.5 text-[11px] text-white/80 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={onExit}
              className="rounded-xl border border-white/15 bg-slate-950/65 px-2.5 py-1.5 text-[11px] text-white/80 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <Home className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[7.5rem] left-2.5 sm:left-3 [@media(hover:hover)]:bottom-3">
        <GaugePanel hud={hud} />
      </div>
    </>
  );
}
