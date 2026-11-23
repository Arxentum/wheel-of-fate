import { useEffect, useState } from 'react';
import type { PlayerId } from '../../../engine';
import type { GameController } from '../../game/controller';
import { bannerFor, floatsFor, type BannerSpec, type FloatSpec, type TurnMark } from '../../game/tableFx';

export interface Floater {
  id: number;
  p: PlayerId;
  spec: FloatSpec;
}

export interface Banner {
  id: number;
  spec: BannerSpec;
}

const FLOAT_MS = 1700;
const BANNER_MS = 1900;

/**
 * Notes floating up from the panels and the round / your-turn banner, in step with the
 * playback. While skipping, only a banner that concerns the person at the table shows.
 */
export function useTableFx(c: GameController): { floaters: Floater[]; banner: Banner | null } {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let seq = 0;
    let prev: TurnMark | null = null;
    // The opening deal is not news: notes start with the first turn.
    let dealt = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const h = setTimeout(() => {
        timers.delete(h);
        fn();
      }, ms);
      timers.add(h);
    };

    const off = c.onShow((item) => {
      if (item.kind !== 'event') return;
      const e = item.event;
      if (e.t === 'turnStart') {
        const humans = c.getView().latest.players.filter((p) => p.controller === 'human').map((p) => p.id);
        const spec = bannerFor(e, prev, humans);
        prev = { round: e.round, player: e.p };
        dealt = true;
        const who = spec ? (spec.kind === 'round' ? spec.first : spec.p) : -1;
        const mine = humans.length === 1 && humans[0] === who;
        if (spec && (!item.fast || mine)) {
          const id = ++seq;
          setBanner({ id, spec });
          later(() => setBanner((cur) => (cur?.id === id ? null : cur)), BANNER_MS);
        }
      }
      if (item.fast || !dealt) return;
      const added = floatsFor(e).map((f) => ({ id: ++seq, ...f }));
      if (added.length === 0) return;
      const ids = new Set(added.map((f) => f.id));
      setFloaters((cur) => [...cur, ...added].slice(-12));
      later(() => setFloaters((cur) => cur.filter((f) => !ids.has(f.id))), FLOAT_MS);
    });

    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [c]);

  return { floaters, banner };
}
