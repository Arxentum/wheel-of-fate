// Aggregated statistics of many simulated games (definitions: decisions D-39 – D-42).
import {
  COURTS, MAJORS, SUITS, cardDef, hasFuel, isActive, splitFace, ORIENTATIONS,
  type Action, type Element, type FaceKey, type FateCardId, type GameEvent, type GameState, type MajorId,
} from '../engine';

export interface WinCounter {
  games: number;
  wins: number;
}

export interface UR {
  upright: number;
  reversed: number;
}

const ur = (): UR => ({ upright: 0, reversed: 0 });
const wc = (): WinCounter => ({ games: 0, wins: 0 });

export class Stats {
  games = 0;
  rounds: number[] = [];
  turns = 0;
  playerGames = 0;
  byMajor = new Map<MajorId, WinCounter>(MAJORS.map((m) => [m, wc()]));
  /** Win counters by position in the turn order. */
  bySeat: WinCounter[] = [wc(), wc(), wc(), wc()];
  byElement = new Map<Element, WinCounter>((['fire', 'earth', 'air', 'water'] as Element[]).map((e) => [e, wc()]));
  /** Orientation of the main actions (D-41). */
  orient = { minor: ur(), court: ur(), skill: ur() };
  skillByMajor = new Map<MajorId, UR>(MAJORS.map((m) => [m, ur()]));
  /** Holder-games of each major, to turn uses into uses per game. */
  majorGames = new Map<MajorId, number>(MAJORS.map((m) => [m, 0]));
  actions = { minor: 0, court: 0, skill: 0, meditate: 0, skipped: 0 };
  faceUse = new Map<FaceKey, number>();
  extraPlays = { conjure: 0, foresight: 0, wheel: 0 };
  /** Minor cards spent as court combo fuel, by suit. */
  fuelUse = new Map<FateCardId, number>(SUITS.map((d) => [d, 0]));
  playable = new Map<FateCardId, { avail: number; played: number }>(
    [...SUITS, ...COURTS].map((d) => [d, { avail: 0, played: 0 }]),
  );
  fpCapEvents = 0;
  fpLostToCap = 0;
  turnsWithCap = 0;
  traps = { placed: 0, triggered: 0, blocked: 0, ignored: 0, replaced: 0, leftAtEnd: 0 };
  flips = 0;
  shieldBlocks = 0;
  finalFpSum = 0;
  marginSum = 0;
  laps: number[] = [];

  private capThisTurn = false;

  beginGame(s: GameState): void {
    for (const p of s.players) this.majorGames.set(p.major, this.majorGames.get(p.major)! + 1);
  }

  /** Before the AI answers a Play-step decision: which card types could be played. */
  beforeDecision(s: GameState): void {
    const d = s.pending;
    if (!d || d.kind !== 'chooseAction') return;
    const p = s.players[d.player]!;
    if (isActive(p, 'silenced')) return;
    const seen = new Set<FateCardId>();
    for (const u of p.hand) {
      const def = cardDef(u);
      if (seen.has(def)) continue;
      if ((COURTS as readonly string[]).includes(def) && !ORIENTATIONS.some((o) => hasFuel(p, u, def as never, o))) continue;
      seen.add(def);
      this.playable.get(def)!.avail++;
    }
  }

  afterDecision(s: GameState, a: Action): void {
    if (a.type === 'playMinor' || a.type === 'playCourt') this.playable.get(cardDef(a.card))!.played++;
    void s;
  }

  event(e: GameEvent): void {
    switch (e.t) {
      case 'turnStart':
        this.turns++;
        this.capThisTurn = false;
        break;
      case 'actionSkipped':
        this.actions.skipped++;
        break;
      case 'play': {
        if (e.kind === 'meditate') {
          this.actions.meditate++;
          break;
        }
        const face = e.face!;
        this.faceUse.set(face, (this.faceUse.get(face) ?? 0) + 1);
        const [, o] = splitFace(face);
        if (e.kind === 'minor' || e.kind === 'court' || e.kind === 'skill') {
          this.actions[e.kind]++;
          this.orient[e.kind][o]++;
        }
        if (e.kind === 'skill') {
          const [id] = splitFace(face);
          this.skillByMajor.get(id as MajorId)![o]++;
        }
        if (e.kind === 'conjure' || e.kind === 'foresight' || e.kind === 'wheel') this.extraPlays[e.kind]++;
        for (const f of e.fuel ?? []) this.fuelUse.set(f, (this.fuelUse.get(f) ?? 0) + 1);
        break;
      }
      case 'fp':
        if (e.lostToCap > 0) {
          this.fpCapEvents++;
          this.fpLostToCap += e.lostToCap;
          if (!this.capThisTurn) {
            this.turnsWithCap++;
            this.capThisTurn = true;
          }
        }
        break;
      case 'trapPlace':
        this.traps.placed++;
        break;
      case 'trapTrigger':
        this.traps.triggered++;
        if (e.blocked) this.traps.blocked++;
        break;
      case 'trapIgnored':
        this.traps.ignored++;
        break;
      case 'trapExpire':
        this.traps.replaced++;
        break;
      case 'flip':
        this.flips++;
        break;
      case 'shieldBlock':
        this.shieldBlocks++;
        break;
      default:
        break;
    }
  }

  endGame(s: GameState): void {
    const r = s.result!;
    this.games++;
    this.rounds.push(r.rounds);
    this.laps.push(s.config.laps);
    this.playerGames += s.players.length;
    this.traps.leftAtEnd += s.traps.length;
    const share = 1 / r.winners.length;
    s.order.forEach((id, seat) => {
      const p = s.players[id]!;
      const win = r.winners.includes(id) ? share : 0;
      const m = this.byMajor.get(p.major)!;
      m.games++;
      m.wins += win;
      this.bySeat[seat]!.games++;
      this.bySeat[seat]!.wins += win;
      const e = this.byElement.get(p.element)!;
      e.games++;
      e.wins += win;
      this.finalFpSum += p.fp;
    });
    const sorted = s.players.map((p) => p.progress).sort((a, b) => b - a);
    this.marginSum += sorted[0]! - sorted[1]!;
  }

  // ---------- Derived numbers ----------

  meanRounds(): number {
    return this.rounds.reduce((a, b) => a + b, 0) / Math.max(1, this.rounds.length);
  }

  percentile(q: number): number {
    const s = [...this.rounds].sort((a, b) => a - b);
    if (s.length === 0) return 0;
    return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
  }

  share(c: UR): number {
    const t = c.upright + c.reversed;
    return t === 0 ? NaN : c.upright / t;
  }
}
