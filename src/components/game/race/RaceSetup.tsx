import { useEffect, useState } from 'react';
import { Flag, Gauge, Sparkles, Timer, Trophy, Wind } from 'lucide-react';
import { BIRDS } from '@/game/race/data/birds';
import { TRACKS } from '@/game/race/data/tracks';
import { formatTime, loadRecords, type RecordBook } from '@/game/race/core/records';
import type { BirdDef, TrackDef } from '@/game/race/core/types';
import { cn } from '@/lib/utils';

export interface RaceOptions {
  trackId: string;
  birdId: string;
  difficulty: number;
  rivals: number;
}

const DIFFICULTIES = ['輕鬆', '標準', '高手'];

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Five-pip stat bar; every mount is strong somewhere and weak elsewhere. */
function StatRow({ label, value, max, tint }: { label: string; value: number; max: number; tint: string }) {
  const pips = Math.round((value / max) * 5);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-8 shrink-0 text-white/60">{label}</span>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-2 w-3.5 rounded-[2px]"
            style={{ background: i < pips ? tint : 'rgba(255,255,255,0.14)' }}
          />
        ))}
      </div>
    </div>
  );
}

function BirdCard({ bird, active, onPick }: { bird: BirdDef; active: boolean; onPick: () => void }) {
  const tint = hex(bird.body);
  return (
    <button
      onClick={onPick}
      className={cn(
        'rounded-2xl border p-3 text-left transition',
        active ? 'border-amber-300/80 bg-amber-300/10' : 'border-white/10 bg-white/5 hover:border-white/30',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
          style={{ background: tint, color: hex(bird.beak) }}
        >
          🐤
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{bird.name}</div>
          <div className="text-[11px] text-white/55">{bird.title}</div>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-white/60">{bird.blurb}</p>
      <div className="mt-2 space-y-1">
        <StatRow label="極速" value={bird.topSpeed} max={35} tint={tint} />
        <StatRow label="加速" value={bird.accel} max={2} tint={tint} />
        <StatRow label="操控" value={bird.handling} max={2.6} tint={tint} />
        <StatRow label="體力" value={bird.stamina} max={135} tint={tint} />
      </div>
    </button>
  );
}

function TrackCard({
  track,
  active,
  record,
  onPick,
}: {
  track: TrackDef;
  active: boolean;
  record?: RecordBook[string];
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={cn(
        'rounded-2xl border p-3 text-left transition',
        active ? 'border-sky-300/80 bg-sky-300/10' : 'border-white/10 bg-white/5 hover:border-white/30',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{track.name}</div>
        <div className="flex gap-0.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn('h-1.5 w-1.5 rounded-full', i <= track.difficulty ? 'bg-amber-300' : 'bg-white/20')}
            />
          ))}
        </div>
      </div>
      <div className="mt-0.5 text-[11px] text-white/55">{track.subtitle}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70">
        <span className="rounded-full bg-black/30 px-2 py-0.5">{track.laps} 圈</span>
        <span className="rounded-full bg-black/30 px-2 py-0.5">加速板 ×{track.boosts.length}</span>
        <span className="rounded-full bg-black/30 px-2 py-0.5">陷阱 ×{track.hazards.length}</span>
      </div>
      {record && (
        <div className="mt-2 flex items-center gap-3 text-[11px] text-emerald-200/90">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3 w-3" /> {formatTime(record.bestLap)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" /> {record.wins}/{record.races} 勝
          </span>
        </div>
      )}
    </button>
  );
}

/** Pre-race lobby: pick a mount, a course and how hard the rivals push. */
export function RaceSetup({ onStart }: { onStart: (options: RaceOptions) => void }) {
  const [birdId, setBirdId] = useState('gold');
  const [trackId, setTrackId] = useState('meadow');
  const [difficulty, setDifficulty] = useState(1);
  const [rivals, setRivals] = useState(5);
  const [records, setRecords] = useState<RecordBook>({});

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 text-white">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">陸行鳥大賽 3D</h1>
        <p className="mt-1 text-sm text-white/60">
          挑座騎、選賽道，用甩尾蓄力和衝刺體力搶第一。鍵盤 <kbd className="rounded bg-white/10 px-1">W/S</kbd>
          <kbd className="ml-1 rounded bg-white/10 px-1">A/D</kbd> 或手機觸控都能玩。
        </p>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
          <Wind className="h-4 w-4" /> 選擇座騎
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(BIRDS).map((bird) => (
            <BirdCard key={bird.id} bird={bird} active={bird.id === birdId} onPick={() => setBirdId(bird.id)} />
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
          <Flag className="h-4 w-4" /> 選擇賽道
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {Object.values(TRACKS).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              active={track.id === trackId}
              record={records[track.id]}
              onPick={() => setTrackId(track.id)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <Gauge className="h-4 w-4" /> 對手強度
          </h2>
          <div className="flex gap-2">
            {DIFFICULTIES.map((label, index) => (
              <button
                key={label}
                onClick={() => setDifficulty(index)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-sm transition',
                  index === difficulty
                    ? 'border-amber-300/80 bg-amber-300/15 text-amber-100'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
            <Sparkles className="h-4 w-4" /> 對手數量：{rivals}
          </h2>
          <input
            type="range"
            min={1}
            max={7}
            value={rivals}
            onChange={(e) => setRivals(Number(e.target.value))}
            className="w-full accent-amber-300"
          />
        </div>
      </section>

      <button
        onClick={() => onStart({ trackId, birdId, difficulty, rivals })}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:brightness-110"
      >
        開始比賽
      </button>
    </div>
  );
}
