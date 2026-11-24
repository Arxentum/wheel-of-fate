import { useEffect, useRef, type ReactNode } from 'react';
import { BOARD } from '../components/boardGeometry';
import type { FxPlan, Primitive } from './faceFx';
import { ICONS, type IconName } from './icons';

/**
 * Card effects drawn over the board: an SVG with the board's own coordinates, laid exactly
 * on top of it. Each effect animates itself (Web Animations) and is removed by its owner
 * after `fxDuration`.
 */

export type Point = [number, number];

export interface FxItem {
  id: number;
  plan: FxPlan;
  /** The player's piece. */
  from: Point;
  /** Each target's piece (or the trap's sign). */
  to: Point[];
  /** Pieces to shake when the effect lands (by data-piece, the element name). */
  hit: string[];
  /** Playback speed: effects run faster at 2× and 4×. */
  speed: number;
  /** The move's name, popping up where it lands ("Cut!"). */
  label?: string;
}

/** Heavy hits shake the whole board. */
export const SHAKES = new Set<Primitive>(['slash', 'stamp', 'bolt', 'wave', 'meteor']);

/** The board shaking for a moment. */
export const BOARD_SHAKE: Keyframe[] = [
  { transform: 'translate(0, 0)' },
  { transform: 'translate(-7px, 3px)', offset: 0.15 },
  { transform: 'translate(6px, -4px)', offset: 0.35 },
  { transform: 'translate(-4px, 2px)', offset: 0.6 },
  { transform: 'translate(2px, -1px)', offset: 0.8 },
  { transform: 'translate(0, 0)' },
];

/** When the effect lands, in milliseconds at 1× (its sound plays then). */
export const IMPACT_MS: Record<Primitive, number> = {
  aura: 150, rain: 450, burst: 120, dash: 80, leap: 350, shot: 480, drain: 520, slash: 230, stamp: 260,
  cloud: 150, wrap: 520, bolt: 120, wave: 420, beam: 260, meteor: 430, trap: 480,
};

/** How long an effect stays on screen at 1×. */
export const FX_MS = 1300;

export function fxDuration(speed: number): number {
  return FX_MS / Math.max(1, speed);
}

function Icon({ name, color, size }: { name: IconName; color: string; size: number }) {
  const k = (size * K) / 100;
  return (
    <g transform={`scale(${k}) translate(-50 -50)`}>
      {ICONS[name].map((l, i) => {
        const fill = l.fill === 'accent' ? color : l.fill === 'ink' ? 'var(--ink)' : l.fill === 'paper' ? 'var(--paper)' : (l.fill ?? 'none');
        return <path key={i} d={l.d} fill={fill} stroke="var(--ink)" strokeWidth={(l.stroke ?? 6) / Math.max(0.6, k)} strokeLinejoin="round" strokeLinecap="round" />;
      })}
    </g>
  );
}

const tr = (x: number, y: number, extra = '') => `translate(${x}px, ${y}px) ${extra}`.trim();

/** Overall size of the effects (board units are 1080 across; a piece is 42). */
const K = 2;

/** Unit vector from a point towards the board's centre: "up" for effects, so they stay on the board. */
function inward(at: Point): Point {
  const d = Math.hypot(at[0], at[1]);
  return d < 1 ? [0, -1] : [-at[0] / d, -at[1] / d];
}

/** A point `dist` from `at` towards the centre, plus `side` across. */
function up(at: Point, dist: number, side = 0): Point {
  const [ux, uy] = inward(at);
  return [at[0] + ux * dist - uy * side, at[1] + uy * dist + ux * side];
}

