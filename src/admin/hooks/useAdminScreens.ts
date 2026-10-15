import { useCallback, useEffect, useRef, useState } from 'react';
import type { GymStatus } from '@/shared/types/signage';
import { signageClient } from '@/shared/api/signageClient';

/** Polls the screen list + live connection status for the dashboard. */
export function useAdminScreens(intervalMs = 10_000) {
  const [data, setData] = useState<GymStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await signageClient.listScreens();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Error');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const interval = setInterval(() => void refresh(), intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [refresh, intervalMs]);

  return { data, error, loading, refresh };
}
