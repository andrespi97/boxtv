import { useEffect } from 'react';

/**
 * Reloads the page every night at 03:00 to free memory on long-running TV
 * browsers. The check runs once a minute and skips if the reload already
 * happened today.
 */
export function useNightlyRefresh(hour = 3): void {
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      if (now.getHours() === hour && now.getMinutes() === 0) {
        const last = sessionStorage.getItem('signage.lastNightlyRefresh');
        if (last !== stamp) {
          sessionStorage.setItem('signage.lastNightlyRefresh', stamp);
          window.location.reload();
        }
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [hour]);
}
