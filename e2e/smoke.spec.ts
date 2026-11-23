/**
 * Smoke tests of the built site, in English and Traditional Chinese: an all-computer game
 * to the end, a human playing turns, the hot seat, and the two reference pages. Each test
 * fails on any console error. Screenshots for the report go to docs/m5/screenshots/.
 * Run: npm run e2e
 */
import { expect, test } from '@playwright/test';
import { LANGS } from '../src/i18n/format';
import { openApp, pattern, ready, roundNumber, shot, startGame, tr, turnButtons, watchErrors } from './helpers';

for (const lang of LANGS) {
  const t = tr(lang);
  const tag = lang === 'en' ? 'en' : 'zh';

  test.describe(lang, () => {
    test('an all-computer game plays to the end', async ({ page }) => {
      const errors = watchErrors(page);
      await openApp(page, { lang, seats: { fire: 'ai', earth: 'ai', air: 'ai', water: 'ai' } });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('app.title'));
      await shot(page, `${tag}-01-start`);

      await startGame(page, t, 'smoke-computers');
      await page.getByRole('radio', { name: '4×' }).click();
      await page.waitForTimeout(5000);
      expect(await roundNumber(page, t)).toBeGreaterThanOrEqual(1);
      await shot(page, `${tag}-02-computers-playing`);

      await page.getByRole('button', { name: t('game.skip') }).click();
      const dialog = page.getByRole('dialog', { name: t('over.title') });
      await expect(dialog).toBeVisible({ timeout: 60_000 });
      await expect(dialog.getByText(pattern(t, 'over.winner')).or(dialog.getByText(pattern(t, 'over.winners')))).toBeVisible();
      await shot(page, `${tag}-03-game-over`);

      await dialog.getByRole('button', { name: t('over.board') }).click();
      await expect(dialog).toBeHidden();
      await shot(page, `${tag}-04-final-board`);
      expect(errors).toEqual([]);
    });

    test('a human plays turns against the computer', async ({ page }) => {
      const errors = watchErrors(page);
      await openApp(page, { lang, seats: { fire: 'human', earth: 'ai', air: 'ai', water: 'off' }, query: '?character=chariot.upright' });
      await startGame(page, t, 'smoke-human');
      await page.getByRole('radio', { name: '4×' }).click();
      const b = turnButtons(page, t);
      await expect(b.meditate).toBeVisible({ timeout: 20_000 });
      await shot(page, `${tag}-05-your-turn`);

      // First turn: open a card from the hand and play it upright if it can be.
      const hand = page.getByRole('region', { name: t('game.hand') });
      await hand.getByRole('button').first().click();
      const inspector = page.getByRole('dialog');
      await expect(inspector).toBeVisible();
      await shot(page, `${tag}-06-card-preview`);
      const playUp = inspector.getByRole('button', { name: t('decide.playSide', { side: t('side.upright') }) }).first();
      if (await ready(playUp)) await playUp.click();
      else await page.keyboard.press('Escape');

      // Then answer every decision until round 4: the skill when it is ready, else meditate.
      let usedSkill = false;
      for (let guard = 0; guard < 600 && (await roundNumber(page, t)) < 4; guard++) {
        if (await ready(b.useSkill)) {
          await b.useSkill.click();
          usedSkill = true;
        } else if (await ready(b.meditate)) await b.meditate.click();
        else if (await ready(b.keep)) await b.keep.click();
        else if (await ready(b.move)) await b.move.click();
        else if (await b.discard.isVisible()) {
          // Discard down to the limit: select cards until the button can be pressed.
          for (const card of await hand.getByRole('button').all()) {
            if (await b.discard.isEnabled()) break;
            await card.click();
          }
          await b.discard.click();
        } else await page.waitForTimeout(250);
      }
      expect(await roundNumber(page, t)).toBeGreaterThanOrEqual(4);
      expect(usedSkill).toBe(true);
      await shot(page, `${tag}-07-round-4`);
      expect(errors).toEqual([]);
    });

    test('two people share one device', async ({ page }) => {
      const errors = watchErrors(page);
      await openApp(page, { lang, seats: { fire: 'human', earth: 'human', air: 'off', water: 'off' } });
      await startGame(page, t, 'smoke-hotseat');
      const b = turnButtons(page, t);
      await expect(page.getByRole('heading', { name: t('handoff.title', { player: t('player.fire') }) })).toBeVisible();
      await b.handoff.click();
      await b.meditate.click();
      await b.keep.click();
      await b.move.click();
      // Earth's turn: the device is passed and Fire's hand is covered.
      await expect(page.getByRole('heading', { name: t('handoff.title', { player: t('player.earth') }) })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(t('game.handHidden'))).toBeVisible();
      await shot(page, `${tag}-08-hot-seat`);
      await b.handoff.click();
      await expect(page.getByText(t('game.yourHand', { player: t('player.earth') }))).toBeVisible();
      await expect(b.meditate).toBeVisible();
      expect(errors).toEqual([]);
    });

    test('How to Play, the Card Gallery and the rules during a game', async ({ page }) => {
      const errors = watchErrors(page);
      await openApp(page, { lang, hash: '#/rules', seats: { fire: 'human', earth: 'ai', air: 'off', water: 'off' } });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('rules.title'));
      await shot(page, `${tag}-09-how-to-play`);
      await page.getByRole('navigation', { name: t('rules.toc') }).getByRole('button', { name: t('rules.trap.title') }).click();
      await expect(page.getByRole('heading', { name: t('trap.chain') })).toBeInViewport();

      await page.getByRole('navigation', { name: t('nav.label') }).getByRole('link', { name: t('nav.cards') }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('gallery.title'));
      await expect(page.locator('button[data-card]')).toHaveCount(30);
      await shot(page, `${tag}-10-cards`);
      await page.locator('button[data-card="moon"]').click();
      await expect(page.getByRole('dialog', { name: t('card.moon') })).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('dialog', { name: t('card.sun') })).toBeVisible();
      await shot(page, `${tag}-11-card-detail`);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);

      // The other language from the switch, then back.
      const other = lang === 'en' ? 'zh-Hant' : 'en';
      await page.getByRole('button', { name: tr(other)(`lang.${other}`) }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(tr(other)('gallery.title'));
      await page.getByRole('button', { name: t(`lang.${lang}`) }).click();

      // The rules over a running game pause it.
      await page.getByRole('navigation', { name: t('nav.label') }).getByRole('link').first().click();
      await startGame(page, t, 'smoke-rules');
      await expect(turnButtons(page, t).meditate).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: t('game.rules'), exact: true }).click();
      await expect(page.getByText(t('game.paused'))).toBeVisible();
      await page.getByRole('radio', { name: t('nav.cards') }).click();
      await expect(page.locator('button[data-card]')).toHaveCount(30);
      await page.keyboard.press('Escape');
      await expect(page.getByText(t('game.paused'))).toBeHidden();
      expect(errors).toEqual([]);
    });
  });
}

