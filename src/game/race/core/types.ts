import type { GateOutcome, GateQuestion } from './gates';

/** Shared types for 陸行鳥大賽 — the 3D bird racing mode. */

export interface Vec2 {
  x: number;
  z: number;
}

/** A control point of a track centre line. `y` is elevation, `w` a width scale. */
export interface TrackPoint extends Vec2 {
  y?: number;
  w?: number;
}

export type Surface = 'road' | 'kerb' | 'rough';

export interface TrackPalette {
  road: number;
  roadEdge: number;
  ground: number;
  groundAlt: number;
  rock: number;
  foliage: number;
  foliageAlt: number;
  skyTop: number;
  skyBottom: number;
  fog: number;
  light: number;
  ambient: number;
}

export interface TrackProps {
  trees: number;
  rocks: number;
  crowd: number;
  /** Scenery silhouette used along the verges. */
  kind: 'meadow' | 'desert' | 'glacier' | 'volcano';
}

export interface TrackDef {
  id: string;
  name: string;
  subtitle: string;
  laps: number;
  /** Closed centre line. The loop is implied — do not repeat the first point. */
  points: readonly TrackPoint[];
  /** Half-width of the road in world units before per-point scaling. */
  halfWidth: number;
  /** Boost pads, as fractions of a lap in [0, 1). */
  boosts: readonly number[];
  /** Sand/ice patches that bleed speed, as fractions of a lap. */
  hazards: readonly { at: number; side: -1 | 0 | 1 }[];
  palette: TrackPalette;
  props: TrackProps;
  difficulty: 1 | 2 | 3;
}

/** One resampled point of the centre line, spaced evenly by arc length. */
export interface TrackSample {
  pos: Vec2;
  y: number;
  /** Unit tangent (direction of travel). */
  dir: Vec2;
  /** Unit normal pointing to the right of travel. */
  right: Vec2;
  /** Heading of `dir` in radians, matching actor yaw. */
  yaw: number;
  /** Signed curvature; positive turns right. */
  curvature: number;
  /** Visual banking angle in radians, derived from curvature. */
  bank: number;
  halfWidth: number;
  /** Distance from the start line along the centre line. */
  s: number;
}

export interface Track {
  def: TrackDef;
  samples: TrackSample[];
  /** Total lap length in world units. */
  length: number;
  /** Arc-length spacing between samples. */
  spacing: number;
  boosts: { s: number; halfWidth: number }[];
  hazards: { s: number; lateral: number; radius: number }[];
}

export interface BirdDef {
  id: string;
  name: string;
  title: string;
  /** Top speed in world units per second on clean road. */
  topSpeed: number;
  /** How fast the bird reaches its top speed. */
  accel: number;
  /** Peak yaw rate in radians per second. */
  handling: number;
  /** Grip resists sliding; low grip drifts wider but charges boost faster. */
  grip: number;
  /** Sprint fuel. */
  stamina: number;
  body: number;
  accent: number;
  beak: number;
  blurb: string;
}

export interface RacerInput {
  /** 0…1 forward. */
  throttle: number;
  /** 0…1 braking. */
  brake: number;
  /** -1 left … 1 right. */
  steer: number;
  sprint: boolean;
  drift: boolean;
}

/** Who drives a racer: the human at this keyboard, the AI, or the network. */
export type RacerControl = 'player' | 'ai' | 'remote';

/** The last state a networked racer sent, dead-reckoned between packets. */
export interface RemoteState {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  lap: number;
  progress: number;
  /** Local clock when this packet arrived, for staleness checks. */
  at: number;
}

export interface Racer {
  id: string;
  name: string;
  birdId: string;
  isPlayer: boolean;
  control: RacerControl;
  /** Present only while `control === 'remote'`. */
  remote?: RemoteState;
  pos: Vec2;
  y: number;
  /** Facing, radians, 0 = +Z. */
  yaw: number;
  /** Direction actually travelled; lags `yaw` while drifting. */
  moveYaw: number;
  speed: number;
  stamina: number;
  /** Seconds of boost left. */
  boost: number;
  drifting: boolean;
  driftDir: -1 | 0 | 1;
  driftCharge: number;
  offTrack: boolean;
  /** Slip angle in radians, for dust and lean. */
  slip: number;
  /** Nearest centre-line sample; kept as a search hint between frames. */
  sample: number;
  /** Arc length along the current lap. */
  s: number;
  /** Signed distance from the centre line, positive to the right. */
  lateral: number;
  /** Half-width of the road at the racer's current position. */
  halfWidth: number;
  lap: number;
  /** Set once past the halfway checkpoint; gates the next lap count. */
  lapArmed: boolean;
  /** Monotonic distance raced from the grid; the sort key for standings. */
  progress: number;
  place: number;
  finished: boolean;
  finishTime: number;
  lapTimes: number[];
  lapStart: number;
  input: RacerInput;
  /** AI only — how close this rider gets to a perfect lap. */
  skill: number;
  /** AI only — per-racer noise offset so the pack does not drive as one. */
  phase: number;
  bumpCooldown: number;
  /** Language-gate tally for this race. */
  gates: { correct: number; wrong: number; missed: number };
}

export type RacePhase = 'countdown' | 'running' | 'finished';

export interface RaceEvent {
  kind: 'lap' | 'boost' | 'finish' | 'go' | 'count' | 'offtrack' | 'drift' | 'gate';
  racerId: string;
  text?: string;
  value?: number;
}

export interface StandingRow {
  id: string;
  name: string;
  birdId: string;
  isPlayer: boolean;
  place: number;
  lap: number;
  finished: boolean;
  /** Gap to the leader in world units, or race time once finished. */
  gap: number;
  finishTime: number;
}

export interface RaceSnapshot {
  phase: RacePhase;
  countdown: number;
  time: number;
  laps: number;
  player: {
    place: number;
    lap: number;
    speed: number;
    stamina: number;
    maxStamina: number;
    boost: number;
    driftCharge: number;
    offTrack: boolean;
    lapTime: number;
    bestLap: number;
    finished: boolean;
    finishTime: number;
  };
  /** Present only when the race carries language gates. */
  language?: {
    correct: number;
    wrong: number;
    missed: number;
    total: number;
    /** 0–1 over the gates answered so far. */
    accuracy: number;
    /** The gate being approached, once it is close enough to read. */
    upcoming?: { gateIndex: number; distance: number; question: GateQuestion };
    /** The most recent result, for the flash on the HUD. */
    last?: { outcome: GateOutcome; question: GateQuestion; at: number };
  };
  standings: StandingRow[];
  /** Minimap dots in track space. */
  blips: { id: string; x: number; z: number; isPlayer: boolean; color: number }[];
  fps: number;
}
