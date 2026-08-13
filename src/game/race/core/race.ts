import { Rng } from '../../core/rng';
import { BIRD_IDS, RIVAL_NAMES, birdDef } from '../data/birds';
import { trackDef } from '../data/tracks';
import { driveRacer } from './ai';
import { neutralInput, resolveContact, stepRacer } from './physics';
import { buildTrack, gridSlot, isHazardAt, project, wrapAngle, wrapDistance } from './track';
import type {
  RaceEvent,
  RacePhase,
  RaceSnapshot,
  Racer,
  StandingRow,
  Surface,
  Track,
} from './types';

export interface RaceConfig {
  trackId: string;
  birdId: string;
  riderName: string;
  /** Rivals on the grid, 0–7. */
  rivals: number;
  /** 0 = casual, 1 = normal, 2 = pro. Scales AI skill. */
  difficulty: number;
  seed?: number;
}

const COUNTDOWN = 3.6;
/** Boost pads are worth this many seconds of boost. */
const PAD_BOOST = 1.15;
const PAD_STAMINA = 18;

export class RaceSim {
  readonly track: Track;
  readonly racers: Racer[] = [];
  readonly laps: number;
  phase: RacePhase = 'countdown';
  countdown = COUNTDOWN;
  time = 0;

  private rng: Rng;
  private events: RaceEvent[] = [];
  private difficulty: number;
  private lastCount = 4;
  /** Boost pads already consumed this lap, keyed `racerId:padIndex`. */
  private padHits = new Set<string>();

  constructor(config: RaceConfig) {
    const def = trackDef(config.trackId);
    this.track = buildTrack(def);
    this.laps = def.laps;
    this.difficulty = config.difficulty;
    this.rng = new Rng(config.seed ?? 20260813);

    const rivals = Math.max(0, Math.min(7, config.rivals));
    const pool = BIRD_IDS.filter((id) => id !== config.birdId);
    const entries: { name: string; birdId: string; isPlayer: boolean }[] = [
      { name: config.riderName || '你', birdId: config.birdId, isPlayer: true },
    ];
    for (let i = 0; i < rivals; i += 1) {
      entries.push({
        name: RIVAL_NAMES[i % RIVAL_NAMES.length],
        birdId: pool[i % pool.length],
        isPlayer: false,
      });
    }

    // The player starts at the back so there is always a race to run.
    const order = [...entries.slice(1), entries[0]];
    order.forEach((entry, index) => {
      const slot = gridSlot(this.track, index);
      const bird = birdDef(entry.birdId);
      const projection = project(this.track, slot.pos.x, slot.pos.z, -1);
      this.racers.push({
        id: entry.isPlayer ? 'player' : `ai${index}`,
        name: entry.name,
        birdId: entry.birdId,
        isPlayer: entry.isPlayer,
        pos: { ...slot.pos },
        y: slot.y,
        yaw: slot.yaw,
        moveYaw: slot.yaw,
        speed: 0,
        stamina: bird.stamina,
        boost: 0,
        drifting: false,
        driftDir: 0,
        driftCharge: 0,
        offTrack: false,
        slip: 0,
        sample: projection.index,
        s: projection.s,
        lateral: projection.lateral,
        halfWidth: projection.halfWidth,
        lap: 0,
        lapArmed: false,
        // Negative until the start line is crossed: the grid is behind it.
        progress: projection.s - this.track.length,
        place: index + 1,
        finished: false,
        finishTime: 0,
        lapTimes: [],
        lapStart: 0,
        input: neutralInput(),
        // Casual rivals leave real room; pro rivals sprint and drift-boost.
        skill: 0.62 + this.difficulty * 0.14 + this.rng.range(-0.03, 0.05),
        phase: this.rng.range(0, Math.PI * 2),
        bumpCooldown: 0,
      });
    });
  }

  get player(): Racer {
    return this.racers.find((r) => r.isPlayer) ?? this.racers[0];
  }

