import { Link } from 'react-router-dom';
import { useAdminScreens } from '@/admin/hooks/useAdminScreens';
import { Button } from '@/admin/components/ui';
import { formatRelative } from '@/admin/components/StatusPanel';

export function Dashboard() {
  const { data, error, loading, refresh } = useAdminScreens();

  return (
    <div className="admin-scroll min-h-screen bg-slate-950 pb-16 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-[4vw] py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Box Signage</h1>
            <p className="text-xs text-slate-400">
              {data ? `Gimnasio: ${data.gymId}` : 'Cargando…'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => void refresh()}>
            Actualizar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-[4vw] py-6">
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading && <p className="text-sm text-slate-400">Cargando pantallas…</p>}

        {data?.screens.map((screen) => {
          const status = data.statuses.find((s) => s.screenId === screen.id);
          const connected = status?.connected ?? false;
          return (
            <div
              key={screen.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  />
                  <h2 className="truncate text-base font-semibold">{screen.name}</h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  <code className="rounded bg-slate-800 px-1.5 py-0.5">/tv/{screen.id}</code>
                  <span className="ml-2 uppercase tracking-wide">{screen.main.type}</span>
                  {status?.lastSeen && ` · ${formatRelative(status.lastSeen)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={`/tv/${screen.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Ver
                </a>
                <Link
                  to={`/admin/${screen.id}`}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black hover:bg-orange-400"
                >
                  Editar
                </Link>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
