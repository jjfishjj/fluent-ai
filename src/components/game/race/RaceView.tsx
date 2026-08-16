import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addCard } from '@/lib/memory-srs';
import { RaceSim } from '@/game/race/core/race';
import { RaceRenderer, type CameraMode } from '@/game/race/render/RaceRenderer';
import { saveResult } from '@/game/race/core/records';
import { STAGES, applyRace, loadProfile, nationName } from '@/game/race/core/campaign';
import { nation } from '@/game/race/data/nations';
import type { Phrase } from '@/game/race/data/nations';
import type { RaceSnapshot } from '@/game/race/core/types';
import { CountdownOverlay, RaceHud, ResultOverlay } from './RaceHud';
import { speakPhrase } from '@/game/race/core/speech';
import { GateFlash, GatePrompt, MemoriseOverlay, type CampaignSummary } from './RaceLanguageHud';
import type { CircuitNet } from '@/game/race/net/circuit';
import type { RaceOptions } from './RaceLobby';
import { cn } from '@/lib/utils';

const HUD_INTERVAL = 80;
const CAMERA_LABEL: Record<CameraMode, string> = { chase: '跟隨', wide: '遠景', first: '第一人稱' };
/** Seconds to study the sequence before the lights on recall stages. */
const MEMORISE_SECONDS = 8;

interface Held {
  gas: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  drift: boolean;
}

function emptyHeld(): Held {
  return { gas: false, brake: false, left: false, right: false, sprint: false, drift: false };
}