  drainEvents(): RaceEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** Feeds the human racer's controls; ignored once they have finished. */
  setPlayerInput(input: Partial<Racer['input']>): void {
    const player = this.player;
    if (player.finished || this.phase === 'countdown') {
      // Still record steering so the bird points somewhere sane on lights out.
      player.input = { ...player.input, ...input, throttle: 0, sprint: false };
      return;
    }
    player.input = { ...player.input, ...input };
  }

  tick(dt: number): void {
    if (this.phase === 'finished') return;

    if (this.phase === 'countdown') {
      this.countdown -= dt;
      const shown = Math.ceil(this.countdown);
      if (shown < this.lastCount) {
        this.lastCount = shown;
        if (shown > 0) this.events.push({ kind: 'count', racerId: 'player', value: shown });
      }
      if (this.countdown <= 0) {
        this.phase = 'running';
        this.countdown = 0;
        this.events.push({ kind: 'go', racerId: 'player' });
      } else {
        // Birds fidget on the grid but do not move.
        for (const racer of this.racers) racer.input.throttle = 0;
        return;
      }
    }

    this.time += dt;

    for (const racer of this.racers) {
      if (racer.finished) {
        // Coast to a stop past the line instead of freezing mid-stride.
        racer.input = { ...neutralInput(), steer: racer.input.steer * 0.5 };
        stepRacer(racer, dt, 'road');
        this.updateTrackState(racer, dt);
        continue;
      }
      if (!racer.isPlayer) this.driveAi(racer);
      const surface = this.surfaceFor(racer);
      stepRacer(racer, dt, surface, (seconds) => {
        this.events.push({ kind: 'drift', racerId: racer.id, value: seconds });
      });
      this.updateTrackState(racer, dt);
    }

    for (let i = 0; i < this.racers.length; i += 1) {
      for (let j = i + 1; j < this.racers.length; j += 1) {
        resolveContact(this.racers[i], this.racers[j]);
      }
    }

    this.updateStandings();

    if (this.racers.every((r) => r.finished)) this.phase = 'finished';
  }

  // ── track interaction ────────────────────────────────────────────────────

  private surfaceFor(racer: Racer): Surface {
    const edge = Math.abs(racer.lateral) - racer.halfWidth;
    if (edge > 0.4) return 'rough';
    if (edge > -1.1) return 'kerb';
    return 'road';
  }

  /** Re-projects a racer onto the track and handles laps, pads and walls. */
  private updateTrackState(racer: Racer, dt: number): void {
    const before = racer.s;
    const projection = project(this.track, racer.pos.x, racer.pos.z, racer.sample);
    racer.sample = projection.index;
    racer.s = projection.s;
    racer.lateral = projection.lateral;
    racer.y = projection.y;
    racer.halfWidth = projection.halfWidth;

    const wasOff = racer.offTrack;
    racer.offTrack = Math.abs(racer.lateral) > projection.halfWidth + 0.4;
    if (racer.offTrack && !wasOff && racer.isPlayer) {
      this.events.push({ kind: 'offtrack', racerId: racer.id });
    }

    // Soft wall: beyond the verge the racer is pushed back and scrubbed off.
    const limit = projection.halfWidth + 6.5;
    if (Math.abs(racer.lateral) > limit) {
      const sign = Math.sign(racer.lateral);
      const sample = this.track.samples[projection.index];
      const excess = Math.abs(racer.lateral) - limit;
      racer.pos.x -= sample.right.x * sign * excess;
      racer.pos.z -= sample.right.z * sign * excess;
      racer.lateral = sign * limit;
      racer.speed *= 0.92;
      // Steer the nose back towards the road so a wall is not a dead end.
      racer.yaw = wrapAngle(racer.yaw - sign * 1.6 * dt);
    }

    // Monotonic distance raced, so standings stay right even when a racer
    // spins, reverses, or sits on the line.
    const delta = wrapDistance(racer.s, before, this.track.length);
    if (Math.abs(delta) < this.track.length * 0.25) racer.progress += delta;

    if (!racer.finished) {
      this.checkPads(racer);
      if (isHazardAt(this.track, racer.s, racer.lateral)) racer.speed *= 1 - 0.55 * dt;
      this.checkLap(racer, before, delta);
    }
  }

