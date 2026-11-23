import { BOARD_SIZE, FOREVER, SIGNS, splitFace, type FateCardId, type GameEvent, type GameState, type PlayerId } from '../../engine';
import type { MessageKey, Params } from '../../i18n';

type T = (key: MessageKey, params?: Params) => string;

export function playerName(t: T, s: GameState, id: PlayerId): string {
  return t(`player.${s.players[id]!.element}`);
}

export function signName(t: T, progress: number): string {
  return t(`sign.${SIGNS[((progress % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE]!}`);
}

function list(t: T, items: string[]): string {
  return items.join(t('list.sep'));
}

function cards(t: T, ids: readonly FateCardId[]): string {
  return list(t, ids.map((id) => t(`card.${id}`)));
}

/** A log line for an event, in the current language; null for events the log leaves out. */
export function describeEvent(t: T, s: GameState, e: GameEvent): string | null {
  const P = (id: PlayerId) => playerName(t, s, id);
  switch (e.t) {
    case 'gameStart':
      return t('log.gameStart', { laps: e.laps, order: list(t, e.order.map(P)) });
    case 'turnStart':
      return null; // shown as a heading
    case 'draw':
      return t('log.draw', { player: P(e.p), n: e.n });
    case 'reshuffle':
      return t('log.reshuffle', { n: e.n });
    case 'actionSkipped':
      return t('log.actionSkipped', { player: P(e.p) });
    case 'play': {
      if (e.kind === 'meditate') return t('log.play.meditate', { player: P(e.p) });
      if (!e.face) return null;
      const [card, side] = splitFace(e.face);
      const params: Params = {
        player: P(e.p),
        card: t(`card.${card}`),
        side: t(`side.${side}`),
        face: t(`face.${e.face}.name`),
      };
      if (e.kind === 'court') return t('log.play.court', { ...params, fuel: cards(t, e.fuel ?? []) });
      if (e.kind === 'skill' && e.target !== undefined) return t('log.play.skillTarget', { ...params, target: P(e.target) });
      if (e.kind === 'skill') return t('log.play.skill', params);
      if (e.kind === 'conjure') return t('log.play.conjure', params);
      if (e.kind === 'foresight') return t('log.play.foresight', params);
      if (e.kind === 'wheel') return t('log.play.wheel', params);
      return t('log.play.minor', params);
    }
    case 'move': {
      const n = Math.abs(e.to - e.from);
      const params = { player: P(e.p), n, from: signName(t, e.from), to: signName(t, e.to) };
      if (e.cause === 'swap') return t('log.move.swap', params);
      if (e.cause === 'wrongTurn') return t('log.move.wrongTurn', params);
      if (n === 0) return null;
      return t(e.to > e.from ? 'log.move.forward' : 'log.move.back', params);
    }
    case 'fp': {
      // Steals have their own line.
      if (e.reason === 'steal' || e.delta === 0) return null;
      const params = { player: P(e.p), n: Math.abs(e.delta), reason: t(`fpReason.${e.reason}`), lost: e.lostToCap };
      if (e.delta < 0) return t('log.fp.lose', params);
      return t(e.lostToCap > 0 ? 'log.fp.gainCapped' : 'log.fp.gain', params);
    }
    case 'discard':
      if (e.cards.length === 0) return null;
      if (e.reason === 'played' || e.reason === 'combo') return null;
      return t(`log.discard.${e.reason}`, { player: P(e.p), cards: cards(t, e.cards) });
    case 'steal':
      return t(e.what === 'fp' ? 'log.steal.fp' : 'log.steal.card', { from: P(e.from), to: P(e.to), n: e.n });
    case 'status': {
      const params = { player: P(e.p), status: t(`status.${e.kind}`), n: e.until - e.from + 1 };
      if (e.kind === 'shielded') return t('log.status.shield', params);
      if (e.kind === 'wrongTurn' || e.until >= FOREVER) return t('log.status.wrongTurn', params);
      if (e.until < e.from) return null;
      return t(e.until > e.from ? 'log.status.turns' : 'log.status.next', params);
    }
    case 'statusCleared':
      return t('log.statusCleared', { player: P(e.p) });
    case 'shieldBlock':
      return t('log.shieldBlock', { player: P(e.p) });
    case 'shieldExpire':
      return t('log.shieldExpire', { player: P(e.p) });
    case 'finishSafe':
      return t('log.finishSafe', { player: P(e.p) });
    case 'swapFailed':
      return t('log.swapFailed');
    case 'trapPlace':
      return t('log.trapPlace', { player: P(e.trap.owner), trap: t(`trap.${e.trap.kind}`), sign: signName(t, e.trap.sign) });
    case 'trapExpire':
      return t('log.trapExpire', { trap: t(`trap.${e.trap.kind}`), sign: signName(t, e.trap.sign) });
    case 'trapTrigger':
      return t(e.blocked ? 'log.trapBlocked' : 'log.trapTrigger', {
        player: P(e.p),
        trap: t(`trap.${e.trap.kind}`),
        sign: signName(t, e.trap.sign),
      });
    case 'trapIgnored':
      return t('log.trapIgnored', { player: P(e.p), trap: t(`trap.${e.trap.kind}`), sign: signName(t, e.trap.sign) });
    case 'flip':
      return t('log.flip', { player: P(e.p), card: t(`card.${s.players[e.p]!.major}`), side: t(`side.${e.orientation}`) });
    case 'roll': {
      const params = { player: P(e.p), value: e.value, dice: list(t, e.dice.map(String)) };
      if (e.mode === 'fixed') return t('log.roll.fixed', params);
      if (e.mode === 'slowed') return t('log.roll.slowed', params);
      if (e.reroll) return t('log.roll.reroll', params);
      return t(e.dice.length > 1 ? 'log.roll.advantage' : 'log.roll.normal', params);
    }
    case 'effectRoll':
      return t('log.effectRoll', { player: P(e.p), dice: list(t, e.dice.map(String)) });
    case 'boost':
      return t('log.boost', { player: P(e.p) });
    case 'moveSkipped':
      return t(`log.moveSkipped.${e.reason}`, { player: P(e.p) });
    case 'lap':
      return t('log.lap', { player: P(e.p), lap: e.lap });
    case 'finalRound':
      return t('log.finalRound', { player: P(e.p) });
    case 'reveal':
      return t('log.reveal', { player: P(e.p), card: t(`card.${e.card}`) });
    case 'look':
      // Which cards were seen stays private.
      return t('log.look', { player: P(e.p), n: e.cards.length });
    case 'take':
      return t('log.take', { player: P(e.p) });
    case 'gameOver':
      return t('log.gameOver', { winners: list(t, e.result.winners.map(P)) });
  }
}