/** Runs keyframes on an SVG element once it is mounted. */
function useAnimate(keyframes: Keyframe[], ms: number, delay = 0, easing = 'linear') {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a = el.animate(keyframes, { duration: ms, delay, easing, fill: 'both' });
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

function Anim({ frames, ms, delay = 0, easing, children }: { frames: Keyframe[]; ms: number; delay?: number; easing?: string; children: ReactNode }) {
  const ref = useAnimate(frames, ms, delay, easing);
  return <g ref={ref}>{children}</g>;
}

/** An expanding ring. */
function Ring({ at, color, r0: a0, r1: a1, ms, delay = 0, width: w = 10 }: { at: Point; color: string; r0: number; r1: number; ms: number; delay?: number; width?: number }) {
  const r0 = a0 * K;
  const r1 = a1 * K;
  const width = w * 1.4;
  return (
    <Anim
      ms={ms}
      delay={delay}
      frames={[
        { transform: tr(at[0], at[1], `scale(${r0 / 100})`), opacity: 0.95 },
        { transform: tr(at[0], at[1], `scale(${r1 / 100})`), opacity: 0 },
      ]}
    >
      <circle r={100} fill="none" stroke={color} strokeWidth={(width * 100) / ((r0 + r1) / 2)} />
    </Anim>
  );
}

/** Short lines flying out from a point. */
function Sparks({ at, color, n = 8, len: l = 60, ms, delay = 0 }: { at: Point; color: string; n?: number; len?: number; ms: number; delay?: number }) {
  const len = l * K;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        return (
          <Anim
            key={i}
            ms={ms}
            delay={delay}
            frames={[
              { transform: tr(at[0] + dx * 30, at[1] + dy * 30), opacity: 1 },
              { transform: tr(at[0] + dx * (30 + len), at[1] + dy * (30 + len)), opacity: 0 },
            ]}
          >
            <line x1={0} y1={0} x2={dx * 30} y2={dy * 30} stroke={color} strokeWidth={11} strokeLinecap="round" />
          </Anim>
        );
      })}
    </>
  );
}

/** A small burst where something lands. */
function Impact({ at, color, ms, delay }: { at: Point; color: string; ms: number; delay: number }) {
  return (
    <>
      <Ring at={at} color={color} r0={14} r1={78} ms={ms * 0.5} delay={delay} />
      <Sparks at={at} color="var(--ink)" n={7} len={44} ms={ms * 0.45} delay={delay} />
    </>
  );
}

function mid(a: Point, b: Point, lift: number): Point {
  // A point between a and b, pushed towards the board's centre so paths curve inside the ring.
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const d = Math.hypot(mx, my) || 1;
  return [mx - (mx / d) * lift, my - (my / d) * lift];
}

/** Points along a curve from a to b through m (a quadratic Bézier). */
function curve(a: Point, m: Point, b: Point, steps = 6): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1]];
  });
}

/** An icon travelling along a curve, spinning a little. */
function Flight({ path, name, color, size, ms, delay, spin = 360 }: { path: Point[]; name: IconName; color: string; size: number; ms: number; delay: number; spin?: number }) {
  const frames = path.map(([x, y], i) => ({
    transform: tr(x, y, `rotate(${(spin * i) / (path.length - 1)}deg)`),
    opacity: i === path.length - 1 ? 0.2 : 1,
  }));
  return (
    <Anim frames={frames} ms={ms} delay={delay} easing="cubic-bezier(.4,0,.6,1)">
      <Icon name={name} color={color} size={size} />
    </Anim>
  );
}

/** The move's name in big comic letters, where the effect lands. */
function Word({ at, text, color, ms, delay }: { at: Point; text: string; color: string; ms: number; delay: number }) {
  const [x, y] = up(at, 250);
  const fill = color === '#111111' ? 'var(--paper)' : color;
  return (
    <Anim
      ms={ms}
      delay={delay}
      frames={[
        { transform: tr(x, y, 'rotate(-8deg) scale(0.2)'), opacity: 0 },
        { transform: tr(x, y, 'rotate(-6deg) scale(1.18)'), opacity: 1, offset: 0.12 },
        { transform: tr(x, y, 'rotate(-6deg) scale(1)'), opacity: 1, offset: 0.2 },
        { transform: tr(x, y - 8, 'rotate(-6deg) scale(1)'), opacity: 1, offset: 0.78 },
        { transform: tr(x, y - 24, 'rotate(-6deg) scale(0.95)'), opacity: 0 },
      ]}
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: 76, letterSpacing: 2, paintOrder: 'stroke' }}
        fill={fill}
        stroke="var(--ink)"
        strokeWidth={14}
        strokeLinejoin="round"
      >
        {text}
      </text>
    </Anim>
  );
}