test.describe('touch screens', () => {
  const t = tr('en');

  test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true });

  test('on a tablet a tap previews the reversed side and shows the whole skill text', async ({ page }) => {
    const errors = watchErrors(page);
    await openApp(page, { lang: 'en', seats: { fire: 'human', earth: 'ai', air: 'off', water: 'off' }, query: '?character=highPriestess.upright' });
    await startGame(page, t, 'smoke-touch');
    await expect(turnButtons(page, t).meditate).toBeVisible({ timeout: 20_000 });

    // The skill text is cut to a few lines; a tap shows all of it.
    const skillText = page.getByRole('button', { name: /^Move forward 1 space\. Look at the top 3 cards/ });
    await expect(skillText).toHaveAttribute('aria-expanded', 'false');
    await skillText.tap();
    await expect(skillText).toHaveAttribute('aria-expanded', 'true');

    // In the card preview, tapping the reversed side turns the card round.
    await page.getByRole('region', { name: t('game.hand') }).getByRole('button').first().tap();
    const dialog = page.getByRole('dialog');
    const card = dialog.locator('[data-card]');
    await expect(card).not.toHaveClass(/turned/);
    await dialog.getByRole('heading', { name: new RegExp(`^▼ ?${t('sideLabel.reversed')}`) }).tap();
    await expect(card).toHaveClass(/turned/);
    await dialog.getByRole('button', { name: t('game.turnCard') }).tap();
    await expect(card).not.toHaveClass(/turned/);
    expect(errors).toEqual([]);
  });
});

test.describe('phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('a phone gets the bigger-screen notice and can go on', async ({ page }) => {
    const t = tr('zh-Hant');
    await openApp(page, { lang: 'zh-Hant' });
    const notice = page.getByRole('dialog', { name: t('small.title') });
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: t('small.continue') }).tap();
    await expect(notice).toBeHidden();
    await page.reload();
    await expect(notice).toBeHidden();
  });
});
