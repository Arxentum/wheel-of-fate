import {
  applyAction,
  checkAction,
  chooseBotAction,
  createGame,
  type Action,
  type Check,
  type FaceKey,
  type GameEvent,
  type GameSetup,
  type GameState,
  type PlayerId,
  type Roll,
} from '../../engine';

/**
 * Runs one game for the UI: applies actions, lets the computer players act, and plays the
 * events back one by one (pieces step along the ring, log lines appear) at a chosen speed.
 *
 * While an action plays back, the panels keep showing the state from before it (`shown`)
 * and switch to the new state when the playback ends, so numbers never jump ahead of the
 * pieces. Plain TypeScript (no React); the UI subscribes with useSyncExternalStore.
 */

export type Speed = 1 | 2 | 4;

export interface LogItem {
  id: number;
  event: GameEvent;
}

/** The card just played, shown in the middle of the board. */
export interface Spotlight {
  p: PlayerId;
  face: FaceKey;
  kind: string;
  target?: PlayerId;
}

export interface DiceView {
  p: PlayerId;
  dice: number[];
  value: number;
  mode: Roll['mode'] | 'effect';
  /** Increases with every roll, so the UI can restart its animation. */
  n: number;
}

export interface GameView {
  /** State the panels show (lags behind `latest` during playback). */
  shown: GameState;
  latest: GameState;
  /** Progress drawn on the board per player id (animated). */
  pieces: number[];
  log: LogItem[];
  busy: boolean;
  speed: Speed;
  /** Whose hand and private choices are visible. */
  viewer: PlayerId | null;
  /** A human whose decision is waiting for the device to be passed to them. */
  handoffTo: PlayerId | null;
  spotlight: Spotlight | null;
  dice: DiceView | null;
  /** The player whose piece is moving right now. */
  moving: PlayerId | null;
  /** Playback and computer turns are held (the rules are open over the game). */
  paused: boolean;
}

export interface Timing {
  think: number;
  perSpace: number;
  afterMove: number;
  roll: number;
  play: number;
  event: number;
}

/** Milliseconds at 1× speed. */
export const TIMING: Timing = { think: 450, perSpace: 150, afterMove: 120, roll: 650, play: 600, event: 140 };

export interface Scheduler {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
}

const realScheduler: Scheduler = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

interface Step {
  event: GameEvent;
  /** For move events: the spaces still to walk. */
  pos?: number;
}

export interface ControllerOptions {
  scheduler?: Scheduler;
  timing?: Timing;
  bot?: (s: GameState) => Action;
}

export class GameController {
  private view: GameView;
  private readonly listeners = new Set<() => void>();
  private readonly scheduler: Scheduler;
  private readonly timing: Timing;
  private readonly bot: (s: GameState) => Action;
  private queue: Step[] = [];
  private timer: unknown = null;
  private skipping = false;
  private logSeq = 0;
  private diceSeq = 0;
  private disposed = false;

  constructor(setup: GameSetup, seed: string, opts: ControllerOptions = {}) {
    this.scheduler = opts.scheduler ?? realScheduler;
    this.timing = opts.timing ?? TIMING;
    this.bot = opts.bot ?? ((s) => chooseBotAction(s));
    const { state, events } = createGame(setup, seed);
    const humans = state.players.filter((p) => p.controller === 'human');
    this.view = {
      shown: state,
      latest: state,
      pieces: state.players.map((p) => p.progress),
      log: [],
      busy: false,
      speed: 1,
      // With one human at the table their hand is always theirs to see.
      viewer: humans.length === 1 ? humans[0]!.id : null,
      handoffTo: null,
      spotlight: null,
      dice: null,
      moving: null,
      paused: false,
    };
    this.enqueue(events);
  }

  // ---- React glue ----

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getView = (): GameView => this.view;

  dispose(): void {
    this.disposed = true;
    if (this.timer !== null) this.scheduler.clear(this.timer);
    this.timer = null;
    this.listeners.clear();
  }

  private set(patch: Partial<GameView>): void {
    this.view = { ...this.view, ...patch };
    for (const fn of this.listeners) fn();
  }

  // ---- Commands from the UI ----

  /** Whether a human may act now (no playback, no handoff screen, a human decision pending). */
  canAct(): boolean {
    const v = this.view;
    const d = v.latest.pending;
    if (v.busy || v.handoffTo !== null || !d) return false;
    return v.latest.players[d.player]!.controller === 'human' && v.viewer === d.player;
  }

  check(a: Action): Check {
    return checkAction(this.view.latest, a);
  }

  /** A human action. Ignored when it is not the human's turn to act; throws if illegal. */
  act(a: Action): void {
    if (!this.canAct()) return;
    this.apply(a);
  }

  setSpeed(speed: Speed): void {
    this.set({ speed });
  }

  /** Holds the playback and the computer turns (e.g. while the rules are open), or lets them go on. */
  setPaused(on: boolean): void {
    if (this.view.paused === on) return;
    this.set({ paused: on });
    if (on) {
      if (this.timer !== null) this.scheduler.clear(this.timer);
      this.timer = null;
    } else {
      this.pump();
    }
  }

