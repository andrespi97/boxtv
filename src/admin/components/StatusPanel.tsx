import type { ScreenRuntimeStatus } from '@/shared/types/signage';

export function StatusPanel({ statuses }: { statuses: ScreenRuntimeStatus[] }) {
  if (statuses.length === 0) {
    return <p className="text-sm text-slate-400">Sin datos de conexión todavía.</p>;
  }

  return (
    <ul className="space-y-2">
      {statuses.map((status) => (
        <li
          key={status.screenId}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2"
        >
          <span className="flex items-center gap-2 text-sm text-slate-200">
            <span
              className={`h-2.5 w-2.5 rounded-full ${status.connected ? 'bg-emerald-400' : 'bg-slate-500'}`}
            />
            {status.screenId}
          </span>
          <span className="text-right text-xs text-slate-400">
            {status.connected
              ? `${status.tvConnections} tele(s) conectada(s)`
              : 'Desconectada'}
            <br />
            {status.lastSeen ? `Último latido: ${formatRelative(status.lastSeen)}` : 'Sin latidos'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'hace unos segundos';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Date(timestamp).toLocaleString('es-ES');
}
