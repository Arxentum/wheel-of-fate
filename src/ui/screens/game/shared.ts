import { useSyncExternalStore } from 'react';
import type { Action, CardId, CardUid, GameState, PlayerId } from '../../../engine';
import type { GameController, GameView } from '../../game/controller';
import type { MessageKey, Params } from '../../../i18n';

export type T = (key: MessageKey, params?: Params) => string;

/** Local UI state of the game screen: what the human is in the middle of choosing. */
export type UiMode =
  | { kind: 'idle' }
  /** A hand card opened to choose its side (and fuel or target). */
  | { kind: 'inspect'; card: CardUid }
  /** A card shown full size, read only (characters). */
  | { kind: 'view'; id: CardId; turned: boolean; owner?: PlayerId }
  /** The skill was picked; a target, sign or discard may still be needed. */
  | { kind: 'skill' }
  /** Several actions differ only by target: pick the player. */
  | { kind: 'target'; actions: Action[] };

export function useGameView(c: GameController): GameView {
  return useSyncExternalStore(c.subscribe, c.getView);
}

/** Whether a player label should say "You" (one human at the table) or name the seat. */
export function humansOf(s: GameState): PlayerId[] {
  return s.players.filter((p) => p.controller === 'human').map((p) => p.id);
}

export function tagFor(t: T, s: GameState, id: PlayerId): string {
  const p = s.players[id]!;
  if (p.controller === 'ai') return t('tag.ai');
  return humansOf(s).length === 1 ? t('tag.you') : t('tag.human');
}

/** Target of an action, if any. */
export function targetOf(a: Action): PlayerId | undefined {
  if (a.type === 'playMinor' || a.type === 'playCourt') return a.target;
  if (a.type === 'useSkill') return a.choice?.target;
  if (a.type === 'conjurePlay') return a.play?.target;
  return undefined;
}
