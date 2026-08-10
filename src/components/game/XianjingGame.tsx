import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classDef } from '@/game/data/classes';
import { QUESTS } from '@/game/data/quests';
import { ITEMS } from '@/game/data/items';
import { World } from '@/game/core/world';
import { saveProfile } from '@/game/core/save';
import { distance } from '@/game/core/formulas';
import { GameRenderer } from '@/game/render/GameRenderer';
import { CompanionDirector } from '@/game/net/companions';
import type { ChatLine, HudSnapshot, NpcDef, PlayerProfile, Stats } from '@/game/core/types';
import {
  BuffBar,
  ControlHints,
  DeathOverlay,
  PlayerFrame,
  QuestTracker,
  SkillBar,
  TargetFrame,
  TouchActions,
  ZoneBanner,
} from './GameHud';
import { Minimap } from './Minimap';
import { ChatPanel } from './ChatPanel';
import { CharacterSheet } from './CharacterSheet';
import { NpcDialog, ShopDialog } from './GameDialogs';

const HUD_INTERVAL = 100;

export function XianjingGame({ profile, onExit }: { profile: PlayerProfile; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const worldRef = useRef<World | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const companionsRef = useRef<CompanionDirector | null>(null);
  const yawRef = useRef(Math.PI);
  const keysRef = useRef(new Set<string>());

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [talk, setTalk] = useState<{ npc: NpcDef } | null>(null);
  const [netMode, setNetMode] = useState('simulated');

  const skillOrder = useMemo(() => classDef(profile.classId).skills, [profile.classId]);

  // Anything the UI calls that must reach the live world instance.
  const withWorld = useCallback(<T,>(fn: (w: World) => T): T | undefined => {
    const w = worldRef.current;
    return w ? fn(w) : undefined;
  }, []);

  const cast = useCallback(
    (skillId: string) => {
      const w = worldRef.current;
      const r = rendererRef.current;
      if (!w || !r) return;
      w.castSkill(skillId, r.aim);
    },
    [],
  );

  const interact = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    const hit = w.interact();
    if (!hit) {
      w.say('system', '系統', '附近沒有可以對話的人。');
      return;
    }
    const npc = w.zone.npcs.find((n) => n.id === hit.npcId);
    if (npc) setTalk({ npc });
  }, []);

  // ── boot ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const world = new World(profile);
    const renderer = new GameRenderer(canvas, world);
    const companions = new CompanionDirector(world);
    companions.enterZone(world.zone.id);
    worldRef.current = world;
    rendererRef.current = renderer;
    companionsRef.current = companions;
    world.say('system', '系統', '歡迎來到仙境。點擊地面移動，點擊怪物選取目標。');

    const resize = () => {
      renderer.resize(wrap.clientWidth, wrap.clientHeight);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let hudAt = 0;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let fps = 60;
    let zoneId = world.zone.id;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;

      applyKeyboardMovement(world, renderer, keysRef.current);
      world.tick(dt);
      companions.update(dt);
      renderer.handleEvents(world.drainEvents());

      if (world.zone.id !== zoneId) {
        zoneId = world.zone.id;
        companions.enterZone(zoneId);
      }

      const ground = renderer.pickGround();
      if (ground) renderer.aim = ground;
      renderer.frame(dt, elapsed);
      yawRef.current = renderer.yaw;

      fpsAccum += dt;
      fpsFrames += 1;
      if (fpsAccum >= 0.5) {
        fps = Math.round(fpsFrames / fpsAccum);
        fpsAccum = 0;
        fpsFrames = 0;
      }

      if (now - hudAt > HUD_INTERVAL) {
        hudAt = now;
        setHud(world.snapshot(fps));
        setChat([...world.chat]);
        setNetMode(companions.status.mode);
      }
    };
    raf = requestAnimationFrame(loop);

    const save = window.setInterval(() => saveProfile(world.profile), 8000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(save);
      ro.disconnect();
      saveProfile(world.profile);
      companions.dispose();
      renderer.dispose();
      worldRef.current = null;
      rendererRef.current = null;
      companionsRef.current = null;
    };
  }, [profile]);

  // ── keyboard ───────────────────────────────────────────────────────────
  useEffect(() => {
    const typing = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    };

    const down = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !typing()) {
        e.preventDefault();
        chatInputRef.current?.focus();
        return;
      }
      if (typing()) return;

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keysRef.current.add(key);
        return;
      }

      const w = worldRef.current;
      if (!w) return;

      if (key >= '1' && key <= '4') {
        e.preventDefault();
        const skillId = skillOrder[Number(key) - 1];
        if (skillId) cast(skillId);
        return;
      }

      switch (key) {
        case 'tab':
          e.preventDefault();
          w.cycleTarget();
          break;
        case 'f':
          interact();
          break;
        case 'c':
          setSheetOpen((v) => !v);
          break;
        case 'r':
        case 't': {
          const potions = w.profile.inventory.filter((s) => ITEMS[s.itemId]?.kind === 'consumable');
          const slot = potions[key === 'r' ? 0 : 1];
          if (slot) w.useItem(slot.itemId);
          break;
        }
        case 'escape':
          setSheetOpen(false);
          setShopOpen(false);
          setTalk(null);
          break;
      }
    };

    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    const blur = () => keysRef.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [cast, interact, skillOrder]);

  // ── pointer ────────────────────────────────────────────────────────────
  const orbiting = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  /** Live touch points, so two fingers can be recognised as a pinch. */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef(0);
  /** The touch that might still turn out to be a tap rather than a drag. */
  const tapCandidate = useRef<{ id: number; x: number; y: number; at: number } | null>(null);

  const updatePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rendererRef.current?.setPointer(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  };

  /** Select, talk to, or walk towards whatever is under the cursor. */
  const actAtPointer = () => {
    const w = worldRef.current;
    const r = rendererRef.current;
    if (!w || !r) return;

    const entityId = r.pickEntity();
    const entity = w.entity(entityId);
    if (entity && entity.kind === 'npc') {
      if (distance(w.player.pos.x, w.player.pos.z, entity.pos.x, entity.pos.z) < 4.5) {
        const npc = w.zone.npcs.find((n) => n.id === entity.npcId);
        if (npc) setTalk({ npc });
      } else {
        w.moveTo(entity.pos);
      }
      return;
    }
    if (entity && entity.state !== 'dead') {
      w.setTarget(entity.id);
      return;
    }
    const ground = r.pickGround();
    if (ground) w.moveTo(ground);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointer(e);
    if (!worldRef.current || !rendererRef.current) return;

    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      e.currentTarget.setPointerCapture(e.pointerId);
      if (touches.current.size === 2) {
        // Second finger down: this is a pinch, not a tap or a drag.
        const [a, b] = [...touches.current.values()];
        pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
        tapCandidate.current = null;
        orbiting.current = false;
        return;
      }
      // A single finger is a tap until it travels far enough to be a drag.
      tapCandidate.current = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() };
      lastPointer.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 2 || e.button === 1) {
      orbiting.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    actAtPointer();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointer(e);

    if (e.pointerType === 'touch') {
      if (!touches.current.has(e.pointerId)) return;
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (touches.current.size >= 2) {
        const [a, b] = [...touches.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        rendererRef.current?.zoom((pinchDistance.current - d) * 3);
        pinchDistance.current = d;
        return;
      }

      const tap = tapCandidate.current;
      if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12) {
        // Travelled too far to be a tap — treat the rest of the gesture as an orbit.
        tapCandidate.current = null;
        orbiting.current = true;
      }
    }

    if (!orbiting.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    rendererRef.current?.orbit(dx, dy);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') {
      touches.current.delete(e.pointerId);
      const tap = tapCandidate.current;
      if (tap && e.pointerId === tap.id && performance.now() - tap.at < 500) {
        tapCandidate.current = null;
        actAtPointer();
      }
      if (touches.current.size < 2) pinchDistance.current = 0;
    }
    orbiting.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Registered natively so the listener can be non-passive and stop page scroll.
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      rendererRef.current?.zoom(e.deltaY);
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    return () => canvas.removeEventListener('wheel', wheel);
  }, []);

  // ── HUD callbacks ──────────────────────────────────────────────────────
  const turnInQuest = (questId: string) => {
    const w = worldRef.current;
    if (!w) return;
    const def = QUESTS[questId];
    const giver = w.zone.npcs.find((n) => n.id === def?.giver);
    if (!giver || distance(w.player.pos.x, w.player.pos.z, giver.at.x, giver.at.z) > 4.5) {
      w.say('system', '系統', `請回到 ${def?.giver ? `${def.zone} 的委託人` : 'NPC'} 身邊覆命。`);
      return;
    }
    w.completeQuest(questId);
  };

  if (!hud) {
    return (
      <div ref={wrapRef} className="relative min-h-0 w-full flex-1 bg-slate-950">
        <canvas ref={canvasRef} className="h-full w-full" />
        <div className="absolute inset-0 grid place-items-center text-sm text-white/70">正在生成仙境…</div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative min-h-0 w-full flex-1 select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* top-left: player + target */}
      <div className="pointer-events-none absolute left-3 top-3 space-y-2">
        <PlayerFrame hud={hud} onOpenSheet={() => setSheetOpen(true)} />
        <TargetFrame hud={hud} />
        <BuffBar hud={hud} />
      </div>

      {/* top-right: zone + minimap + quests */}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
        <ZoneBanner hud={hud} mode={netMode} />
        <Minimap worldRef={worldRef} yawRef={yawRef} />
        <QuestTracker hud={hud} onTurnIn={turnInQuest} />
        <button
          onClick={onExit}
          className="pointer-events-auto rounded-lg border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-md hover:text-white"
        >
          離開遊戲
        </button>
      </div>

      {/* bottom-left: chat */}
      <div className="absolute bottom-[4.75rem] left-2 space-y-2 sm:bottom-3 sm:left-3">
        <ChatPanel
          lines={chat}
          inputRef={chatInputRef}
          onSend={(text) => companionsRef.current?.sendChat(text)}
        />
        <ControlHints />
      </div>

      {/* bottom-centre: skills */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <SkillBar
          hud={hud}
          onCast={cast}
          onUseItem={(itemId) => withWorld((w) => w.useItem(itemId))}
        />
      </div>

      {/* bottom-right: touch-only equivalents of Tab / F / C */}
      <div className="absolute bottom-20 right-3">
        <TouchActions
          onCycleTarget={() => withWorld((w) => w.cycleTarget())}
          onInteract={interact}
          onOpenSheet={() => setSheetOpen(true)}
        />
      </div>

      <DeathOverlay hud={hud} onRespawn={() => withWorld((w) => w.respawn())} />

      <CharacterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hud={hud}
        onSpendStat={(stat: keyof Stats) => withWorld((w) => w.spendStatPoint(stat))}
        onLearnSkill={(id) => withWorld((w) => w.learnSkill(id))}
        onUseItem={(id) => withWorld((w) => w.useItem(id))}
      />

      <NpcDialog
        talk={talk}
        hud={hud}
        onClose={() => setTalk(null)}
        onAcceptQuest={(id) => {
          withWorld((w) => w.acceptQuest(id));
        }}
        onCompleteQuest={(id) => {
          withWorld((w) => w.completeQuest(id));
        }}
        onHeal={() => {
          withWorld((w) => w.fullRestore());
          setTalk(null);
        }}
        onOpenShop={() => {
          setTalk(null);
          setShopOpen(true);
        }}
      />

      <ShopDialog
        open={shopOpen}
        onOpenChange={setShopOpen}
        hud={hud}
        onBuy={(id) => withWorld((w) => w.buy(id))}
        onSell={(id) => withWorld((w) => w.sell(id))}
      />
    </div>
  );
}

/** Translates held WASD keys into a camera-relative movement vector. */
function applyKeyboardMovement(world: World, renderer: GameRenderer, keys: Set<string>) {
  const forward = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0);
  const strafe = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  if (!forward && !strafe) {
    world.setMoveInput(0, 0);
    return;
  }
  const yaw = renderer.yaw;
  // The camera sits behind the player at `yaw`, so "forward" points away from it.
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = fz;
  const rz = -fx;
  world.setMoveInput(fx * forward + rx * strafe, fz * forward + rz * strafe);
}
