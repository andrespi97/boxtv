import { useCallback, useState } from 'react';
import type { AdminCommand, Screen } from '@/shared/types/signage';
import { useScreenSocket } from '@/shared/hooks/useScreenSocket';
import { signageClient } from '@/shared/api/signageClient';

/**
 * Admin view of a single screen: receives live updates over WebSocket and
 * publishes commands over HTTP (which the DO then broadcasts to every TV).
 */
export function useAdminScreen(screenId: string) {
  const { screen, status } = useScreenSocket(screenId, 'admin', Boolean(screenId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (command: AdminCommand): Promise<Screen | null> => {
      setPending(true);
      setError(null);
      try {
        const result = await signageClient.sendCommand(screenId, command);
        return result.screen;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al enviar');
        return null;
      } finally {
        setPending(false);
      }
    },
    [screenId],
  );

  return { screen, status, pending, error, send };
}
