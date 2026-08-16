import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bird, Flag, Globe2, Home, Loader2, LogIn, MessageSquare, Plus, Send, Users, Wifi, WifiOff } from 'lucide-react';
import { BIRDS } from '@/game/race/data/birds';
import { HubWorld } from '@/game/race/hub/hubWorld';
import { HubRenderer } from '@/game/race/hub/HubRenderer';
import type { ChatLine, CircuitNet, RaceRoom } from '@/game/race/net/circuit';
import { CHALLENGE_LABEL, nation } from '@/game/race/data/nations';
import {
  STAGES,
  isUnlocked,
  loadProfile,
  rankFor,
  stageFor,
  stampLabel,
  type DiplomatProfile,
} from '@/game/race/core/campaign';
import type { RaceOptions } from './RaceLobby';
import { cn } from '@/lib/utils';

const HUD_INTERVAL = 120;

interface Held {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

function emptyHeld(): Held {
  return { up: false, down: false, left: false, right: false };
}

function PadButton({
  label,
  className,
  onPress,
  onRelease,
}: {
  label: string;
  className?: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      className={cn(
        'pointer-events-auto select-none touch-none rounded-2xl border border-white/20 bg-slate-950/55 text-lg font-bold text-white/90 backdrop-blur-md active:bg-white/25',
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
      {label}
    </button>
  );
}

/**
 * 使節廣場 — the walkable embassy hub. Talking to a representative starts their
 * circuit stage; the notice board opens race rooms other players can join.
 */
export function EmbassyHub({
  net,
  birdId,
  onPickBird,
  onStartRace,
  onOpenLobby,
}: {
  net: CircuitNet;
  birdId: string;
  /** Persists the chosen mount on the page, so a race uses it too. */
  onPickBird: (birdId: string) => void;
  onStartRace: (options: RaceOptions) => void;
  onOpenLobby: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HubWorld | null>(null);
  const rendererRef = useRef<HubRenderer | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const heldRef = useRef<Held>(emptyHeld());
  const startRef = useRef(onStartRace);
  startRef.current = onStartRace;
  /**
   * The mount lives in a ref as well as in props: swapping it in the stable
   * must repaint the bird, not tear down the plaza and reconnect.
   */
  const birdRef = useRef(birdId);
  birdRef.current = birdId;

  const [profile, setProfile] = useState<DiplomatProfile>(() => loadProfile());
  const [nearby, setNearby] = useState<string | undefined>();
  const [talkTo, setTalkTo] = useState<string | undefined>();
  const [boardOpen, setBoardOpen] = useState(false);
  const [rooms, setRooms] = useState<RaceRoom[]>([]);
  const [room, setRoom] = useState<RaceRoom | undefined>();
  const [status, setStatus] = useState(net.status);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [stableOpen, setStableOpen] = useState(false);

  const rank = useMemo(() => rankFor(profile.credits), [profile.credits]);

  // ── boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const saved = loadProfile();
    setProfile(saved);
    const hub = new HubWorld({ name: '你', birdId: birdRef.current, rank: rankFor(saved.credits).name });
    const renderer = new HubRenderer(canvas, hub);
    hubRef.current = hub;
    rendererRef.current = renderer;

    net.setProfile({ name: '你', birdId: birdRef.current, rank: rankFor(saved.credits).name });
    void net.connect(hub);
    net.onRaceStart((started) => {
      // The host pressed start: everyone in the room drops onto the grid.
      startRef.current({
        mode: 'multiplayer',
        nationId: started.nationId,
        birdId: birdRef.current,
        difficulty: 1,
        rivals: started.rivals,
        challenge: started.challenge,
        seed: started.seed,
        roomId: started.id,
        remotes: net.roomOpponents(),
      });
    });

    const resize = () => renderer.resize(wrap.clientWidth, wrap.clientHeight);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let hudAt = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Movement is screen-relative: W walks away from the camera.
      const held = heldRef.current;
      const forwardX = Math.sin(hub.player.yaw);
      const forwardZ = Math.cos(hub.player.yaw);
      const ahead = (held.up ? 1 : 0) - (held.down ? 1 : 0);
      const side = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      hub.setInput({
        x: forwardX * ahead - forwardZ * side,
        z: forwardZ * ahead + forwardX * side,
      });

      hub.tick(dt);
      net.update(dt, hub);
      renderer.frame(dt);

      if (now - hudAt > HUD_INTERVAL) {
        hudAt = now;
        setNearby(hub.nearestRep()?.pavilion.nationId);
        setRooms(net.rooms());
        setRoom(net.room);
        setStatus(net.status);
        setChat(net.chat());
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      hubRef.current = null;
      rendererRef.current = null;
    };
  }, [net]);

  // ── keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map: Record<string, keyof Held> = {
      w: 'up',
      arrowup: 'up',
      s: 'down',
      arrowdown: 'down',
      a: 'left',
      arrowleft: 'left',
      d: 'right',
      arrowright: 'right',
    };
    const typing = () => document.activeElement instanceof HTMLInputElement;

    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (typing()) {
        if (key === 'escape') (document.activeElement as HTMLInputElement).blur();
        return;
      }
      if (key === 'enter') {
        e.preventDefault();
        setChatOpen(true);
        // Focus lands after the panel renders.
        window.setTimeout(() => chatInputRef.current?.focus(), 0);
        return;
      }
      const control = map[key];
      if (control) {
        e.preventDefault();
        heldRef.current[control] = true;
        return;
      }
      if (key === 'f') {
        const near = hubRef.current?.nearestRep();
        if (near) setTalkTo(near.pavilion.nationId);
      } else if (key === 'b') {
        setBoardOpen((open) => !open);
      } else if (key === 'escape') {
        setTalkTo(undefined);
        setBoardOpen(false);
        setStableOpen(false);
      }
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
  }, []);

  const hold = useMemo(
    () => (control: keyof Held, value: boolean) => () => {
      heldRef.current[control] = value;
    },
    [],
  );

  const startStage = useCallback(
    (nationId: string) => {
      const stage = stageFor(nationId);
      if (!stage) return;
      onStartRace({
        mode: 'campaign',
        nationId,
        birdId: birdRef.current,
        difficulty: stage.difficulty,
        rivals: stage.rivals,
        challenge: stage.challenge,
        stageIndex: stage.index,
      });
    },
    [onStartRace],
  );

  const openRoom = useCallback(
    (nationId: string) => {
      const stage = stageFor(nationId);
      setRoom(net.createRoom({ nationId, challenge: stage?.challenge, rivals: stage?.rivals ?? 5 }));
      setTalkTo(undefined);
      setBoardOpen(true);
    },
    [net],
  );

  const sendChat = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    net.say(text);
    setChat(net.chat());
    setDraft('');
  }, [draft, net]);

  const pickBird = useCallback(
    (next: string) => {
      onPickBird(next);
      rendererRef.current?.setPlayerBird(next);
      const saved = loadProfile();
      net.setProfile({ name: '你', birdId: next, rank: rankFor(saved.credits).name });
      setStableOpen(false);
    },
    [net, onPickBird],
  );

  const nearbyNation = nearby ? nation(nearby) : undefined;
  const talkNation = talkTo ? nation(talkTo) : undefined;
  const talkStage = talkTo ? stageFor(talkTo) : undefined;
  const talkUnlocked = talkStage ? isUnlocked(profile, talkStage.index) : false;

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />

      {/* Profile and connection state. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-3">
        <div className="rounded-2xl border border-white/15 bg-slate-950/70 px-3 py-2 backdrop-blur-md">
          <div className="text-[10px] uppercase tracking-wide text-white/45">使節廣場</div>
          <div className="text-sm font-bold text-white">{rank.name}</div>
          <div className="text-[11px] text-white/55">
            外交積分 {profile.credits} · 通關 {Object.values(profile.stamps).filter((s) => s.cleared).length}/
            {STAGES.length}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex gap-1.5">
            <button
              onClick={() => setBoardOpen(true)}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-white/85 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <Users className="mr-1 inline h-3 w-3" />
              賽事大廳
            </button>
            <button
              onClick={() => setStableOpen(true)}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-white/85 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <Bird className="mr-1 inline h-3 w-3" />
              馬廄
            </button>
            <button
              onClick={onOpenLobby}
              className="rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-white/85 backdrop-blur-md transition hover:bg-slate-800/80"
            >
              <Globe2 className="mr-1 inline h-3 w-3" />
              巡迴賽總覽
            </button>
          </div>
          <div className="rounded-xl border border-white/15 bg-slate-950/70 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-md">
            {status.mode === 'online' ? (
              <>
                <Wifi className="mr-1 inline h-3 w-3 text-emerald-300" />
                線上 · 廣場 {status.online} 人
              </>
            ) : (
              <>
                <WifiOff className="mr-1 inline h-3 w-3 text-white/45" />
                模擬連線
              </>
            )}
          </div>
        </div>
      </div>

      {/* Walk-up prompt. */}
      {nearbyNation && !talkTo && !boardOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4 [@media(hover:hover)]:bottom-16">
          <button
            onClick={() => setTalkTo(nearbyNation.id)}
            className="pointer-events-auto rounded-full border border-white/25 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md"
          >
            {nearbyNation.flag} 與 {nearbyNation.rep.displayName} 對話
            <span className="ml-2 hidden text-[11px] text-white/50 [@media(hover:hover)]:inline">按 F</span>
          </button>
        </div>
      )}

      {/* Representative dialog. */}
      {talkNation && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/92 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{talkNation.flag}</span>
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{talkNation.rep.displayName}</div>
                <div className="text-[11px] text-white/55">
                  {talkNation.name} · {talkNation.rep.title}
                </div>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm" lang={talkNation.languageId}>
              「{talkNation.rep.greeting}」
            </p>
            <p className="mt-1 text-[11px] text-white/55">{talkNation.rep.greetingMeaning}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-white/70">{talkNation.rep.blurb}</p>

            <div className="mt-3 rounded-xl bg-black/25 p-2.5 text-[11px] text-white/70">
              <div>
                賽道：{talkNation.courseName} · {talkNation.laps} 圈
              </div>
              {talkStage && (
                <div>
                  關卡：{CHALLENGE_LABEL[talkStage.challenge]} · 目標 第 {talkStage.targetPlace} 名內 · 正確率 ≥{' '}
                  {Math.round(talkStage.targetAccuracy * 100)}%
                </div>
              )}
              <div className="text-emerald-200/80">{stampLabel(profile, talkNation.id)}</div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                disabled={!talkUnlocked}
                onClick={() => startStage(talkNation.id)}
                className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-45"
              >
                <Flag className="mr-1 inline h-4 w-4" />
                {talkUnlocked ? '出賽（單人巡迴賽）' : '尚未解鎖，先通過前一站'}
              </button>
              <button
                onClick={() => openRoom(talkNation.id)}
                className="w-full rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              >
                <Plus className="mr-1 inline h-4 w-4" />
                在這裡開一場多人賽事
              </button>
              <button
                onClick={() => setTalkTo(undefined)}
                className="w-full rounded-xl px-4 py-2 text-sm text-white/55 transition hover:text-white"
              >
                離開
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Race rooms. */}
      {boardOpen && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/92 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-base font-bold">
                <Users className="h-4 w-4" /> 賽事大廳
              </div>
              <span className="text-[11px] text-white/45">
                {status.mode === 'online' ? `線上 ${status.online} 人` : '模擬連線（未設定 Supabase）'}
              </span>
            </div>

            {room ? (
              <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-3">
                <div className="text-sm font-semibold">
                  {nation(room.nationId).flag} {nation(room.nationId).courseName}
                  {room.challenge && (
                    <span className="ml-1.5 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-sky-200">
                      {CHALLENGE_LABEL[room.challenge]}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1 text-[12px]">
                  {room.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1">
                      <span className="truncate">
                        {member.name}
                        {member.id === room.hostId && <span className="ml-1 text-[10px] text-amber-300">房主</span>}
                      </span>
                      <span className="text-white/45">{member.birdId}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 text-[11px] text-white/50">
                  其餘 {Math.max(0, room.rivals - (room.members.length - 1))} 位由 AI 代表遞補。
                </div>
                <div className="mt-3 flex gap-2">
                  {room.hostId === net.selfId ? (
                    <button
                      onClick={() => net.startRoom()}
                      className="flex-1 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-110"
                    >
                      開始比賽
                    </button>
                  ) : (
                    <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/65">
                      <Loader2 className="h-4 w-4 animate-spin" /> 等待房主開賽…
                    </div>
                  )}
                  <button
                    onClick={() => {
                      net.leaveRoom();
                      setRoom(undefined);
                    }}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    離開房間
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {rooms.length === 0 && (
                    <p className="rounded-xl bg-white/5 px-3 py-4 text-center text-[12px] text-white/55">
                      目前沒有開放的房間。走到任何一位代表面前就能開一場。
                    </p>
                  )}
                  {rooms.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {nation(item.nationId).flag} {nation(item.nationId).courseName}
                          {item.simulated && (
                            <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                              模擬
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-white/50">
                          {item.hostName} · {item.members.length} 人
                          {item.challenge ? ` · ${CHALLENGE_LABEL[item.challenge]}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => setRoom(net.joinRoom(item.id))}
                        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-white/20"
                      >
                        <LogIn className="mr-1 inline h-3 w-3" />
                        加入
                      </button>
                    </div>
                  ))}
                </div>
                {status.mode !== 'online' && (
                  <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                    沒有偵測到 Supabase 連線，所以廣場上的外交官與這些房間都是模擬的；
                    加入後會以 AI 代表填滿起跑格，玩法完全相同。
                  </p>
                )}
              </>
            )}

            <button
              onClick={() => setBoardOpen(false)}
              className="mt-4 w-full rounded-xl px-4 py-2 text-sm text-white/55 transition hover:text-white"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Plaza chat. Collapsed to a button until you open it. */}
      <div className="pointer-events-none absolute bottom-24 left-2.5 w-64 sm:bottom-16 sm:left-3 sm:w-72">
        {chatOpen ? (
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-950/75 p-2 backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/45">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> 廣場頻道
              </span>
              <button onClick={() => setChatOpen(false)} className="hover:text-white">
                收起
              </button>
            </div>
            <div className="max-h-32 space-y-0.5 overflow-y-auto text-[11px]">
              {chat.length === 0 && <p className="text-white/40">還沒有人說話。</p>}
              {chat.map((line, index) => (
                <div key={`${line.id}-${index}`} className="leading-snug">
                  <span className={cn('font-semibold', line.self ? 'text-amber-300' : 'text-sky-300')}>
                    {line.name}
                  </span>
                  <span className="text-white/45">：</span>
                  <span className="text-white/85">{line.text}</span>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChat();
              }}
              className="mt-1.5 flex gap-1"
            >
              <input
                ref={chatInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={120}
                placeholder="說點什麼…"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-white/40"
              />
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-2 text-white/80 transition hover:bg-white/20"
                aria-label="送出"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => {
              setChatOpen(true);
              window.setTimeout(() => chatInputRef.current?.focus(), 0);
            }}
            className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-md transition hover:bg-slate-800/80"
          >
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {chat.length > 0 ? `${chat.at(-1)!.name}：${chat.at(-1)!.text}` : '廣場頻道'}
            </span>
          </button>
        )}
      </div>

      {/* Stable: swap the mount you ride, in the hub and on the grid. */}
      {stableOpen && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/92 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-1.5 text-base font-bold">
              <Bird className="h-4 w-4" /> 馬廄
            </div>
            <p className="mt-1 text-[11px] text-white/55">選好的座騎會跟著你進入下一場比賽。</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.values(BIRDS).map((bird) => (
                <button
                  key={bird.id}
                  onClick={() => pickBird(bird.id)}
                  className={cn(
                    'rounded-2xl border p-2.5 text-left transition',
                    bird.id === birdId
                      ? 'border-amber-300/80 bg-amber-300/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base"
                      style={{ background: `#${bird.body.toString(16).padStart(6, '0')}` }}
                    >
                      🐤
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{bird.name}</div>
                      <div className="text-[10px] text-white/50">{bird.title}</div>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-snug text-white/55">{bird.blurb}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStableOpen(false)}
              className="mt-4 w-full rounded-xl px-4 py-2 text-sm text-white/55 transition hover:text-white"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Touch movement pad. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 [@media(hover:hover)]:hidden">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <PadButton label="▲" className="h-14 w-14" onPress={hold('up', true)} onRelease={hold('up', false)} />
          <span />
          <PadButton label="◀" className="h-14 w-14" onPress={hold('left', true)} onRelease={hold('left', false)} />
          <PadButton label="▼" className="h-14 w-14" onPress={hold('down', true)} onRelease={hold('down', false)} />
          <PadButton label="▶" className="h-14 w-14" onPress={hold('right', true)} onRelease={hold('right', false)} />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 gap-3 rounded-full bg-slate-950/60 px-4 py-1.5 text-[11px] text-white/60 backdrop-blur-md [@media(hover:hover)]:flex">
        <span>WASD 移動</span>
        <span>F 對話</span>
        <span>B 賽事大廳</span>
        <span>Enter 聊天</span>
        <Home className="h-3 w-3 self-center opacity-50" />
      </div>
    </div>
  );
}
