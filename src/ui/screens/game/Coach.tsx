import { useState } from 'react';
import type { GameState } from '../../../engine';
import { Button } from '../../components/controls';
import { tipFor, tips } from '../../game/tips';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

/** A first-game tip over the decision panel, for the decision in front of the player. */
export function Coach({ s, active }: { s: GameState; active: boolean }) {
  const { t } = useLang();
  const [, redraw] = useState(0);
  if (!active) return null;
  const id = tipFor(s, tips.seen);
  if (!id) return null;
  const b = s.config.balance;
  return (
    <aside className={styles.coach} role="note" aria-label={t(`tip.${id}.title`)}>
      <strong>{t(`tip.${id}.title`)}</strong>
      <p>{t(`tip.${id}`, { flip: b.flipCost, reroll: b.rerollCost, boost: b.boostCost })}</p>
      <div className={styles.coachButtons}>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            tips.done(id);
            redraw((n) => n + 1);
          }}
        >
          {t('tip.ok')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            tips.turnOff();
            redraw((n) => n + 1);
          }}
        >
          {t('tip.off')}
        </Button>
      </div>
    </aside>
  );
}
