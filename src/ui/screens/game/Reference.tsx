import { useRef, useState } from 'react';
import type { GameState } from '../../../engine';
import { Button, Segmented } from '../../components/controls';
import { Modal } from '../../components/Modal';
import { useLang } from '../../hooks/useLang';
import { GalleryContent } from '../gallery/Gallery';
import { RulesContent } from '../rules/HowToPlay';
import styles from './Reference.module.css';

type Tab = 'rules' | 'cards';

/**
 * How to Play and the cards over a running game, with this game's numbers and player
 * count. The game is paused while it is open (the caller pauses the controller).
 */
export function Reference({ s, onClose }: { s: GameState; onClose: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('rules');
  const body = useRef<HTMLDivElement>(null);
  const show = (next: Tab) => {
    setTab(next);
    body.current?.scrollTo({ top: 0 });
  };
  return (
    <Modal onClose={onClose} label={t('game.rules')} size="full">
      <div className={styles.bar}>
        <Segmented<Tab>
          label={t('game.rules')}
          value={tab}
          onChange={show}
          options={[
            { value: 'rules', label: t('nav.rules') },
            { value: 'cards', label: t('nav.cards') },
          ]}
        />
        <span className={styles.paused}>
          <i aria-hidden="true" />
          {t('game.paused')}
        </span>
        <Button size="sm" variant="primary" onClick={onClose} autoFocus>
          {t('decide.close')}
        </Button>
      </div>
      <div className={styles.body} ref={body}>
        {tab === 'rules' ? (
          <RulesContent
            balance={s.config.balance}
            laps={s.config.laps}
            players={s.players.length}
            onOpenCards={() => show('cards')}
            scrollRoot={body}
            embedded
          />
        ) : (
          <GalleryContent balance={s.config.balance} fixedPlayers={s.players.length} embedded />
        )}
      </div>
    </Modal>
  );
}
