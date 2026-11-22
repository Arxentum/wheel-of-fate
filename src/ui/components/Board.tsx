import type { KeyboardEvent } from 'react';
import { BOARD_SIZE, SIGNS, elementOfSign } from '../../engine/data/board';
import type { Element, TrapKind } from '../../engine/types';
import { ELEMENT_COLOR, ELEMENT_ON_COLOR } from '../art/colors';
import { TRAP_PATHS, ZODIAC_PATHS } from '../art/glyphs';
import { useLang } from '../hooks/useLang';
import { BOARD, SIGN_SPAN, kitePath, piecePositions, polar, readableTurn, signAngle, wedgePath } from './boardGeometry';
import { PieceToken } from './Piece';
import styles from './Board.module.css';

export interface BoardPiece {
  /** Stable key, e.g. the player id. */
  id: string | number;
  element: Element;
  /** Sign index 0..11 (progress mod 12). */
  sign: number;
}

export interface BoardTrap {
  sign: number;
  kind: TrapKind;
  /** Element of the player who placed it (coloured border). */
  owner: Element;
}

interface BoardProps {
  pieces?: readonly BoardPiece[];
  traps?: readonly BoardTrap[];
  /** Piece to mark as the one taking its turn. */
  activeId?: string | number;
  /** Signs that can be picked (e.g. where a trap may go). */
  selectable?: readonly number[];
  onSelectSign?: (sign: number) => void;
  className?: string;
}

/** Compass star colours: the vertical points fire, horizontal air, diagonals earth and water. */
const STAR_LONG: [number, Element][] = [
  [-90, 'fire'],
  [90, 'fire'],
  [0, 'air'],
  [180, 'air'],
];
const STAR_SHORT: [number, Element][] = [
  [-45, 'earth'],
  [135, 'earth'],
  [-135, 'water'],
  [45, 'water'],
];

