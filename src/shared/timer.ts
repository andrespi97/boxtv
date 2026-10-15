import type { TimerState } from './types/signage';

export type TimerPhase = 'idle' | 'work' | 'rest' | 'paused' | 'finished';

export type TimerView = {
  phase: TimerPhase;
  /** Seconds remaining in the current phase. */
  remaining: number;
  /** Total seconds of the current phase (used for the progress bar). */
  phaseTotal: number;
  /** 0..1 progress within the current phase. */
  progress: number;
  round: number;
  rounds: number;
  mode: TimerState['mode'];
  label: string;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

/**
 * Derives everything the UI needs from the persisted TimerState.
 * The TV computes this locally every tick, so the server never has to
 * broadcast a message per second.
 */
export function computeTimerView(timer: TimerState, now: number = Date.now()): TimerView {
  const rounds = Math.max(1, timer.rounds);
  const base = {
    mode: timer.mode,
    round: timer.currentRound || 1,
    rounds,
  } as const;

  if (timer.status === 'idle') {
    return {
      ...base,
      phase: 'idle',
      remaining: timer.workSeconds,
      phaseTotal: timer.workSeconds,
      progress: 0,
      label: 'LISTO',
    };
  }

  if (timer.status === 'finished') {
    return {
      ...base,
      phase: 'finished',
      remaining: 0,
      phaseTotal: timer.workSeconds,
      progress: 1,
      label: 'FIN',
    };
  }

  // When paused the clock freezes at the instant it was paused.
  const anchor = timer.status === 'paused' && timer.pausedAt ? timer.pausedAt : now;
  const elapsed = timer.startedAt ? Math.max(0, Math.floor((anchor - timer.startedAt) / 1000)) : 0;

  if (timer.mode === 'intervals') {
    const work = Math.max(0, timer.workSeconds);
    const rest = Math.max(0, timer.restSeconds);
    const cycle = Math.max(1, work + rest);
    const total = cycle * rounds;

    if (elapsed >= total) {
      return {
        ...base,
        phase: 'finished',
        remaining: 0,
        phaseTotal: cycle,
        progress: 1,
        round: rounds,
        label: 'FIN',
      };
    }

    const index = Math.min(rounds - 1, Math.floor(elapsed / cycle));
    const inCycle = elapsed - index * cycle;
    const inRest = rest > 0 && inCycle >= work;
    const phase = inRest ? 'rest' : 'work';
    const phaseTotal = inRest ? rest : work;
    const phaseElapsed = inRest ? inCycle - work : inCycle;
    const remaining = Math.max(0, phaseTotal - phaseElapsed);

    return {
      phase: timer.status === 'paused' ? 'paused' : phase,
      mode: timer.mode,
      remaining,
      phaseTotal,
      progress: phaseTotal > 0 ? Math.min(1, phaseElapsed / phaseTotal) : 0,
      round: index + 1,
      rounds,
      label: inRest ? 'DESCANSO' : 'TRABAJO',
    };
  }

  // amrap / countdown share the same shape: count from 0 to workSeconds.
  const total = Math.max(0, timer.workSeconds);
  const capped = Math.min(elapsed, total);
  const remaining = Math.max(0, total - capped);
  return {
    ...base,
    phase: timer.status === 'paused' ? 'paused' : 'work',
    remaining,
    phaseTotal: total,
    progress: total > 0 ? Math.min(1, capped / total) : 0,
    label: timer.mode === 'amrap' ? 'AMRAP' : 'CUENTA ATRÁS',
  };
}

export function totalDuration(timer: TimerState): number {
  if (timer.mode === 'intervals') {
    return (Math.max(0, timer.workSeconds) + Math.max(0, timer.restSeconds)) * Math.max(1, timer.rounds);
  }
  return Math.max(0, timer.workSeconds);
}
