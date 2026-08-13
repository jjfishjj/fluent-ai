import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Flag, Gauge, Lock, Sparkles, Stamp, Trophy, Wind } from 'lucide-react';
import { BIRDS } from '@/game/race/data/birds';
import { CHALLENGE_HINT, CHALLENGE_LABEL, NATIONS, type ChallengeKind, type NationDef } from '@/game/race/data/nations';
import {
  RANKS,
  STAGES,
  type DiplomatProfile,
  type Stage,
  currentStage,
  isUnlocked,
  loadProfile,
  nextRank,
  rankFor,
  stampLabel,
} from '@/game/race/core/campaign';
import { formatTime } from '@/game/race/core/records';
import type { BirdDef } from '@/game/race/core/types';
import { cn } from '@/lib/utils';

export interface RaceOptions {
  mode: 'campaign' | 'free';
  nationId: string;
  birdId: string;
  difficulty: number;
  rivals: number;
  challenge?: ChallengeKind;
  stageIndex?: number;
}

const DIFFICULTIES = ['輕鬆', '標準', '高手'];
const FREE_CHALLENGES: { id: ChallengeKind | 'none'; label: string }[] = [
  { id: 'none', label: '純競速' },
  { id: 'word', label: '認詞' },
  { id: 'listen', label: '聽力' },
  { id: 'number', label: '數字' },
  { id: 'recall', label: '記憶' },
  { id: 'mixed', label: '綜合' },
];

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

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