/** A held on-screen button that maps to one control. */
function PadButton({
  label,
  hint,
  className,
  onPress,
  onRelease,
}: {
  label: string;
  hint?: string;
  className?: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      className={cn(
        'pointer-events-auto select-none touch-none rounded-2xl border border-white/20 bg-slate-950/55 text-white/90 backdrop-blur-md active:bg-white/25',
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="block text-lg font-bold leading-none">{label}</span>
      {hint && <span className="mt-0.5 block text-[10px] font-medium text-white/55">{hint}</span>}
    </button>
  );
}

/**
 * Hosts one race: the canvas, the render loop, input, the language gates'
 * speech and memorisation phases, and the bridge from a finished race into the
 * diplomat profile and fluent-ai's memory cards.
 */
export function RaceView({
  options,
  net,
  onExit,
}: {
  options: RaceOptions;
  /** Present when the race came out of a hub room; drives the other humans. */
  net?: CircuitNet;
  onExit: () => void;
}) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<RaceSim | null>(null);
  const rendererRef = useRef<RaceRenderer | null>(null);
  const heldRef = useRef<Held>(emptyHeld());
  const steerRef = useRef(0);
  const savedRef = useRef(false);
  /** Seconds left of the pre-race memorisation phase. */
  const memoriseRef = useRef(0);
  /** `lap:gateIndex` of the listening gate already spoken. */
  const spokenRef = useRef('');

  const [runId, setRunId] = useState(0);
  const [hud, setHud] = useState<RaceSnapshot | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [newRecord, setNewRecord] = useState(false);
  const [memoriseLeft, setMemoriseLeft] = useState(0);
  const [summary, setSummary] = useState<CampaignSummary | undefined>();
  const [cardsAdded, setCardsAdded] = useState(0);

  const nationDef = useMemo(() => nation(options.nationId), [options.nationId]);
  const memorise: Phrase[] = simRef.current?.gateSet?.memorise ?? [];

  const pushToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1600);
  }, []);

  const restart = useCallback(() => {
    savedRef.current = false;
    setNewRecord(false);
    setSummary(undefined);
    setCardsAdded(0);
    setToasts([]);
    setRunId((n) => n + 1);
  }, []);

  /** Sends every word missed this race into the spaced-repetition deck. */
  const addMissedToMemory = useCallback(() => {
    if (!summary || summary.missed.length === 0) return;
    const userId = user?.id ?? 'guest';
    const seen = new Set<string>();
    let added = 0;
    for (const phrase of summary.missed) {
      if (seen.has(phrase.native)) continue;
      seen.add(phrase.native);
      addCard(userId, {
        english: phrase.native,
        meaning: phrase.meaning,
        encodeNote: `${nationDef.flag} ${nationDef.name}${phrase.roman ? ` · ${phrase.roman}` : ''}｜陸行鳥巡迴賽`,
      });
      added += 1;
    }
    setCardsAdded(added);
  }, [summary, user, nationDef]);

  // ── boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const sim = new RaceSim({
      trackId: options.nationId,
      birdId: options.birdId,
      riderName: '你',
      rivals: options.rivals,
      difficulty: options.difficulty,
      // Multiplayer races share the room's seed so every client builds the
      // same track, the same gates and the same AI field.
      seed: (options.seed ?? 20260813) + runId * 977,
      challenge: options.challenge,
      remotes: options.remotes,
    });
    const renderer = new RaceRenderer(canvas, sim);
    net?.onRacerPacket((packet) => sim.applyRemote(packet.id, packet));
    simRef.current = sim;
    rendererRef.current = renderer;
    heldRef.current = emptyHeld();
    steerRef.current = 0;
    spokenRef.current = '';
    memoriseRef.current = sim.gateSet?.memorise.length ? MEMORISE_SECONDS : 0;
    setMemoriseLeft(memoriseRef.current);
    setHud(sim.snapshot(60));

    const resize = () => renderer.resize(wrap.clientWidth, wrap.clientHeight);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let fps = 60;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Study phase: the world renders, but the countdown is held.
      if (memoriseRef.current > 0) {
        memoriseRef.current = Math.max(0, memoriseRef.current - dt);
        renderer.frame(dt);
        if (now - hudAt > HUD_INTERVAL) {
          hudAt = now;
          setMemoriseLeft(memoriseRef.current);
        }
        return;
      }

      // Ramp the keyboard's on/off steering into something analogue.
      const held = heldRef.current;
      const target = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const rate = target === 0 ? 9 : 6;
      steerRef.current += (target - steerRef.current) * Math.min(1, rate * dt);
      sim.setPlayerInput({
        throttle: held.gas ? 1 : 0,
        brake: held.brake ? 1 : 0,
        steer: steerRef.current,
        sprint: held.sprint,
        drift: held.drift,
      });

      sim.tick(dt);

      for (const event of sim.drainEvents()) {
        if (event.racerId !== 'player' && event.kind !== 'go') continue;
        if (event.kind === 'lap') pushToast(`第 ${event.value} 圈`);
        else if (event.kind === 'boost') pushToast('加速板！');
        else if (event.kind === 'drift' && (event.value ?? 0) > 1) pushToast('完美甩尾！');
        else if (event.kind === 'go') pushToast('起跑！');
      }

      renderer.frame(dt);

      // Publish our own bird so the other clients can draw it.
      if (net && options.roomId) {
        const me = sim.player;
        net.publishRacer(
          {
            x: me.pos.x,
            z: me.pos.z,
            yaw: me.yaw,
            speed: me.speed,
            lap: me.lap,
            progress: me.progress,
          },
          dt,
        );
      }

      fpsAccum += dt;
      fpsFrames += 1;
      if (fpsAccum >= 0.5) {
        fps = Math.round(fpsFrames / fpsAccum);
        fpsAccum = 0;
        fpsFrames = 0;
      }

      if (now - hudAt > HUD_INTERVAL) {
        hudAt = now;
        const snapshot = sim.snapshot(fps);
        setHud(snapshot);

        // Read a listening gate aloud once, as it comes into range.
        const upcoming = snapshot.language?.upcoming;
        const key = `${snapshot.player.lap}:${upcoming?.gateIndex}`;
        if (upcoming?.question.speak && spokenRef.current !== key) {
          spokenRef.current = key;
          speakPhrase(upcoming.question.speak, sim.gateSet?.speechLang ?? 'en');
        }

        if (snapshot.player.finished && !savedRef.current) {
          savedRef.current = true;
          const saved = saveResult({
            trackId: options.nationId,
            birdId: options.birdId,
            place: snapshot.player.place,
            finishTime: snapshot.player.finishTime,
            bestLap: snapshot.player.bestLap,
          });
          setNewRecord(saved.newRaceRecord || saved.newLapRecord);
          setSummary(
            options.mode === 'multiplayer'
              ? {
                  // A room race is for bragging rights: no stamps, no credits.
                  nationName: nation(options.nationId).name,
                  multiplayer: true,
                  isCampaign: false,
                  cleared: false,
                  credits: { placement: 0, language: 0, clearBonus: 0, total: 0 },
                  missed: sim.playerLog.filter((r) => r.outcome !== 'correct').map((r) => r.answer),
                }
              : buildSummary(sim, options),
          );
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      window.speechSynthesis?.cancel();
      simRef.current = null;
      rendererRef.current = null;
    };
  }, [options, runId, pushToast, net]);

  // ── keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map: Record<string, keyof Held> = {
      w: 'gas',
      arrowup: 'gas',
      s: 'brake',
      arrowdown: 'brake',
      a: 'left',
      arrowleft: 'left',
      d: 'right',
      arrowright: 'right',
      shift: 'sprint',
      ' ': 'drift',
    };

    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const control = map[key];
      if (control) {
        e.preventDefault();
        // Any control also means "I have read the sequence, go".
        if (memoriseRef.current > 0) memoriseRef.current = 0;
        heldRef.current[control] = true;
        return;
      }
      if (key === 'c') setCameraMode(rendererRef.current?.cycleCamera() ?? 'chase');
      else if (key === 'r') restart();
      else if (key === 'escape') onExit();
    };
    const up = (e: KeyboardEvent) => {
      const control = map[e.key.toLowerCase()];
      if (control) heldRef.current[control] = false;
    };
    const blur = () => {
      heldRef.current = emptyHeld();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [onExit, restart]);

  const set = useMemo(
    () => (control: keyof Held, value: boolean) => () => {
      heldRef.current[control] = value;
    },
    [],
  );

  const track = simRef.current?.track;

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />

      {hud && track && (
        <>
          <RaceHud
            hud={hud}
            track={track}
            cameraLabel={CAMERA_LABEL[cameraMode]}
            onCamera={() => setCameraMode(rendererRef.current?.cycleCamera() ?? 'chase')}
            onRestart={restart}
            onExit={onExit}
          />
          {hud.language && hud.phase === 'running' && <GatePrompt language={hud.language} />}
          {hud.language && <GateFlash language={hud.language} />}
          <CountdownOverlay hud={hud} />
          <ResultOverlay
            hud={hud}
            newRecord={newRecord}
            summary={summary}
            cardsAdded={cardsAdded}
            onAddCards={addMissedToMemory}
            onRestart={restart}
            onExit={onExit}
          />
        </>
      )}

      {memoriseLeft > 0 && (
        <div className="absolute inset-0" onPointerDown={() => (memoriseRef.current = 0)}>
          <MemoriseOverlay phrases={memorise} secondsLeft={memoriseLeft} />
        </div>
      )}

      {/* Toasts sit above the road, centred, out of the way of both HUD columns. */}
      <div className="pointer-events-none absolute inset-x-0 top-40 flex flex-col items-center gap-1">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-in fade-in slide-in-from-top-2 rounded-full bg-slate-950/75 px-4 py-1.5 text-sm font-bold text-amber-200 backdrop-blur-md"
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* Touch controls — hidden once a pointer with hover is detected. The
          right-hand cluster stacks two-by-two so it fits a 360px phone. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 [@media(hover:hover)]:hidden">
        <div className="flex gap-2">
          <PadButton label="◀" className="h-16 w-16" onPress={set('left', true)} onRelease={set('left', false)} />
          <PadButton label="▶" className="h-16 w-16" onPress={set('right', true)} onRelease={set('right', false)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PadButton label="甩" hint="甩尾" className="h-14 w-14" onPress={set('drift', true)} onRelease={set('drift', false)} />
          <PadButton label="衝" hint="體力" className="h-14 w-14" onPress={set('sprint', true)} onRelease={set('sprint', false)} />
          <PadButton label="煞" className="h-14 w-14" onPress={set('brake', true)} onRelease={set('brake', false)} />
          <PadButton
            label="加速"
            className="h-14 w-14 bg-amber-400/30"
            onPress={set('gas', true)}
            onRelease={set('gas', false)}
          />
        </div>
      </div>

      {/* Keyboard legend, desktop only. */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 gap-3 rounded-full bg-slate-950/60 px-4 py-1.5 text-[11px] text-white/60 backdrop-blur-md [@media(hover:hover)]:flex">
        <span>W 加速</span>
        <span>A/D 轉向（也用來選閘門車道）</span>
        <span>S 煞車</span>
        <span>Shift 衝刺</span>
        <span>空白鍵 甩尾</span>
        <span>C 視角</span>
        <span>R 重跑</span>
      </div>
    </div>
  );
}

/** Folds the finished race into the diplomat profile and builds the results card. */
function buildSummary(sim: RaceSim, options: RaceOptions): CampaignSummary {
  const player = sim.player;
  const stage = options.stageIndex !== undefined ? STAGES[options.stageIndex] : undefined;
  const result = applyRace(loadProfile(), {
    nationId: options.nationId,
    place: player.place,
    entrants: sim.racers.length,
    finishTime: player.finishTime,
    correct: player.gates.correct,
    answered: player.gates.correct + player.gates.wrong + player.gates.missed,
    log: sim.playerLog,
    difficulty: options.difficulty,
  });

  return {
    nationName: nationName(options.nationId),
    mission: stage?.mission,
    isCampaign: options.mode === 'campaign',
    cleared: result.cleared,
    credits: result.credits,
    promotedTo: result.promotedTo?.name,
    unlockedNation: result.unlocked ? nationName(result.unlocked.nationId) : undefined,
    missed: result.missedThisRace,
    targetPlace: stage?.targetPlace,
    targetAccuracy: stage?.targetAccuracy,
  };
}
