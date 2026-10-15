import { useEffect, useState } from 'react';
import type { TimerState } from '../types/signage';
import { computeTimerView, type TimerView } from '../timer';

/**
 * Recomputes the timer locally 4x/second. Ten TV players running the same
 * `startedAt` therefore stay in sync without the server streaming ticks.
 */
export function useTimer(timer: TimerState | null): TimerView | null {
  const [view, setView] = useState<TimerView | null>(() =>
    timer ? computeTimerView(timer) : null,
  );

  useEffect(() => {
    if (!timer) {
      setView(null);
      return;
    }
    setView(computeTimerView(timer));
    if (timer.status !== 'running') return;

    const interval = setInterval(() => {
      setView(computeTimerView(timer));
    }, 250);

    return () => clearInterval(interval);
  }, [timer]);

  return view;
}

/**
 * True while a timer is actively counting (running/paused and not yet expired).
 * Reuses the same local computation as the TV so the admin panel and the ad bar
 * agree with what is on screen, instead of trusting the stale server `status`
 * (the server never auto-finishes a timer).
 */
export function useTimerActive(timer: TimerState | null): boolean {
  const view = useTimer(timer);
  if (!timer) return false;
  if (timer.status !== 'running' && timer.status !== 'paused') return false;
  return view?.phase !== 'finished';
}