  /** Plays everything back at once and lets the computers act without pauses until a human decides. */
  skip(): void {
    this.skipping = true;
    if (this.timer !== null) {
      this.scheduler.clear(this.timer);
      this.timer = null;
    }
    this.pump();
  }

  /** The human the device was passed to confirms; their hand becomes visible. */
  takeOver(): void {
    const to = this.view.handoffTo;
    if (to === null) return;
    this.set({ viewer: to, handoffTo: null });
    this.pump();
  }

  // ---- Internals ----

  private humans(): PlayerId[] {
    return this.view.latest.players.filter((p) => p.controller === 'human').map((p) => p.id);
  }

  private apply(a: Action): void {
    const { state, events } = applyAction(this.view.latest, a);
    this.set({ latest: state });
    this.enqueue(events);
  }

  private enqueue(events: GameEvent[]): void {
    for (const event of events) this.queue.push({ event });
    this.set({ busy: true });
    this.pump();
  }

  private delay(ms: number): number {
    return this.skipping ? 0 : Math.round(ms / this.view.speed);
  }

  private schedule(fn: () => void, ms: number): void {
    // While paused nothing is scheduled; resuming pumps again and idle() schedules anew.
    if (this.disposed || this.view.paused) return;
    const d = this.delay(ms);
    if (d <= 0) {
      fn();
      return;
    }
    this.timer = this.scheduler.set(() => {
      this.timer = null;
      fn();
    }, d);
  }

  /** Plays the next queued event, or moves the game on when the queue is empty. */
  private pump(): void {
    if (this.disposed || this.view.paused || this.timer !== null) return;
    // Loop instead of recursing while delays are zero (skip mode).
    for (;;) {
      const step = this.queue[0];
      if (!step) break;
      const wait = this.play(step);
      if (wait === null) continue;
      const d = this.delay(wait);
      if (d > 0) {
        this.timer = this.scheduler.set(() => {
          this.timer = null;
          this.pump();
        }, d);
        return;
      }
    }
    this.idle();
  }

  /** Shows one step; returns the pause after it, or null to go straight on. */
  private play(step: Step): number | null {
    const e = step.event;
    const t = this.timing;
    if (e.t === 'move') {
      const pos = step.pos ?? e.from;
      const dir = Math.sign(e.to - pos);
      if (dir === 0) {
        this.queue.shift();
        this.set({ moving: null, log: this.appendLog(e) });
        return t.afterMove;
      }
      const next = pos + dir;
      step.pos = next;
      const pieces = [...this.view.pieces];
      pieces[e.p] = next;
      this.set({ pieces, moving: e.p });
      return t.perSpace;
    }
    this.queue.shift();
    const patch: Partial<GameView> = { log: this.appendLog(e) };
    let wait = t.event;
    switch (e.t) {
      case 'turnStart':
        patch.spotlight = null;
        patch.dice = null;
        if (this.humans().length > 1 && this.view.viewer !== e.p) patch.viewer = null;
        wait = t.event * 2;
        break;
      case 'play':
        if (e.face) patch.spotlight = { p: e.p, face: e.face, kind: e.kind, ...(e.target !== undefined ? { target: e.target } : {}) };
        wait = t.play;
        break;
      case 'roll':
        patch.dice = { p: e.p, dice: e.dice, value: e.value, mode: e.mode, n: ++this.diceSeq };
        wait = t.roll;
        break;
      case 'effectRoll':
        patch.dice = { p: e.p, dice: e.dice, value: Math.max(...e.dice), mode: 'effect', n: ++this.diceSeq };
        wait = t.roll;
        break;
      case 'gameStart':
        wait = 0;
        break;
      default:
        break;
    }
    this.set(patch);
    return wait;
  }

  private appendLog(event: GameEvent): LogItem[] {
    return [...this.view.log, { id: ++this.logSeq, event }];
  }

  /** Queue empty: show the new state and hand the decision to whoever has it. */
  private idle(): void {
    const latest = this.view.latest;
    const pieces = latest.players.map((p) => p.progress);
    const d = latest.pending;
    if (!d) {
      this.skipping = false;
      this.set({ shown: latest, pieces, busy: false, moving: null });
      return;
    }
    const decider = latest.players[d.player]!;
    if (decider.controller === 'computer') {
      this.set({ shown: latest, pieces, busy: true, moving: null });
      this.schedule(() => this.apply(this.bot(this.view.latest)), this.timing.think);
      return;
    }
    // A human decides: stop skipping, and pass the device if several humans share it.
    this.skipping = false;
    const humans = this.humans();
    if (humans.length <= 1) {
      this.set({ shown: latest, pieces, busy: false, moving: null, viewer: d.player, handoffTo: null });
      return;
    }
    if (this.view.viewer === d.player) {
      this.set({ shown: latest, pieces, busy: false, moving: null });
      return;
    }
    this.set({ shown: latest, pieces, busy: false, moving: null, viewer: null, handoffTo: d.player });
  }
}