function Effect({ item }: { item: FxItem }) {
  const { plan, from, to } = item;
  const T = (ms: number) => ms / Math.max(1, item.speed);
  const ms = T(FX_MS);
  const c = plan.color;
  const big = 74;
  switch (plan.fx) {
    case 'aura':
    case 'burst': {
      const at = to[0] ?? from;
      return (
        <>
          <Ring at={at} color={c} r0={20} r1={plan.fx === 'aura' ? 110 : 140} ms={ms * 0.6} />
          <Ring at={at} color={c} r0={20} r1={90} ms={ms * 0.6} delay={T(180)} width={6} />
          {plan.fx === 'burst' && <Sparks at={at} color={c} n={10} len={90} ms={ms * 0.55} />}
          <Anim
            ms={ms}
            frames={[
              { transform: tr(...up(at, 30), 'scale(0.3)'), opacity: 0 },
              { transform: tr(...up(at, 130), plan.fx === 'burst' ? 'scale(1.35)' : 'scale(1)'), opacity: 1, offset: 0.25 },
              { transform: tr(...up(at, 140), 'scale(1)'), opacity: 1, offset: 0.75 },
              { transform: tr(...up(at, 180), 'scale(0.9)'), opacity: 0 },
            ]}
          >
            <Icon name={plan.icon} color={c} size={big} />
          </Anim>
        </>
      );
    }
    case 'rain': {
      const at = to[0] ?? from;
      return (
        <>
          {Array.from({ length: 7 }, (_, i) => {
            const dx = (((i * 37) % 7) * 22 - 66) * 1.6;
            return (
              <Anim
                key={i}
                ms={ms * 0.55}
                delay={T(i * 70)}
                easing="cubic-bezier(.5,0,.8,.6)"
                frames={[
                  { transform: tr(...up(at, 330, dx), `rotate(${-30 + i * 9}deg)`), opacity: 0 },
                  { transform: tr(...up(at, 220, dx * 0.8)), opacity: 1, offset: 0.3 },
                  { transform: tr(...up(at, 20, dx * 0.25), `rotate(${10 + i * 12}deg)`), opacity: 0.1 },
                ]}
              >
                <Icon name={plan.icon} color={c} size={34} />
              </Anim>
            );
          })}
          <Ring at={at} color={c} r0={16} r1={70} ms={ms * 0.4} delay={T(IMPACT_MS.rain)} />
        </>
      );
    }
    case 'dash':
    case 'leap': {
      // Forward along the ring is clockwise: the tangent turned 90° from the radius.
      const ang = Math.atan2(from[1], from[0]);
      const fx = -Math.sin(ang);
      const fy = Math.cos(ang);
      const at = from;
      if (plan.fx === 'leap') {
        const end: Point = [at[0] + fx * 150, at[1] + fy * 150];
        const path = curve(at, mid(at, end, 300), end, 8);
        return (
          <>
            <Flight path={path} name={plan.icon} color={c} size={64} ms={ms * 0.75} delay={0} spin={-300} />
            <Ring at={end} color={c} r0={14} r1={60} ms={ms * 0.4} delay={T(IMPACT_MS.leap + 400)} />
          </>
        );
      }
      return (
        <>
          {[-46, -16, 16, 46].map((off, i) => {
            const ox = at[0] - fy * off * -1;
            const oy = at[1] + fx * off * -1;
            return (
              <Anim
                key={off}
                ms={ms * 0.5}
                delay={T(i * 50)}
                frames={[
                  { transform: tr(ox - fx * 30, oy - fy * 30), opacity: 0.95 },
                  { transform: tr(ox - fx * 200, oy - fy * 200), opacity: 0 },
                ]}
              >
                <line x1={0} y1={0} x2={-fx * 120} y2={-fy * 120} stroke={i % 2 ? 'var(--ink)' : c} strokeWidth={12} strokeLinecap="round" />
              </Anim>
            );
          })}
          <Anim
            ms={ms * 0.8}
            frames={[
              { transform: tr(...up(at, 90), 'scale(0.4)'), opacity: 0 },
              { transform: tr(...up([at[0] + fx * 50, at[1] + fy * 50], 110), 'scale(1.1)'), opacity: 1, offset: 0.25 },
              { transform: tr(...up([at[0] + fx * 210, at[1] + fy * 210], 110), 'scale(0.9)'), opacity: 0 },
            ]}
          >
            <Icon name={plan.icon} color={c} size={60} />
          </Anim>
        </>
      );
    }
    case 'shot':
    case 'drain':
    case 'trap': {
      return (
        <>
          {to.map((t, i) => {
            const [a, b] = plan.fx === 'drain' ? [t, from] : [from, t];
            const path = curve(a, mid(a, b, plan.fx === 'trap' ? 240 : 150), b, 8);
            const delay = T(i * 140);
            return (
              <g key={i}>
                <Flight path={path} name={plan.icon} color={c} size={plan.fx === 'drain' ? 46 : 58} ms={T(IMPACT_MS[plan.fx] + 60)} delay={delay} spin={plan.icon === 'wheel' ? 720 : 300} />
                <Impact at={b} color={c} ms={ms} delay={delay + T(IMPACT_MS[plan.fx])} />
              </g>
            );
          })}
        </>
      );
    }
    case 'slash': {
      return (
        <>
          {to.map((t, i) => {
            const delay = T(i * 160);
            return (
              <g key={i}>
                {/* The weapon swings round its handle, just below and left of the target. */}
                <Anim
                  ms={T(520)}
                  delay={delay}
                  easing="cubic-bezier(.6,0,.3,1)"
                  frames={[
                    { transform: tr(t[0] - 64, t[1] + 64, 'rotate(-110deg)'), opacity: 0 },
                    { transform: tr(t[0] - 64, t[1] + 64, 'rotate(-95deg)'), opacity: 1, offset: 0.2 },
                    { transform: tr(t[0] - 64, t[1] + 64, 'rotate(10deg)'), opacity: 1, offset: 0.55 },
                    { transform: tr(t[0] - 64, t[1] + 64, 'rotate(20deg)'), opacity: 0 },
                  ]}
                >
                  <g transform="translate(0 -88)">
                    <Icon name={plan.icon} color={c} size={104} />
                  </g>
                </Anim>
                <Anim
                  ms={T(420)}
                  delay={delay + T(IMPACT_MS.slash - 40)}
                  frames={[{ opacity: 0, transform: tr(t[0], t[1]) }, { opacity: 1, transform: tr(t[0], t[1]), offset: 0.2 }, { opacity: 0, transform: tr(t[0], t[1]) }]}
                >
                  <path d="M-100 -84 Q 16 -16 84 100" fill="none" stroke="var(--ink)" strokeWidth={30} strokeLinecap="round" />
                  <path d="M-100 -84 Q 16 -16 84 100" fill="none" stroke="var(--paper)" strokeWidth={20} strokeLinecap="round" />
                  <path d="M-100 -84 Q 16 -16 84 100" fill="none" stroke={c} strokeWidth={8} strokeLinecap="round" />
                </Anim>
                <Sparks at={t} color="var(--ink)" n={8} len={56} ms={T(450)} delay={delay + T(IMPACT_MS.slash)} />
              </g>
            );
          })}
        </>
      );
    }
    case 'stamp': {
      return (
        <>
          {to.map((t, i) => {
            const delay = T(i * 140);
            return (
              <g key={i}>
                <Anim
                  ms={ms * 0.9}
                  delay={delay}
                  easing="cubic-bezier(.5,0,.2,1)"
                  frames={[
                    { transform: tr(...up(t, 260), 'scale(2.2)'), opacity: 0 },
                    { transform: tr(...up(t, 56), 'scale(1)'), opacity: 1, offset: 0.22 },
                    { transform: tr(...up(t, 50), 'scale(1.05, 0.9)'), opacity: 1, offset: 0.3 },
                    { transform: tr(...up(t, 56), 'scale(1)'), opacity: 1, offset: 0.75 },
                    { transform: tr(...up(t, 66), 'scale(1)'), opacity: 0 },
                  ]}
                >
                  <Icon name={plan.icon} color={c} size={78} />
                </Anim>
                <Ring at={t} color={c} r0={20} r1={100} ms={ms * 0.45} delay={delay + T(IMPACT_MS.stamp)} width={12} />
              </g>
            );
          })}
        </>
      );
    }
    case 'cloud': {
      return (
        <>
          {to.map((t, i) => (
            <g key={i}>
              {[
                [-50, 16, 50],
                [44, 28, 56],
                [0, 76, 46],
                [-14, -22, 40],
              ].map(([dx, dy, r], k) => (
                <Anim
                  key={k}
                  ms={ms}
                  delay={T(i * 120 + k * 60)}
                  frames={[
                    { transform: tr(...up(t, dy!, dx!), 'scale(0.2)'), opacity: 0 },
                    { transform: tr(...up(t, dy! + 10, dx!), 'scale(1)'), opacity: 0.85, offset: 0.3 },
                    { transform: tr(...up(t, dy! + 70, dx! * 1.3), 'scale(1.3)'), opacity: 0 },
                  ]}
                >
                  <circle r={r!} fill={c} stroke="var(--ink)" strokeWidth={4} />
                </Anim>
              ))}
              <Anim
                ms={ms}
                delay={T(i * 120)}
                frames={[
                  { transform: tr(...up(t, 110), 'scale(0.5)'), opacity: 0 },
                  { transform: tr(...up(t, 150), 'scale(1)'), opacity: 1, offset: 0.3 },
                  { transform: tr(...up(t, 185), 'scale(1)'), opacity: 0 },
                ]}
              >
                <Icon name={plan.icon} color={c} size={52} />
              </Anim>
            </g>
          ))}
        </>
      );
    }
    case 'wrap': {
      return (
        <>
          {to.map((t, i) => (
            <g key={i}>
              {Array.from({ length: 6 }, (_, k) => {
                const a0 = (k / 6) * 360;
                const pos = (r: number, a: number): string => tr(t[0] + r * Math.cos((a * Math.PI) / 180), t[1] + r * Math.sin((a * Math.PI) / 180), `rotate(${a}deg)`);
                return (
                  <Anim
                    key={k}
                    ms={ms}
                    delay={T(i * 120)}
                    frames={[
                      { transform: pos(180, a0), opacity: 0 },
                      { transform: pos(115, a0 + 90), opacity: 1, offset: 0.35 },
                      { transform: pos(60, a0 + 200), opacity: 1, offset: 0.7 },
                      { transform: pos(50, a0 + 240), opacity: 0 },
                    ]}
                  >
                    <Icon name={plan.icon} color={c} size={34} />
                  </Anim>
                );
              })}
              <Ring at={t} color={c} r0={70} r1={26} ms={ms * 0.6} delay={T(i * 120 + 200)} width={8} />
            </g>
          ))}
        </>
      );
    }
    case 'bolt': {
      const at = to[0] ?? from;
      const pts: Point[] = [up(at, 520, 70), up(at, 380, -20), up(at, 310, 50), up(at, 160, -40), up(at, 110, 26), at];
      const d = `M${pts.map((p) => p.join(' ')).join(' L')}`;
      return (
        <>
          <Anim
            ms={T(520)}
            frames={[{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.2, offset: 0.25 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }]}
          >
            <path d={d} fill="none" stroke="var(--ink)" strokeWidth={32} strokeLinejoin="round" />
            <path d={d} fill="none" stroke={c} strokeWidth={16} strokeLinejoin="round" />
          </Anim>
          <Impact at={at} color={c} ms={ms} delay={T(IMPACT_MS.bolt)} />
          <Anim
            ms={ms}
            delay={T(200)}
            frames={[
              { transform: tr(...up(at, 110), 'scale(0.4)'), opacity: 0 },
              { transform: tr(...up(at, 135), 'scale(1.1)'), opacity: 1, offset: 0.3 },
              { transform: tr(...up(at, 160), 'scale(1)'), opacity: 0 },
            ]}
          >
            <Icon name={plan.icon} color={c} size={60} />
          </Anim>
        </>
      );
    }
    case 'wave': {
      return (
        <>
          {[0, 1, 2].map((k) => (
            <Ring key={k} at={from} color={c} r0={20} r1={300} ms={T(900)} delay={T(k * 140)} width={14} />
          ))}
          <Anim
            ms={ms}
            frames={[
              { transform: tr(...up(from, 80), 'scale(0.4)'), opacity: 0 },
              { transform: tr(...up(from, 130), 'scale(1.2)'), opacity: 1, offset: 0.2 },
              { transform: tr(...up(from, 136), 'scale(1)'), opacity: 1, offset: 0.6 },
              { transform: tr(...up(from, 146), 'scale(1)'), opacity: 0 },
            ]}
          >
            <Icon name={plan.icon} color={c} size={70} />
          </Anim>
          {to.map((t, i) => (
            <Impact key={i} at={t} color={c} ms={ms} delay={T(IMPACT_MS.wave + i * 60)} />
          ))}
        </>
      );
    }
    case 'beam': {
      return (
        <>
          <Anim
            ms={ms * 0.7}
            frames={[
              { transform: tr(...up(from, 110), 'scale(0.4)'), opacity: 0 },
              { transform: tr(...up(from, 130), 'scale(1)'), opacity: 1, offset: 0.25 },
              { transform: tr(...up(from, 130), 'scale(1)'), opacity: 0 },
            ]}
          >
            <Icon name={plan.icon} color={c} size={58} />
          </Anim>
          {to.map((t, i) => {
            const len = Math.hypot(t[0] - from[0], t[1] - from[1]);
            return (
              <g key={i}>
                <Anim
                  ms={T(700)}
                  delay={T(120 + i * 100)}
                  frames={[
                    { strokeDashoffset: len, opacity: 1 },
                    { strokeDashoffset: 0, opacity: 1, offset: 0.3 },
                    { strokeDashoffset: 0, opacity: 0.5, offset: 0.5 },
                    { strokeDashoffset: 0, opacity: 0 },
                  ]}
                >
                  <line x1={from[0]} y1={from[1]} x2={t[0]} y2={t[1]} stroke="var(--ink)" strokeWidth={36} strokeLinecap="round" strokeDasharray={len} />
                  <line x1={from[0]} y1={from[1]} x2={t[0]} y2={t[1]} stroke={c} strokeWidth={20} strokeLinecap="round" strokeDasharray={len} />
                </Anim>
                <Impact at={t} color={c} ms={ms} delay={T(IMPACT_MS.beam + i * 100)} />
              </g>
            );
          })}
        </>
      );
    }
    case 'meteor': {
      return (
        <>
          {to.map((t, i) => {
            const start: Point = up(t, 560, -260);
            const delay = T(i * 150);
            return (
              <g key={i}>
                <Anim
                  ms={T(IMPACT_MS.meteor + 40)}
                  delay={delay}
                  easing="cubic-bezier(.6,0,1,1)"
                  frames={[
                    { transform: tr(start[0], start[1], 'rotate(-30deg) scale(0.7)'), opacity: 0 },
                    { transform: tr(start[0] + (t[0] - start[0]) * 0.2, start[1] + (t[1] - start[1]) * 0.2, 'rotate(0deg) scale(1)'), opacity: 1, offset: 0.2 },
                    { transform: tr(t[0], t[1], 'rotate(140deg) scale(1)'), opacity: 1 },
                  ]}
                >
                  <line x1={0} y1={0} x2={-150} y2={-260} stroke={c} strokeWidth={16} strokeLinecap="round" opacity={0.6} />
                  <Icon name={plan.icon} color={c} size={54} />
                </Anim>
                <Ring at={t} color={c} r0={16} r1={120} ms={ms * 0.5} delay={delay + T(IMPACT_MS.meteor)} width={14} />
                <Sparks at={t} color="var(--ink)" n={9} len={70} ms={ms * 0.5} delay={delay + T(IMPACT_MS.meteor)} />
              </g>
            );
          })}
        </>
      );
    }
  }
}

