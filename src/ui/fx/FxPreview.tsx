import { useCallback, useEffect, useRef, useState } from 'react';
import type { FaceKey, Orientation } from '../../engine';
import { sound } from '../audio/engine';
import { Board, type BoardPiece } from '../components/Board';
import { BOARD, pieceSpots, polar, signAngle } from '../components/boardGeometry';
import { FACE_FX, type FxPlan } from './faceFx';
import { BOARD_SHAKE, FxLayer, IMPACT_MS, SHAKES, fxDuration, pieceReaction, type FxItem } from './FxLayer';
import { useLang } from '../hooks/useLang';

/** Faces whose reversed side hits every player ahead (shown with two targets). */
const HITS_ALL = /^(wands|pentacles|swords|cups|page|knight|queen|king|tower|world)\.reversed$/;

/** Demo table: Fire plays, Water and Air are ahead. */
const PIECES: BoardPiece[] = [
  { id: 0, element: 'fire', sign: 1 },
  { id: 1, element: 'water', sign: 4 },
  { id: 2, element: 'air', sign: 5 },
];

/** A small board that plays one card side's effect (Card Gallery). */
export function FxPreview({ card, side, run }: { card: string; side: Orientation; run: number }) {
  const [items, setItems] = useState<FxItem[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  const play = useCallback(() => {
    const key = `${card}.${side}` as FaceKey;
    const fx = FACE_FX[key];
    const spots = pieceSpots(PIECES);
    const trap = fx.fx === 'trap';
    const targets = side === 'upright' ? [0] : HITS_ALL.test(key) ? [1, 2] : [1];
    const plan: FxPlan = { ...fx, face: key, actor: 0, targets: trap ? [] : targets, side, ...(trap ? { sign: 3 } : {}) };
    const to = trap ? [polar(BOARD.trapR, signAngle(3))] : targets.map((t) => spots.get(t)!);
    const hit = trap ? [] : targets.map((t) => PIECES[t]!.element);
    const id = Date.now();
    setItems([{ id, plan, from: spots.get(0)!, to, hit, speed: 1, label: `${t(`face.${key}.name`)}${t('fx.bang')}` }]);
    if (SHAKES.has(plan.fx)) window.setTimeout(() => box.current?.animate(BOARD_SHAKE, { duration: 380, easing: 'ease-out' }), IMPACT_MS[plan.fx]);
    sound().play([{ name: plan.sound, delay: IMPACT_MS[plan.fx] / 1000 }]);
    const frames = pieceReaction(plan);
    window.setTimeout(() => {
      for (const el of hit) box.current?.querySelector(`[data-piece="${el}"] > g`)?.animate(frames, { duration: 650, easing: 'ease-out' });
    }, IMPACT_MS[plan.fx]);
    window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), fxDuration(1) + 200);
  }, [card, side, t]);

  useEffect(() => {
    if (run > 0) play();
  }, [run, play]);

  return (
    <div ref={box} style={{ position: 'relative', width: '100%', aspectRatio: '1' }} data-fx-preview="">
      <Board pieces={PIECES} activeId={0} />
      <FxLayer items={items} />
    </div>
  );
}
