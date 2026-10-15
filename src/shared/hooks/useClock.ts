import { useEffect, useState } from 'react';

/** Ticks once per second; keeps working with no network connection. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const tick = () => setNow(new Date());

    // Align the first tick to the next second boundary.
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeout = setTimeout(() => {
      tick();
      timer = setInterval(tick, 1000);
    }, msToNextSecond);

    return () => {
      clearTimeout(timeout);
      if (timer) clearInterval(timer);
    };
  }, []);

  return now;
}
