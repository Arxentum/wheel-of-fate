import type { Step } from '../../../engine';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

const STEPS: Exclude<Step, 'over'>[] = ['draw', 'play', 'flip', 'move', 'resolve', 'end'];

/** The six steps of a turn (Turn Flow), with the current one marked. */
export function TurnSteps({ step }: { step: Step }) {
  const { t } = useLang();
  const at = STEPS.indexOf(step as Exclude<Step, 'over'>);
  return (
    <ol className={styles.steps} aria-label={t('game.steps')}>
      {STEPS.map((s, i) => (
        <li
          key={s}
          className={i === at ? styles.stepNow : i < at ? styles.stepDone : styles.step}
          aria-current={i === at ? 'step' : undefined}
          title={t(`step.${s}`)}
        >
          <span className={styles.stepNo}>{i + 1}</span>
          <span className={styles.stepName}>{s === 'end' ? t('step.short.end') : t(`step.${s}`)}</span>
        </li>
      ))}
    </ol>
  );
}