/** The player's career strip: rank, credit progress and passport count. */
function ProfileBar({ profile }: { profile: DiplomatProfile }) {
  const rank = rankFor(profile.credits);
  const next = nextRank(profile.credits);
  const span = next ? next.credits - rank.credits : 1;
  const done = next ? (profile.credits - rank.credits) / span : 1;
  const stamps = Object.values(profile.stamps).filter((s) => s.cleared).length;
  const accuracy = profile.totals.answered > 0 ? profile.totals.correct / profile.totals.answered : 0;

  return (
    <div className="rounded-2xl border border-white/12 bg-white/5 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/45">現任職級</div>
          <div className="text-xl font-bold text-white">{rank.name}</div>
          <div className="text-[11px] text-white/55">{rank.blurb}</div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-[11px] text-white/45">外交積分</div>
            <div className="font-mono text-lg font-bold tabular-nums text-amber-300">{profile.credits}</div>
          </div>
          <div>
            <div className="text-[11px] text-white/45">通關國家</div>
            <div className="font-mono text-lg font-bold tabular-nums text-white">
              {stamps}/{STAGES.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-white/45">生涯正確率</div>
            <div className="font-mono text-lg font-bold tabular-nums text-emerald-300">
              {Math.round(accuracy * 100)}%
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
          style={{ width: `${Math.max(4, Math.min(100, done * 100))}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-white/45">
        {next ? `距離「${next.name}」還差 ${next.credits - profile.credits} 分` : `已達最高職級 ${RANKS.at(-1)?.name}`}
      </div>
    </div>
  );
}

/** One host nation: the posting, its champion, and what clearing it takes. */
function StageCard({
  stage,
  def,
  profile,
  unlocked,
  active,
  onPick,
}: {
  stage: Stage;
  def: NationDef;
  profile: DiplomatProfile;
  unlocked: boolean;
  active: boolean;
  onPick: () => void;
}) {
  const stamp = profile.stamps[def.id];
  const rep = def.rep;
  return (
    <button
      disabled={!unlocked}
      onClick={onPick}
      className={cn(
        'rounded-2xl border p-3 text-left transition',
        !unlocked && 'cursor-not-allowed opacity-45',
        active ? 'border-sky-300/80 bg-sky-300/10' : 'border-white/10 bg-white/5',
        unlocked && !active && 'hover:border-white/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{def.flag}</span>
            <span className="truncate text-sm font-semibold text-white">{def.name}</span>
            {stamp?.cleared && <Stamp className="h-3.5 w-3.5 shrink-0 text-emerald-300" />}
            {!unlocked && <Lock className="h-3.5 w-3.5 shrink-0 text-white/50" />}
          </div>
          <div className="truncate text-[11px] text-white/55">
            第 {stage.index + 1} 站 · {def.courseName}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
          {CHALLENGE_LABEL[stage.challenge]}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-white/65">{stage.mission}</p>

      <div className="mt-2 rounded-xl bg-black/25 p-2">
        <div className="flex items-center gap-1.5 text-[11px] text-white/75">
          <span className="font-semibold text-white">{rep.displayName}</span>
          <span className="text-white/45">{rep.title}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-white/55" lang={def.languageId}>
          「{rep.greeting}」
        </div>
        <div className="text-[10px] text-white/40">{rep.greetingMeaning}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-white/70">
        <span className="rounded-full bg-black/30 px-2 py-0.5">目標 第 {stage.targetPlace} 名內</span>
        <span className="rounded-full bg-black/30 px-2 py-0.5">
          正確率 ≥ {Math.round(stage.targetAccuracy * 100)}%
        </span>
        <span className="rounded-full bg-black/30 px-2 py-0.5">{def.laps} 圈</span>
      </div>
      <div className="mt-1.5 text-[10px] text-emerald-200/80">
        {stampLabel(profile, def.id)}
        {stamp && stamp.bestTime > 0 && ` · ${formatTime(stamp.bestTime)}`}
      </div>
    </button>
  );
}

/**
 * The circuit lobby: a diplomatic posting board on one tab, free practice on
 * the other. Both hand a `RaceOptions` back up to the page.
 */
export function RaceLobby({ onStart }: { onStart: (options: RaceOptions) => void }) {
  const [profile, setProfile] = useState<DiplomatProfile | null>(null);
  const [tab, setTab] = useState<'campaign' | 'free'>('campaign');
  const [birdId, setBirdId] = useState('gold');
  const [stageIndex, setStageIndex] = useState(0);
  const [freeNation, setFreeNation] = useState('britain');
  const [freeChallenge, setFreeChallenge] = useState<ChallengeKind | 'none'>('word');
  const [difficulty, setDifficulty] = useState(1);
  const [rivals, setRivals] = useState(5);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setStageIndex(currentStage(loaded).index);
  }, []);

  const stage = STAGES[stageIndex] ?? STAGES[0];
  const stageNation = NATIONS[stage.nationId];
  const freeNationDef = NATIONS[freeNation];
  const cleared = useMemo(
    () => (profile ? Object.values(profile.stamps).filter((s) => s.cleared).length : 0),
    [profile],
  );

  if (!profile) return null;

  const start = () => {
    if (tab === 'campaign') {
      onStart({
        mode: 'campaign',
        nationId: stage.nationId,
        birdId,
        difficulty: stage.difficulty,
        rivals: stage.rivals,
        challenge: stage.challenge,
        stageIndex: stage.index,
      });
    } else {
      onStart({
        mode: 'free',
        nationId: freeNation,
        birdId,
        difficulty,
        rivals,
        challenge: freeChallenge === 'none' ? undefined : freeChallenge,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">陸行鳥外交巡迴賽 3D</h1>
        <p className="mt-1 text-sm text-white/60">
          你是 fluent-ai 派出的通譯官。八個國家、八位代表，賽道上的每一道閘門都是一題
          ——選對車道才有加速，選錯就掉速。開到最後就是大使。
        </p>
      </div>

      <div className="mb-4">
        <ProfileBar profile={profile} />
      </div>

      <div className="mb-4 flex gap-2">
        {(
          [
            { id: 'campaign', label: '巡迴賽', icon: Flag },
            { id: 'free', label: '自由練習', icon: Wind },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition',
              tab === id
                ? 'border-amber-300/80 bg-amber-300/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30',
            )}
          >
            <Icon className="mr-1.5 inline h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'campaign' ? (
        <section className="mb-5">
          <h2 className="mb-2 flex items-center justify-between text-sm font-semibold text-white/80">
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" /> 出訪國家
            </span>
            <span className="text-[11px] font-normal text-white/45">已通關 {cleared} / {STAGES.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((item) => (
              <StageCard
                key={item.nationId}
                stage={item}
                def={NATIONS[item.nationId]}
                profile={profile}
                unlocked={isUnlocked(profile, item.index)}
                active={item.index === stageIndex}
                onPick={() => setStageIndex(item.index)}
              />
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-white/70">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-white/85">
              <BookOpenCheck className="h-4 w-4" />
              {stageNation.flag} {stageNation.name} · {CHALLENGE_LABEL[stage.challenge]}
            </div>
            {CHALLENGE_HINT[stage.challenge]}
            <div className="mt-1.5 text-white/50">{stageNation.rep.blurb}</div>
          </div>
        </section>
      ) : (
        <section className="mb-5 space-y-4">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <Flag className="h-4 w-4" /> 賽道（國家）
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.values(NATIONS).map((def) => (
                <button
                  key={def.id}
                  onClick={() => setFreeNation(def.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left text-sm transition',
                    def.id === freeNation
                      ? 'border-sky-300/80 bg-sky-300/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30',
                  )}
                >
                  <div className="truncate">
                    {def.flag} {def.name}
                  </div>
                  <div className="truncate text-[10px] text-white/45">{def.courseName}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <BookOpenCheck className="h-4 w-4" /> 語言關卡
            </h2>
            <div className="flex flex-wrap gap-2">
              {FREE_CHALLENGES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFreeChallenge(item.id)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-sm transition',
                    item.id === freeChallenge
                      ? 'border-sky-300/80 bg-sky-300/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-white/50">
              {freeChallenge === 'none'
                ? '沒有閘門，純粹練路線與甩尾。'
                : `${freeNationDef.flag} ${freeNationDef.name}：${CHALLENGE_HINT[freeChallenge]}`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </section>
      )}

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

      <button
        onClick={start}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:brightness-110"
      >
        {tab === 'campaign'
          ? `出發前往 ${stageNation.flag} ${stageNation.name}`
          : `在 ${freeNationDef.flag} ${freeNationDef.name} 練習`}
      </button>
    </div>
  );
}
