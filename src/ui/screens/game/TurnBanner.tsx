import type { GameState } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Piece } from '../../components/Piece';
import { playerName } from '../../game/logText';
import { useLang } from '../../hooks/useLang';
import type { Banner } from './useTableFx';
import styles from './Game.module.css';

/** A banner across the board for a moment: a new round (who goes first) or your turn. */
export function TurnBanner({ s, banner }: { s: GameState; banner: Banner }) {
  const { t } = useLang();
  const spec = banner.spec;
  const humans = s.players.filter((p) => p.controller === 'human').map((p) => p.id);
  const who = spec.kind === 'round' ? spec.first : spec.p;
  const you = humans.length === 1 && humans[0] === who;
  const name = playerName(t, s, who);
  const element = s.players[who]!.element;
  const title = spec.kind === 'round' ? t('game.round', { n: spec.round }) : t('banner.yourTurn');
  const sub =
    spec.kind === 'turn'
      ? name
      : spec.again
        ? you
          ? t('banner.youAgain')
          : t('banner.again', { player: name })
        : you
          ? t('banner.youFirst')
          : t('banner.first', { player: name });
  return (
    <div key={banner.id} className={styles.banner} role="status" aria-live="polite" style={{ ['--accent' as string]: ELEMENT_COLOR[element] }}>
      <Piece element={element} size={44} />
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}