export function Board({ pieces = [], traps = [], activeId, selectable = [], onSelectSign, className }: BoardProps) {
  const { t, lang } = useLang();
  const half = BOARD.half;
  const bySign = new Map<number, BoardPiece[]>();
  for (const p of pieces) bySign.set(p.sign, [...(bySign.get(p.sign) ?? []), p]);

  const pick = (sign: number) => onSelectSign?.(sign);
  const onKey = (sign: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(sign);
    }
  };

  return (
    <svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      className={[styles.board, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={t('board.label')}
      data-lang={lang}
    >
      {/* Sign segments */}
      {SIGNS.map((id, sign) => {
        const element = elementOfSign(sign);
        const mid = signAngle(sign);
        // Name and glyph follow the ring; on the lower half they turn round so they never read upside down,
        // and swap places so the glyph is always above the name as you read it.
        const { turn, flipped } = readableTurn(mid);
        const [nx, ny] = polar(flipped ? BOARD.glyphR : BOARD.nameR, mid);
        const [gx, gy] = polar(flipped ? BOARD.nameR : BOARD.glyphR, mid);
        const canPick = selectable.includes(sign) && !!onSelectSign;
        const ink = ELEMENT_ON_COLOR[element];
        const label = t('board.signLabel', { sign: t(`sign.${id}`), element: t(`element.${element}`) });
        return (
          <g
            key={id}
            data-sign={sign}
            className={canPick ? `${styles.sign} ${styles.selectable}` : styles.sign}
            role={canPick ? 'button' : 'img'}
            tabIndex={canPick ? 0 : undefined}
            aria-label={label}
            onClick={canPick ? () => pick(sign) : undefined}
            onKeyDown={canPick ? onKey(sign) : undefined}
          >
            <path
              d={wedgePath(BOARD.ringInner, BOARD.ringOuter, mid - SIGN_SPAN / 2, mid + SIGN_SPAN / 2)}
              fill={ELEMENT_COLOR[element]}
              stroke="var(--bg)"
              strokeWidth={4}
            />
            <path
              d={ZODIAC_PATHS[id]}
              transform={`rotate(${turn} ${gx} ${gy}) translate(${gx - BOARD.glyphSize / 2} ${gy - BOARD.glyphSize / 2}) scale(${BOARD.glyphSize / 100})`}
              fill="none"
              stroke={ink}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={nx}
              y={ny}
              transform={`rotate(${turn} ${nx} ${ny})`}
              className={styles.signName}
              fill={ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {t(`sign.${id}`)}
            </text>
            {canPick && (
              <path
                d={wedgePath(BOARD.ringInner + 6, BOARD.ringOuter - 6, mid - SIGN_SPAN / 2 + 1.2, mid + SIGN_SPAN / 2 - 1.2)}
                className={styles.pickOutline}
              />
            )}
          </g>
        );
      })}

      {/* Track line, rim and the edge of the disc */}
      <circle r={BOARD.trackLine} fill="none" stroke="var(--bg)" strokeWidth={2} opacity={0.6} pointerEvents="none" />
      <circle r={(BOARD.ringOuter + BOARD.rim) / 2} fill="none" stroke="var(--ink)" strokeWidth={BOARD.rim - BOARD.ringOuter} />
      <circle r={BOARD.disc} fill="var(--cream)" stroke="var(--ink)" strokeWidth={4} />

      {/* Compass star */}
      <g stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round">
        {STAR_SHORT.map(([deg, el]) => (
          <path key={deg} d={kitePath(deg, 168, 30, 30)} fill={ELEMENT_COLOR[el]} />
        ))}
        {STAR_LONG.map(([deg, el]) => (
          <path key={deg} d={kitePath(deg, 228, 40, 40)} fill={ELEMENT_COLOR[el]} />
        ))}
      </g>
      <circle r={58} fill="var(--bg)" stroke="var(--ink)" strokeWidth={4} />
      <circle r={45} fill="var(--ink)" />

      {/* Start marker: an arrow along the rim over Aries, pointing the way round */}
      <StartMarker label={t('board.start')} />

      {/* Traps on the inner edge of their sign */}
      {traps.map((trap) => {
        const [x, y] = polar(BOARD.trapR, signAngle(trap.sign));
        const s = BOARD.trapSize;
        const label = t('trap.label', { trap: t(`trap.${trap.kind}`), sign: t(`sign.${SIGNS[trap.sign % BOARD_SIZE]!}`) });
        return (
          <g key={`trap-${trap.sign}`} className={styles.trap} role="img" aria-label={label} data-trap={trap.kind}>
            <rect
              x={x - s}
              y={y - s}
              width={s * 2}
              height={s * 2}
              transform={`rotate(45 ${x} ${y})`}
              fill="var(--ink)"
              stroke={ELEMENT_COLOR[trap.owner]}
              strokeWidth={5}
            />
            <path
              d={TRAP_PATHS[trap.kind]}
              transform={`translate(${x - 12} ${y - 12}) scale(0.24)`}
              fill="none"
              stroke="var(--paper)"
              strokeWidth={11}
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      {/* Pieces on the track */}
      {[...bySign.entries()].flatMap(([sign, group]) => {
        const spots = piecePositions(sign, group.length);
        return group.map((p, i) => {
          const [x, y] = spots[i]!;
          return (
            <g key={p.id} data-piece={p.element} className={styles.piece} style={{ transform: `translate(${x}px, ${y}px)` }}>
              <title>{t('piece.label', { element: t(`element.${p.element}`) })}</title>
              <PieceToken element={p.element} x={0} y={0} r={BOARD.pieceSize} active={p.id === activeId} />
            </g>
          );
        });
      })}
    </svg>
  );
}

function StartMarker({ label }: { label: string }) {
  const r = BOARD.startR;
  const a0 = signAngle(0) - 13;
  const a1 = signAngle(0) + 13;
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  // Arrow head at the clockwise end, pointing along the tangent.
  const [hx, hy] = polar(r, a1 + 2.2);
  const [bx1, by1] = polar(r - 11, a1 - 1.2);
  const [bx2, by2] = polar(r + 11, a1 - 1.2);
  return (
    <g className={styles.start} aria-hidden="true">
      <path d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} fill="none" stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
      <path d={`M${hx} ${hy} L${bx1} ${by1} L${bx2} ${by2} Z`} fill="var(--ink)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <text x={0} y={-r - 14} textAnchor="middle" className={styles.startLabel}>
        {label}
      </text>
    </g>
  );
}
