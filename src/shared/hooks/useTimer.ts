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
