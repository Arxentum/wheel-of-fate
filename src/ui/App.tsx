import { useCallback, useEffect, useRef, useState } from 'react';
import { GameController } from './game/controller';
import { Game } from './screens/game/Game';
import { AssetPreview } from './screens/AssetPreview';
import { GalleryPage } from './screens/gallery/Gallery';
import { HowToPlayPage } from './screens/rules/HowToPlay';
import { SmallScreenNotice } from './components/SmallScreenNotice';
import { Setup, toGameSetup, type SetupChoice } from './screens/Setup';

interface Running {
  controller: GameController;
  choice: SetupChoice;
  seed: string;
  n: number;
}

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

/**
 * Pages: start (setup) → game; `#/rules` How to Play, `#/cards` the Card Gallery,
 * `#/assets` the asset review page (milestone 2). A running game stays on screen; its
 * Rules button opens the rules and the cards over it.
 */
function Pages() {
  const hash = useHash();
  const [game, setGame] = useState<Running | null>(null);
  // The running controller lives outside React state updates, so it is created and disposed exactly once.
  const current = useRef<GameController | null>(null);
  const count = useRef(0);

  const start = useCallback((choice: SetupChoice) => {
    current.current?.dispose();
    const { setup, seed } = toGameSetup(choice);
    const controller = new GameController(setup, seed);
    current.current = controller;
    setGame({ controller, choice, seed, n: ++count.current });
  }, []);

  const leave = useCallback(() => {
    current.current?.dispose();
    current.current = null;
    setGame(null);
  }, []);

  if (hash === '#/assets') return <AssetPreview />;
  if (!game) {
    if (hash === '#/rules') return <HowToPlayPage />;
    if (hash === '#/cards') return <GalleryPage />;
    return <Setup onStart={start} />;
  }
  return (
    <Game
      key={game.n}
      controller={game.controller}
      seed={game.seed}
      onNewGame={leave}
      onRematch={() => start({ ...game.choice, seed: '' })}
    />
  );
}

export function App() {
  return (
    <>
      <Pages />
      <SmallScreenNotice />
    </>
  );
}