/** The effects layer: put it inside the board's box, after the board. */
export function FxLayer({ items }: { items: readonly FxItem[] }) {
  const half = BOARD.half;
  return (
    <svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 2 }}
      aria-hidden="true"
    >
      {items.map((item) => (
        <g key={item.id}>
          <Effect item={item} />
          {item.label && (
            <Word
              at={item.to[0] ?? item.from}
              text={item.label}
              color={item.plan.color}
              ms={fxDuration(item.speed) * 0.95}
              delay={IMPACT_MS[item.plan.fx] / Math.max(1, item.speed)}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

/** How a hit piece reacts: a shake, or the special ones (spun round, hung upside down, squashed). */
export function pieceReaction(plan: FxPlan): Keyframe[] {
  if (plan.side === 'upright') return [{ transform: 'scale(1)' }, { transform: 'scale(1.25)', offset: 0.3 }, { transform: 'scale(1)' }];
  if (plan.icon === 'signpost') return [{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }];
  if (plan.icon === 'rope') return [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)', offset: 0.3 }, { transform: 'rotate(180deg)', offset: 0.75 }, { transform: 'rotate(360deg)' }];
  if (plan.fx === 'stamp') return [{ transform: 'scale(1)' }, { transform: 'scale(1.3, 0.6)', offset: 0.25 }, { transform: 'scale(0.9, 1.1)', offset: 0.5 }, { transform: 'scale(1)' }];
  if (plan.icon === 'snowflake' || plan.sound === 'freeze') return [{ filter: 'none' }, { filter: 'brightness(1.8) saturate(0.2)', offset: 0.2 }, { filter: 'brightness(1.8) saturate(0.2)', offset: 0.8 }, { filter: 'none' }];
  return [
    { transform: 'translate(0, 0)' },
    { transform: 'translate(-9px, 0)', offset: 0.15 },
    { transform: 'translate(9px, 0)', offset: 0.35 },
    { transform: 'translate(-6px, 0)', offset: 0.55 },
    { transform: 'translate(4px, 0)', offset: 0.75 },
    { transform: 'translate(0, 0)' },
  ];
}