  private checkPads(racer: Racer): void {
    this.track.boosts.forEach((pad, index) => {
      const key = `${racer.id}:${index}:${racer.lap}`;
      if (this.padHits.has(key)) return;
      if (Math.abs(wrapDistance(racer.s, pad.s, this.track.length)) > 2.2) return;
      if (Math.abs(racer.lateral) > pad.halfWidth) return;
      this.padHits.add(key);
      racer.boost = Math.max(racer.boost, PAD_BOOST);
      racer.stamina = Math.min(birdDef(racer.birdId).stamina, racer.stamina + PAD_STAMINA);
      this.events.push({ kind: 'boost', racerId: racer.id });
    });
  }

  /**
   * Counts a lap only when the start line is crossed forwards *and* the racer
   * has been round the far side of the circuit since the last one. That single
   * checkpoint covers both edge cases: the grid sits behind the line, so the
   * opening crossing must not score, and a racer who reverses over the line
   * cannot farm laps by driving back and forth across it.
   */
  private checkLap(racer: Racer, before: number, delta: number): void {
    const length = this.track.length;
    if (racer.s > length * 0.4 && racer.s < length * 0.7) racer.lapArmed = true;

    // Ignore projection jitter and any wrap caused by driving backwards.
    if (delta <= 0) return;
    const crossed = before + delta >= length;
    if (!crossed) return;

    if (!racer.lapArmed) {
      // This is the race start, not a lap: the clock for lap 1 begins here.
      racer.lapStart = this.time;
      return;
    }
    racer.lapArmed = false;
    racer.lap += 1;
    racer.lapTimes.push(this.time - racer.lapStart);
    racer.lapStart = this.time;
    if (racer.lap >= this.laps) {
      racer.finished = true;
      racer.finishTime = this.time;
      this.events.push({ kind: 'finish', racerId: racer.id });
    } else {
      this.events.push({ kind: 'lap', racerId: racer.id, value: racer.lap + 1 });
    }
  }

  private updateStandings(): void {
    const order = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
    order.forEach((racer, index) => {
      racer.place = index + 1;
    });
  }

  // ── AI ───────────────────────────────────────────────────────────────────

  private driveAi(racer: Racer): void {
    const leader = this.player.finished ? undefined : this.player.progress;
    driveRacer(this.track, racer, { time: this.time, difficulty: this.difficulty, chase: leader });
  }

  // ── snapshot ─────────────────────────────────────────────────────────────

  standings(): StandingRow[] {
    const leader = this.racers.reduce((best, r) => (r.progress > best.progress ? r : best), this.racers[0]);
    return [...this.racers]
      .sort((a, b) => a.place - b.place)
      .map((racer) => ({
        id: racer.id,
        name: racer.name,
        birdId: racer.birdId,
        isPlayer: racer.isPlayer,
        place: racer.place,
        lap: Math.min(this.laps, racer.lap + 1),
        finished: racer.finished,
        gap: Math.max(0, leader.progress - racer.progress),
        finishTime: racer.finishTime,
      }));
  }

  snapshot(fps = 60): RaceSnapshot {
    const player = this.player;
    const bird = birdDef(player.birdId);
    const best = player.lapTimes.length ? Math.min(...player.lapTimes) : 0;
    return {
      phase: this.phase,
      countdown: this.countdown,
      time: this.time,
      laps: this.laps,
      player: {
        place: player.place,
        lap: Math.min(this.laps, player.lap + 1),
        speed: player.speed,
        stamina: player.stamina,
        maxStamina: bird.stamina,
        boost: player.boost,
        driftCharge: player.driftCharge,
        offTrack: player.offTrack,
        lapTime: player.finished ? (player.lapTimes.at(-1) ?? 0) : this.time - player.lapStart,
        bestLap: best,
        finished: player.finished,
        finishTime: player.finishTime,
      },
      standings: this.standings(),
      blips: this.racers.map((racer) => ({
        id: racer.id,
        x: racer.pos.x,
        z: racer.pos.z,
        isPlayer: racer.isPlayer,
        color: birdDef(racer.birdId).body,
      })),
      fps,
    };
  }
}
